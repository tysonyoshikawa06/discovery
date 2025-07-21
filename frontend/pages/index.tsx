import React, { useRef } from "react";
// import dynamic from "next/dynamic";
import type { Core } from "cytoscape";
import Login from "./login";

// dynamic import to avoid SSR issues
// const Graph = dynamic(() => import("../components/Graph"), { ssr: false });

export default function Home() {
  const cyRef = useRef<Core | null>(null);

  return (
    <main>
      <Login />
    </main>
  );
}
