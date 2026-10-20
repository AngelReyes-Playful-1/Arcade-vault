"use client";

import { useEffect, useRef } from "react";
import type { GameProps } from "./types";

const W = 800;
const H = 600;

export default function AsteroidsGame({
  paused,
  onScoreChange,
  onLivesChange,
  onLevelChange,
  onGameOver,
}: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Refs para que el loop lea siempre los valores actuales sin reiniciar el efecto
  const pausedRef = useRef(paused);
  const callbacksRef = useRef({
    onScoreChange,
    onLivesChange,
    onLevelChange,
    onGameOver,
  });

  useEffect(() => {
    pausedRef.current = paused;
    callbacksRef.current = {
      onScoreChange,
      onLivesChange,
      onLevelChange,
      onGameOver,
    };
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctxOrNull = canvas.getContext("2d");
    if (!ctxOrNull) return;
    const ctx: CanvasRenderingContext2D = ctxOrNull;

    // ── Input ─────────────────────────────────────────────────────────────────
    const keys: Record<string, boolean> = {};
    const justPressed: Record<string, boolean> = {};

    function onKeyDown(e: KeyboardEvent) {
      justPressed[e.code] = !keys[e.code];
      keys[e.code] = true;
      if (
        ["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(
          e.code,
        )
      )
        e.preventDefault();
    }
    function onKeyUp(e: KeyboardEvent) {
      keys[e.code] = false;
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    function pressed(code: string) {
      const val = justPressed[code];
      justPressed[code] = false;
      return val;
    }

    // ── Utils ─────────────────────────────────────────────────────────────────
    type Point = { x: number; y: number };
    const wrap = (v: number, max: number) => ((v % max) + max) % max;
    const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
    const rand = (min: number, max: number) =>
      min + Math.random() * (max - min);
    const randInt = (min: number, max: number) =>
      Math.floor(rand(min, max + 1));

    // ── Bullet ────────────────────────────────────────────────────────────────
    class Bullet {
      x: number;
      y: number;
      vx: number;
      vy: number;
      ttl = 1.1;
      radius = 2;
      dead = false;

      constructor(x: number, y: number, angle: number) {
        this.x = x;
        this.y = y;
        const SPEED = 520;
        this.vx = Math.cos(angle) * SPEED;
        this.vy = Math.sin(angle) * SPEED;
      }

      update(dt: number) {
        this.x = wrap(this.x + this.vx * dt, W);
        this.y = wrap(this.y + this.vy * dt, H);
        this.ttl -= dt;
        if (this.ttl <= 0) this.dead = true;
      }

      draw() {
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // ── Asteroid ──────────────────────────────────────────────────────────────
    const RADII = [0, 16, 30, 50]; // por tamaño 1, 2, 3
    const SPEEDS = [0, 85, 55, 32]; // velocidad base por tamaño
    const POINTS = [0, 100, 50, 20]; // puntos por tamaño

    class Asteroid {
      x: number;
      y: number;
      size: number;
      radius: number;
      dead = false;
      vx: number;
      vy: number;
      rotSpeed: number;
      rot: number;
      verts: [number, number][];

      constructor(x: number, y: number, size = 3) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.radius = RADII[size];

        const angle = rand(0, Math.PI * 2);
        const speed = SPEEDS[size] + rand(-15, 15);
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.rotSpeed = rand(-1.2, 1.2);
        this.rot = rand(0, Math.PI * 2);

        // Polígono irregular
        const n = randInt(8, 13);
        this.verts = [];
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2;
          const r = this.radius * rand(0.6, 1.0);
          this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
        }
      }

      update(dt: number) {
        this.x = wrap(this.x + this.vx * dt, W);
        this.y = wrap(this.y + this.vy * dt, H);
        this.rot += this.rotSpeed * dt;
      }

      split(): Asteroid[] {
        if (this.size <= 1) return [];
        return [
          new Asteroid(this.x, this.y, this.size - 1),
          new Asteroid(this.x, this.y, this.size - 1),
        ];
      }

      draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rot);
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1.5;
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(this.verts[0][0], this.verts[0][1]);
        for (let i = 1; i < this.verts.length; i++)
          ctx.lineTo(this.verts[i][0], this.verts[i][1]);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      }
    }

    // ── Power-up ──────────────────────────────────────────────────────────────
    const POWERUP_CHANCE = 0.12; // probabilidad por asteroide destruido
    const TRIPLE_DURATION = 5; // segundos de disparo triple
    const SPREAD = 0.2; // separación angular del abanico (rad)

    // ── Ship ──────────────────────────────────────────────────────────────────
    class Ship {
      x = 0;
      y = 0;
      angle = 0;
      vx = 0;
      vy = 0;
      radius = 12;
      thrusting = false;
      invincible = 0;
      shootCooldown = 0;
      tripleShot = 0; // segundos restantes de disparo triple
      dead = false;

      constructor() {
        this.reset();
      }

      reset() {
        this.x = W / 2;
        this.y = H / 2;
        this.angle = -Math.PI / 2;
        this.vx = 0;
        this.vy = 0;
        this.radius = 12;
        this.thrusting = false;
        this.invincible = 3;
        this.shootCooldown = 0;
        this.tripleShot = 0;
        this.dead = false;
      }

      update(dt: number) {
        if (this.dead) return;
        if (this.invincible > 0) this.invincible -= dt;
        if (this.shootCooldown > 0) this.shootCooldown -= dt;
        if (this.tripleShot > 0) this.tripleShot -= dt;

        const ROT = 3.5; // rad/s
        const THRUST = 260; // px/s²
        const DRAG = 0.987;

        if (keys["ArrowLeft"]) this.angle -= ROT * dt;
        if (keys["ArrowRight"]) this.angle += ROT * dt;

        this.thrusting = !!keys["ArrowUp"];
        if (this.thrusting) {
          this.vx += Math.cos(this.angle) * THRUST * dt;
          this.vy += Math.sin(this.angle) * THRUST * dt;
        }

        this.vx *= DRAG;
        this.vy *= DRAG;
        this.x = wrap(this.x + this.vx * dt, W);
        this.y = wrap(this.y + this.vy * dt, H);
      }

      tryShoot(): Bullet[] {
        if (this.shootCooldown > 0 || this.dead) return [];
        this.shootCooldown = 0.2;
        const NOSE = 21;
        const ox = this.x + Math.cos(this.angle) * NOSE;
        const oy = this.y + Math.sin(this.angle) * NOSE;
        if (this.tripleShot > 0) {
          // Abanico de 3 balas simultáneas
          return [-SPREAD, 0, SPREAD].map(
            (da) => new Bullet(ox, oy, this.angle + da),
          );
        }
        return [new Bullet(ox, oy, this.angle)];
      }

      draw() {
        if (this.dead) return;
        // Parpadeo durante invencibilidad de reaparición
        if (this.invincible > 0 && Math.floor(this.invincible * 8) % 2 === 0)
          return;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1.5;
        ctx.lineJoin = "round";

        // Silueta clásica: triángulo con muesca trasera
        ctx.beginPath();
        ctx.moveTo(20, 0); // nariz
        ctx.lineTo(-12, -9); // ala izquierda
        ctx.lineTo(-7, 0); // muesca trasera
        ctx.lineTo(-12, 9); // ala derecha
        ctx.closePath();
        ctx.stroke();

        // Llama del propulsor
        if (this.thrusting && Math.random() > 0.35) {
          ctx.beginPath();
          ctx.moveTo(-8, -4);
          ctx.lineTo(-8 - rand(6, 14), 0);
          ctx.lineTo(-8, 4);
          ctx.strokeStyle = "rgba(255, 130, 0, 0.85)";
          ctx.stroke();
        }

        ctx.restore();
      }
    }

    // ── Partículas (explosión) ────────────────────────────────────────────────
    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      ttl: number;
      dead = false;

      constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        const angle = rand(0, Math.PI * 2);
        const speed = rand(30, 130);
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.life = rand(0.4, 1.1);
        this.ttl = this.life;
      }

      update(dt: number) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.ttl -= dt;
        if (this.ttl <= 0) this.dead = true;
      }

      draw() {
        const alpha = this.ttl / this.life;
        ctx.strokeStyle = `rgba(255,255,255,${alpha.toFixed(2)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x - this.vx * 0.05, this.y - this.vy * 0.05);
        ctx.stroke();
      }
    }

    class PowerUp {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius = 12;
      ttl = 8;
      dead = false;

      constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        const angle = rand(0, Math.PI * 2);
        this.vx = Math.cos(angle) * 40;
        this.vy = Math.sin(angle) * 40;
      }

      update(dt: number) {
        this.x = wrap(this.x + this.vx * dt, W);
        this.y = wrap(this.y + this.vy * dt, H);
        this.ttl -= dt;
        if (this.ttl <= 0) this.dead = true;
      }

      draw() {
        // Parpadeo en los últimos 2 segundos
        if (this.ttl < 2 && Math.floor(this.ttl * 8) % 2 === 0) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.strokeStyle = "#0ff";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.stroke();

        // Icono: tres líneas en abanico
        ctx.beginPath();
        for (const da of [-0.5, 0, 0.5]) {
          const a = -Math.PI / 2 + da;
          ctx.moveTo(0, 5);
          ctx.lineTo(Math.cos(a) * 8, 5 + Math.sin(a) * 12);
        }
        ctx.stroke();
        ctx.restore();
      }
    }

    // ── Estado del juego ──────────────────────────────────────────────────────
    let ship: Ship;
    let bullets: Bullet[];
    let asteroids: Asteroid[];
    let particles: Particle[];
    let powerUp: PowerUp | null; // power-up activo en pantalla; solo uno por juego
    let powerUpSpawned: boolean;
    let score: number;
    let lives: number;
    let level: number;
    let state: "playing" | "dead" | "gameover";
    let deadTimer = 0;

    function spawnAsteroids(count: number) {
      const SAFE_DIST = 130;
      for (let i = 0; i < count; i++) {
        let x: number, y: number;
        do {
          x = rand(0, W);
          y = rand(0, H);
        } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_DIST);
        asteroids.push(new Asteroid(x, y, 3));
      }
    }

    function initGame() {
      ship = new Ship();
      bullets = [];
      asteroids = [];
      particles = [];
      powerUp = null;
      powerUpSpawned = false;
      score = 0;
      lives = 3;
      level = 1;
      state = "playing";
      spawnAsteroids(4);
    }

    function nextLevel() {
      level++;
      bullets = [];
      particles = [];
      // Conservar el disparo triple al pasar de nivel
      const triple = ship.tripleShot;
      ship.reset();
      ship.tripleShot = triple;
      spawnAsteroids(3 + level);
    }

    function explode(x: number, y: number, count = 8) {
      for (let i = 0; i < count; i++) particles.push(new Particle(x, y));
    }

    function killShip() {
      explode(ship.x, ship.y, 14);
      ship.dead = true;
      lives--;
      if (lives <= 0) {
        state = "gameover";
      } else {
        state = "dead";
        deadTimer = 2;
      }
    }

    // ── Update ────────────────────────────────────────────────────────────────
    function updatePowerUp(dt: number) {
      if (!powerUp) return;
      powerUp.update(dt);
      if (powerUp.dead) powerUp = null;
    }

    function update(dt: number) {
      if (state === "gameover") {
        // El reinicio lo controla la plataforma (modal React)
        particles.forEach((p) => p.update(dt));
        particles = particles.filter((p) => !p.dead);
        return;
      }

      if (state === "dead") {
        deadTimer -= dt;
        particles.forEach((p) => p.update(dt));
        particles = particles.filter((p) => !p.dead);
        asteroids.forEach((a) => a.update(dt));
        updatePowerUp(dt);
        if (deadTimer <= 0) {
          state = "playing";
          ship.reset();
        }
        return;
      }

      // Disparar
      if (pressed("Space")) {
        bullets.push(...ship.tryShoot());
      }

      ship.update(dt);
      bullets.forEach((b) => b.update(dt));
      asteroids.forEach((a) => a.update(dt));
      particles.forEach((p) => p.update(dt));
      updatePowerUp(dt);

      bullets = bullets.filter((b) => !b.dead);
      particles = particles.filter((p) => !p.dead);

      // Bala vs asteroide
      const newAsteroids: Asteroid[] = [];
      for (const b of bullets) {
        for (const a of asteroids) {
          if (!a.dead && !b.dead && dist(b, a) < a.radius) {
            b.dead = true;
            a.dead = true;
            score += POINTS[a.size];
            explode(a.x, a.y, a.size * 5);
            newAsteroids.push(...a.split());
            if (!powerUpSpawned && Math.random() < POWERUP_CHANCE) {
              powerUp = new PowerUp(a.x, a.y);
              powerUpSpawned = true;
            }
          }
        }
      }
      asteroids = asteroids.filter((a) => !a.dead).concat(newAsteroids);
      bullets = bullets.filter((b) => !b.dead);

      // Nave vs power-up
      if (
        powerUp &&
        !ship.dead &&
        dist(ship, powerUp) < ship.radius + powerUp.radius
      ) {
        ship.tripleShot = TRIPLE_DURATION;
        explode(powerUp.x, powerUp.y, 6);
        powerUp = null;
      }

      // Nave vs asteroide
      if (ship.invincible <= 0) {
        for (const a of asteroids) {
          if (dist(ship, a) < ship.radius + a.radius * 0.82) {
            killShip();
            break;
          }
        }
      }

      // Nivel completado
      if (asteroids.length === 0) nextLevel();
    }

    // ── Draw ──────────────────────────────────────────────────────────────────
    function drawLifeIcon(x: number, y: number) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(-Math.PI / 2);
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 1.2;
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(9, 0);
      ctx.lineTo(-6, -5);
      ctx.lineTo(-3, 0);
      ctx.lineTo(-6, 5);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    }

    function drawHUD() {
      ctx.fillStyle = "#fff";
      ctx.font = "15px monospace";

      ctx.textAlign = "left";
      ctx.fillText(`SCORE  ${score}`, 14, 26);

      ctx.textAlign = "center";
      ctx.fillText(`NIVEL ${level}`, W / 2, 26);

      for (let i = 0; i < lives; i++) drawLifeIcon(W - 16 - i * 22, 18);

      if (ship.tripleShot > 0) {
        ctx.textAlign = "left";
        ctx.fillStyle = "#0ff";
        ctx.fillText(`TRIPLE  ${Math.ceil(ship.tripleShot)}s`, 14, 46);
      }
    }

    function draw() {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);

      particles.forEach((p) => p.draw());
      asteroids.forEach((a) => a.draw());
      if (powerUp) powerUp.draw();
      bullets.forEach((b) => b.draw());
      ship.draw();

      drawHUD();
    }

    // ── Notificación a React ──────────────────────────────────────────────────
    let prevScore = -1;
    let prevLives = -1;
    let prevLevel = -1;
    let gameOverNotified = false;

    function notify() {
      const cb = callbacksRef.current;
      if (score !== prevScore) {
        prevScore = score;
        cb.onScoreChange(score);
      }
      if (lives !== prevLives) {
        prevLives = lives;
        cb.onLivesChange?.(lives);
      }
      if (level !== prevLevel) {
        prevLevel = level;
        cb.onLevelChange?.(level);
      }
      if (state === "gameover" && !gameOverNotified) {
        gameOverNotified = true;
        cb.onGameOver(score);
      }
    }

    // ── Loop principal ────────────────────────────────────────────────────────
    let lastTime: number | null = null;
    let rafId = 0;

    function loop(ts: number) {
      const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
      lastTime = ts;
      if (!pausedRef.current) update(dt);
      draw();
      notify();
      rafId = requestAnimationFrame(loop);
    }

    initGame();
    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      style={{ display: "block", width: "100%", height: "100%" }}
    />
  );
}
