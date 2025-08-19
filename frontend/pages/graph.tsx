import { useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "../utils/supabaseClient";
import Graph from "../components/Graph";
import { useAuth } from "../context/AuthContext";

export default function GraphPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return loading || !user ? (
    <div>Loading...</div>
  ) : (
    <div className="p-4">
      <div className="flex justify-end mb-4 gap-4">
        <div>hello {user.user_metadata?.name || user.email}</div>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>

      <Graph />
    </div>
  );
}
