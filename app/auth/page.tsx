'use client';

import { useRouter } from 'next/navigation';
import { use, useState } from 'react';
import { useUser } from '@/app/context/UserContext';
import { createClient } from '@/lib/supabase/client';

type AuthStatus = 'idle' | 'sending' | 'check-email' | 'error';

const USERNAME_RE = /^[A-Z0-9_]{3,10}$/;

function authErrorMessage(message: string) {
  if (message.includes('Database error saving new user')) return 'USERNAME NO DISPONIBLE';
  if (message.includes('Invalid login credentials')) return 'CORREO O CONTRASEÑA INCORRECTOS';
  if (message.includes('Email not confirmed')) return 'CONFIRMA TU CORREO ANTES DE ENTRAR';
  if (message.includes('Password should be')) return 'LA CONTRASEÑA DEBE TENER AL MENOS 6 CARACTERES';
  return message.toUpperCase();
}

const CONFIRM_ERROR = 'NO SE PUDO CONFIRMAR TU CORREO. EL ENLACE EXPIRÓ O YA SE USÓ';

export default function Auth({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const confirmFailed = use(searchParams).error === 'confirm';
  const [tab, setTab] = useState<'in' | 'up'>('in');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [status, setStatus] = useState<AuthStatus>(confirmFailed ? 'error' : 'idle');
  const [errorMsg, setErrorMsg] = useState(confirmFailed ? CONFIRM_ERROR : '');
  const [supabase] = useState(() => createClient());
  const { signOut } = useUser();
  const router = useRouter();

  function switchTab(next: 'in' | 'up') {
    setTab(next);
    setStatus('idle');
    setErrorMsg('');
  }

  function fail(message: string) {
    setErrorMsg(message);
    setStatus('error');
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    if (tab === 'up' && !USERNAME_RE.test(username)) {
      fail('USUARIO: 3–10 CARACTERES, SOLO A-Z, 0-9 Y _');
      return;
    }

    setStatus('sending');
    setErrorMsg('');

    if (tab === 'in') {
      const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error) return fail(authErrorMessage(error.message));
      router.push('/');
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: { username },
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
      },
    });
    if (error) return fail(authErrorMessage(error.message));
    setStatus('check-email');
  }

  async function playAsGuest() {
    await signOut();
    router.push('/');
  }

  const sending = status === 'sending';

  return (
    <div className="av-auth-wrap fade-in">
      <div className="auth-card">
        <div className="auth-header">
          <div className="mark" />
          <h2 className="neon-cyan">ARCADE VAULT</h2>
          <div className="mono" style={{ fontSize: 11, color: 'var(--ink-faint)', letterSpacing: '0.16em', marginTop: 6 }}>
            ACCESO AL SISTEMA · v2.6
          </div>
        </div>

        {status === 'check-email' ? (
          <div className="auth-check slide-in">
            <h3 className="neon-green">REVISA TU CORREO</h3>
            <p>
              Enviamos un enlace de confirmación a <strong>{email}</strong>.
              Ábrelo para activar tu cuenta y entrar al vault.
            </p>
            <button className="btn ghost" style={{ width: '100%' }} onClick={() => switchTab('in')}>
              VOLVER A INICIAR SESIÓN
            </button>
          </div>
        ) : (
          <>
            <div className="auth-tabs">
              <button className={tab === 'in' ? 'on' : ''} onClick={() => switchTab('in')}>
                INICIAR SESIÓN
              </button>
              <button className={tab === 'up' ? 'on' : ''} onClick={() => switchTab('up')}>
                CREAR CUENTA
              </button>
            </div>

            <form onSubmit={submit}>
              {tab === 'up' && (
                <div className="field slide-in">
                  <label>Usuario</label>
                  <input
                    value={username}
                    onChange={e => setUsername(e.target.value.toUpperCase().slice(0, 10))}
                    placeholder="PX_KAI"
                    autoComplete="username"
                    required
                  />
                </div>
              )}
              <div className="field">
                <label>Correo electrónico</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="jugador@vault.gg"
                  autoComplete="email"
                  required
                />
              </div>
              <div className="field">
                <label>Contraseña</label>
                <input
                  type="password"
                  value={pass}
                  onChange={e => setPass(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={tab === 'in' ? 'current-password' : 'new-password'}
                  required
                />
              </div>
              {status === 'error' && (
                <p className="form-err pixel" role="alert">⚠ {errorMsg}</p>
              )}
              <button className="btn lg" type="submit" disabled={sending} style={{ width: '100%', marginTop: 8 }}>
                {sending ? 'CONECTANDO…' : tab === 'in' ? 'ENTRAR AL VAULT' : 'CREAR Y JUGAR'}
              </button>
            </form>
          </>
        )}

        <button className="btn ghost" style={{ width: '100%', marginTop: 10 }} onClick={playAsGuest}>
          JUGAR COMO INVITADO
        </button>

        <div className="auth-divider">O CONTINÚA CON</div>
        <div className="social">
          <button className="btn ghost" type="button" disabled>
            ◆ GOOGLE <span className="soon-tag">PRONTO</span>
          </button>
          <button className="btn ghost" type="button" disabled>
            ▣ GITHUB <span className="soon-tag">PRONTO</span>
          </button>
        </div>

        <div style={{ marginTop: 18, textAlign: 'center', fontSize: 11, color: 'var(--ink-faint)', letterSpacing: '0.1em' }}>
          AL ENTRAR ACEPTAS LOS TÉRMINOS DEL SALÓN ARCADE
        </div>
      </div>
    </div>
  );
}
