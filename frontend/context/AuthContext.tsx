import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "../utils/supabaseClient";

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

const saveUserToDatabase = async (
  userId: string,
  userEmail: string,
  userName: string
) => {
  const { error } = await supabase
    .from("users")
    .upsert({ id: userId, email: userEmail, name: userName })
    .select()
    .single();
  if (error) {
    if (error.code === "23505") {
      console.log("User already exists in database.");
      return;
    }
    throw error;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // loads session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (session?.user) {
        saveUserToDatabase(
          session.user.id,
          session.user.email ?? "",
          session.user.user_metadata.name
        );
      }
    });

    // attempts to save user to db on auth state change
    const { data: subscription } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await saveUserToDatabase(
            session.user.id,
            session.user.email ?? "",
            session.user.user_metadata.name
          );
        }
      }
    );

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, []);

  // google sign in
  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
    });
    if (error) console.error("Google login error:", error);
  };

  // sign out
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error("Sign-out error:", error);
  };

  return (
    <AuthContext.Provider
      value={{ session, user, loading, signInWithGoogle, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};
