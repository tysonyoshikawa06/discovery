import React, { useEffect, useRef, useState } from "react";
import cytoscape, { Core } from "cytoscape";
import { useRouter } from "next/router";

type EdgePopup = {
  description: string;
  x: number;
  y: number;
} | null;

// onCyInit is an optional prop; if provided, must take a Core parameter
const Graph = ({ onCyInit }: { onCyInit?: (cyInstance: Core) => void }) => {
  // creates pointer to div element (initialized below through ref={cy})
  const cyContainer = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const [edgePopup, setEdgePopup] = useState<EdgePopup>(null);

  useEffect(() => {
    const loadGraph = async () => {
      const res = await fetch("/data/apchem.json");
      const data = await res.json();

      if (cyContainer.current) {
        const cyInstance = cytoscape({
          // this container is the div element that cyContainer.current references
          container: cyContainer.current,
          elements: [...data.nodes, ...data.edges],
          layout: {
            name: "cose",
            idealEdgeLength: 100,
            nodeRepulsion: 400000,
            gravity: 80,
            numIter: 1000,
            padding: 125,
            animate: false,
          },

          style: [
            {
              selector: "node",
              style: {
                label: "data(label)",
                "text-valign": "center",
                "text-halign": "center",
                "background-color": "#ccc", // default color
              },
            },
            {
              selector:
                'node[unit = "Unit 1: Atomic Structures and Properties"]',
              style: {
                "background-color": "#60a5fa", // tailwind's blue 400
              },
            },
            {
              selector:
                'node[unit = "Unit 2: Compound Structure and Properties"]',
              style: {
                "background-color": "#F87171", // tailwind's red 400
              },
            },
            {
              selector: "edge",
              style: {
                "curve-style": "bezier",
                "line-color": "#999",
                "target-arrow-color": "#999",
              },
            },
          ],
        });

        cyInstance.on("tap", "edge", (event) => {
          const description = event.target.data("description");
          const { x, y } = event.renderedPosition || { x: 100, y: 100 };
          setEdgePopup({ description, x, y });
        });

        cyInstance.on("tap", (event) => {
          if (event.target === cyInstance) {
            setEdgePopup(null);
          }
        });

        cyInstance.on("tap", "node", (event) => {
          const node = event.target;
          console.log("node id:", node.id());
          const nodeId = event.target.id();
          router.push(`/topics/apchem/${nodeId}`);
        });

        // pass instance back to parent
        // check to see if onCyInit exists since it is typed as an optional prop
        if (onCyInit) {
          onCyInit(cyInstance);
        }
      }
    };
    loadGraph();
  });

  return (
    <>
      <div ref={cyContainer} style={{ height: "600px", width: "100%" }} />
      {edgePopup && (
        <div
          className="absolute bg-white border border-gray-400 p-2 rounded shadow-md text-sm max-w-sm"
          style={{ top: edgePopup.y, left: edgePopup.x }}
        >
          <p>{edgePopup.description}</p>
        </div>
      )}
    </>
  );
};

export default Graph;
