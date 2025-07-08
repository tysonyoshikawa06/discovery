import React, { useRef } from "react";
import dynamic from "next/dynamic";
import type { Core } from "cytoscape";

// dynamic import to avoid SSR issues
const Graph = dynamic(() => import("../components/Graph"), { ssr: false });

export default function Home() {
  const cyRef = useRef<Core | null>(null);

  return (
    <main>
      <h1 className="text-4xl font-bold border-b p-4">
        AP Chemistry Topic Graph
      </h1>
      {/* defines function that allows cyInstance to be lifted from Graph */}
      <Graph onCyInit={(cyInstance) => (cyRef.current = cyInstance)} />
    </main>
  );
}
