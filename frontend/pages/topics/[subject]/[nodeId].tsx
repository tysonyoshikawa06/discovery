import fs from "fs";
import path from "path";
import { GetStaticProps, GetStaticPaths } from "next";
import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import NodeDetails from "/Users/tyson/Desktop/discovery_outer/discovery/frontend/components/NodeDetails";

type PageProps = {
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
  mdxSource,
  subject,
  node,
  connectedNodes,
}: PageProps) {
  return (
    <div className="prose prose-lg p-4 flex w-full">
      <div className="w-1/2">
        <MDXRemote {...mdxSource} />
      </div>
      <div className="w-1/2">
        <NodeDetails
          subject={subject}
          node={node}
          connectedNodes={connectedNodes}
        />
      </div>
    </div>
  );
}

// stolen from previous version
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
  const markdownText = fs.readFileSync(topicMarkdownPath, "utf8");

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
      mdxSource,
      subject,
      node,
      connectedNodes,
    },
  };
};
