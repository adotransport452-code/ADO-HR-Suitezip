import { createContext, useContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { initPromise, getSupabase, isReady } from "@/lib/supabase";

interface Profile {
  id: string;
  email: string;
  fullName?: string;
  role: string;
}

interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
  signIn: async () => {},
  signOut: async () => {},
  getToken: async () => null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile(u: User) {
    try {
      const supabase = getSupabase();
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", u.id)
        .single();
      if (data) {
        setProfile({
          id: data.id,
          email: data.email,
          fullName: data.full_name,
          role: data.role,
        });
      } else {
        setProfile({ id: u.id, email: u.email ?? "", role: "user" });
      }
    } catch {
      setProfile({ id: u.id, email: u.email ?? "", role: "user" });
    }
  }

  useEffect(() => {
    initPromise.then(async () => {
      if (!isReady()) {
        setLoading(false);
        return;
      }
      try {
        const supabase = getSupabase();
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          await loadProfile(session.user);
        }
        setLoading(false);

        supabase.auth.onAuthStateChange(async (_event, session) => {
          if (session?.user) {
            setUser(session.user);
            await loadProfile(session.user);
          } else {
            setUser(null);
            setProfile(null);
          }
          setLoading(false);
        });
      } catch {
        setLoading(false);
      }
    });
  }, []);

  async function signIn(email: string, password: string) {
    const supabase = getSupabase();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
  }

  async function signOut() {
    try {
      const supabase = getSupabase();
      await supabase.auth.signOut();
    } catch {}
    setUser(null);
    setProfile(null);
  }

  async function getToken(): Promise<string | null> {
    try {
      const supabase = getSupabase();
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token ?? null;
    } catch {
      return null;
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      isAdmin: profile?.role === "admin",
      signIn,
      signOut,
      getToken,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
