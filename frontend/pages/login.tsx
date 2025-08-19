import { useEffect } from "react";
import { supabase } from "../utils/supabaseClient";
import { useRouter } from "next/router";

export default function LoginPage() {
  const router = useRouter();

  // if already logged in, redirect to /graph
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push("/graph");
    });
  }, []);

  const handleGoogleLogin = async () => {
    // destructures to find error
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/graph`,
      },
    });
    if (error) {
      console.error("Google sign-in failed:", error.message);
      alert("Login failed: " + error.message);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <form
        onSubmit={handleGoogleLogin}
        className="bg-white p-6 rounded shadow-md w-96 flex flex-col text-center"
      >
        <h1>Welcome to Valence</h1>
        <button
          className="w-full bg-red-500 text-white p-2 rounded hover:bg-red-600"
          type="button"
          onClick={handleGoogleLogin}
        >
          Continue with Google
        </button>
      </form>
    </div>
  );
}
