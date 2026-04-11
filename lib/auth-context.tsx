import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { supabase } from "./supabase";
import type { Session } from "@supabase/supabase-js";

/* ── Types ──────────────────────────────────────────────────── */

type AuthState = {
  /** Current Supabase session (null when logged out or still loading). */
  session: Session | null;
  /** True while we check for a persisted session on startup. */
  loading: boolean;
  /** The access token — convenience shortcut. */
  accessToken: string | null;
  /** Authed user email. */
  email: string | null;

  /** Send an OTP code to the given email. Returns error message or null. */
  sendOtp: (email: string) => Promise<string | null>;
  /** Verify the OTP code. Returns error message or null. */
  verifyOtp: (email: string, code: string) => Promise<string | null>;
  /** Sign out and clear session. */
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

/* ── Provider ───────────────────────────────────────────────── */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for persisted session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, s) => {
        setSession(s);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // Send OTP code to email
  const sendOtp = useCallback(
    async (email: string): Promise<string | null> => {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          // No emailRedirectTo needed — user enters code in-app
          shouldCreateUser: false, // Only existing paid users
        },
      });
      return error ? error.message : null;
    },
    []
  );

  // Verify OTP code
  const verifyOtp = useCallback(
    async (email: string, code: string): Promise<string | null> => {
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: code.trim(),
        type: "email",
      });
      return error ? error.message : null;
    },
    []
  );

  // Sign out
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
  }, []);

  const value: AuthState = {
    session,
    loading,
    accessToken: session?.access_token ?? null,
    email: session?.user?.email ?? null,
    sendOtp,
    verifyOtp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/* ── Hook ───────────────────────────────────────────────────── */

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
