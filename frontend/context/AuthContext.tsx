import { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "../utils/supabaseClient";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        console.log("auth state has changed: ", session);

        if (session?.user) {
          saveUserToDatabase(session.user);
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const saveUserToDatabase = async (user: User) => {
    try {
      const { data, error } = await supabase.from("users").insert(
        {
          email: user.email,
          name: user.user_metadata.name,
        },
        {
          onConflict: ["id"], // prevents inserting if ID already exists
          ignoreDuplicates: true, // ON CONFLICT DO NOTHING
        }
      );

      if (error) {
        throw error;
      }

      console.log("User saved to DB:", data);
    } catch (err) {
      console.error("Error saving user to DB:", err.message || err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
