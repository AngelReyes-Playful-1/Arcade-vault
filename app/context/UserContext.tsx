'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

interface UserContextValue {
  user: string | null;          // username de profiles (compat. con consumidores actuales)
  userId: string | null;        // auth.users.id
  email: string | null;
  loading: boolean;             // true hasta resolver la sesión inicial
  signOut: () => Promise<void>;
}

const UserContext = createContext<UserContextValue>({
  user: null,
  userId: null,
  email: null,
  loading: true,
  signOut: async () => {},
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    // Limpia el login falso de versiones anteriores
    localStorage.removeItem('av_user');

    async function applyUser(authUser: User | null) {
      if (!authUser) {
        if (!active) return;
        setUser(null);
        setUserId(null);
        setEmail(null);
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', authUser.id)
        .maybeSingle();

      if (!active) return;
      setUser(data?.username ?? null);
      setUserId(authUser.id);
      setEmail(authUser.email ?? null);
      setLoading(false);
    }

    supabase.auth.getUser().then(({ data }) => applyUser(data.user));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // No usar await de supabase dentro del callback (puede bloquear el cliente)
      setTimeout(() => applyUser(session?.user ?? null), 0);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <UserContext.Provider value={{ user, userId, email, loading, signOut }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
