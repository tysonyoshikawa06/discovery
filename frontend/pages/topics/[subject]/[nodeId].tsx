import { GetStaticPaths, GetStaticProps } from "next";
import NodeDetails from "/Users/tyson/Desktop/discovery_outer/discovery/frontend/components/NodeDetails";
import fs from "fs";
import path from "path";

type PageProps = {
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

export default function NodePage({ subject, node, connectedNodes }: PageProps) {
  return (
    <NodeDetails
      subject={subject}
      node={node}
      connectedNodes={connectedNodes}
    />
  );
}

// generates paths
export const getStaticPaths: GetStaticPaths = async () => {
  const subject = "apchem";
  // reads apchem json file and stores it in fileData as an object
  const fileData = JSON.parse(
    fs.readFileSync(
      path.join(process.cwd(), "public/data", `${subject}.json`),
      "utf8"
    )
  );
  // creates list of all possible paths stored as params
  const paths = fileData.nodes.map((node: any) => ({
    params: { subject: subject, nodeId: node.data.id },
  }));

  return {
    paths,
    // waits to generate before displaying
    fallback: "blocking",
  };
};

// generates content
export const getStaticProps: GetStaticProps = async ({ params }) => {
  // extract fields from params object
  const subject = params?.subject as string;
  const nodeId = params?.nodeId as string;

  // reads json file corresponding to params.subject and stores it in data
  const filePath = path.join(process.cwd(), "public/data", `${subject}.json`);
  const file = fs.readFileSync(filePath, "utf8");
  const data = JSON.parse(file);

  const node = data.nodes.find((n: any) => n.data.id === nodeId);

  // finds connected node ids and subsequently finds the nodes associated with those ids
  const connectedNodeIds = data.edges
    .filter((e: any) => e.data.source === nodeId || e.data.target === nodeId)
    .map((e: any) =>
      e.data.source === nodeId ? e.data.target : e.data.source
    );
  const connectedNodes = data.nodes.filter((n: any) =>
    connectedNodeIds.includes(n.data.id)
  );

  // automatically sends props to NodePage component
  return {
    props: {
      subject,
      node,
      connectedNodes,
    },
  };
};
