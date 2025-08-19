import fs from "fs";
import path from "path";
import Chatbot from "../../../components/Chatbot";
import { GetStaticProps, GetStaticPaths } from "next";
import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { useRouter } from "next/router";
import { useState } from "react";

type PageProps = {
  markdownText: string;
  mdxSource: MDXRemoteSerializeResult;
  subject: string;
  node: { data: { id: string; label: string; description?: string } };
  connectedNodes: {
    data: {
      id: string;
      label: string;
      description?: string;
    };
  }[];
};

export default function NodePage({
  markdownText,
  mdxSource,
  subject,
  node,
  connectedNodes,
}: PageProps) {
  const router = useRouter();
  //
  const [selectedNode, setSelectedNode] = useState<null | {
    label: string;
    id: string;
    description: string;
  }>(null);
  const [edgeDescription, setEdgeDescription] = useState<string | null>(null);

  // Format nodeId in alphabetical order to find the correct edge
  const getEdgeId = (id1: string, id2: string) => {
    const [a, b] = [id1, id2].sort();
    return `${a}_TO_${b}`;
  };

  const handleConnectedNodeClick = (clickedNode: {
    data: { label: string; id: string };
  }) => {
    const edgeId = getEdgeId(node.data.id, clickedNode.data.id);

    // Load the correct edge description from the JSON file (stored in page props)
    fetch(`/data/${subject}.json`)
      .then((res) => res.json())
      .then((data) => {
        const edge = data.edges.find((e: any) => e.data.id === edgeId);
        setEdgeDescription(
          edge?.data.description || "No explanation available."
        );
        setSelectedNode({
          label: clickedNode.data.label,
          id: clickedNode.data.id,
          description: edge?.data.description || "No explanation available.",
        });
      });
  };

  const closeModal = () => {
    setSelectedNode(null);
    setEdgeDescription(null);
  };
  //
  return (
    <div>
      {/* nav */}
      <div className="border-b p-5 flex justify-between items-center sticky top-0 bg-white z-10">
        <button className="border rounded-sm p-2" onClick={() => router.back()}>
          ⬅️ Back
        </button>
        <h1 className="text-3xl font-bold text-center">
          {node.data.unit}: {node.data.label}
        </h1>
        <div></div>
      </div>
      <div className="prose prose-lg p-4 flex w-full">
        {/* first div */}
        <div className="w-[20%] p-4 sticky top-[80px] self-start h-[calc(100vh-80px)] overflow-y-auto bg-white z-0">
          <h2 className="text-lg font-bold underline">Connected Topics</h2>
          <ul className="list-disc space-y-2">
            {connectedNodes.map((e, i) => (
              <li
                key={i}
                className="text-blue-600 cursor-pointer hover:underline"
                onClick={() => handleConnectedNodeClick(e)}
              >
                {e.data.label}
              </li>
            ))}
          </ul>
        </div>

        {/* second div */}
        <div className="w-[60%]">
          <MDXRemote {...mdxSource} />
        </div>

        {/* third div */}
        <div className="w-[20%]">
          <Chatbot nodeId={node.data.id} />
        </div>
        {/* popup modal */}
        {selectedNode && (
          <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full space-y-4">
              <h2 className="text-xl font-bold">{selectedNode.label}</h2>
              <p className="text-gray-700">{edgeDescription}</p>
              <div className="flex justify-end space-x-4 mt-4">
                <button
                  className="px-4 py-2 bg-gray-300 rounded"
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                  onClick={() =>
                    router
                      .push(`/topics/${subject}/${selectedNode.id}`)
                      .then(() => {
                        router.reload(); // force page reload after url update
                      })
                  }
                >
                  Visit Topic →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const subject = "apchem";
  // reads apchem json file and stores it in fileData as an object
  const fileData = JSON.parse(
    fs.readFileSync(
      path.join(process.cwd(), "public/data", `${subject}.json`),
      "utf8"
    )
  );
  // creates list of all possible paths
  const paths = fileData.nodes.map((node: any) => ({
    params: { subject: subject, nodeId: node.data.id },
  }));

  return {
    paths,
    // all paths generated
    fallback: "blocking",
  };
};

// ran for every page on build time (loops through path array)
export const getStaticProps: GetStaticProps = async ({ params }) => {
  const nodeId = params!.nodeId;
  const topicMarkdownPath = path.join(
    process.cwd(),
    "content",
    `${nodeId}.mdx`
  );
  const markdownText: string = fs.readFileSync(topicMarkdownPath, "utf8");

  // extract fields from params object
  const subject = params?.subject as string;

  // reads json file corresponding to params.subject and stores it in data
  const jsonFilePath = path.join(
    process.cwd(),
    "public/data",
    `${subject}.json`
  );
  const jsonFile = fs.readFileSync(jsonFilePath, "utf8");
  const jsonData = JSON.parse(jsonFile);
  const node = jsonData.nodes.find((n: any) => n.data.id === nodeId);

  // finds connected node ids and subsequently finds the nodes associated with those ids
  const connectedNodeIds = jsonData.edges
    .filter((e: any) => e.data.source === nodeId || e.data.target === nodeId)
    .map((e: any) =>
      e.data.source === nodeId ? e.data.target : e.data.source
    );
  const connectedNodes = jsonData.nodes.filter((n: any) =>
    connectedNodeIds.includes(n.data.id)
  );

  const mdxSource = await serialize(markdownText, {
    mdxOptions: {
      remarkPlugins: [remarkMath],
      rehypePlugins: [rehypeKatex],
    },
  });

  return {
    props: {
      markdownText,
      mdxSource,
      subject,
      node,
      connectedNodes,
    },
  };
};
