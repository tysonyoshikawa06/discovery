type NodeDetailsProps = {
  subject: string;
  node: {
    data: {
      id: string;
      label: string;
      description?: string;
    };
  };
  connectedNodes: {
    data: {
      id: string;
      label: string;
      description?: string;
    };
  }[];
};

export default function NodeDetails({
  subject,
  node,
  connectedNodes,
}: NodeDetailsProps) {
  return (
    <div>
      <h1 className="text-2xl font-bold">{node.data.label}</h1>
      <p>{node.data.description || "No description yet."}</p>
      <div>
        <h2 className="text-xl font-bold">Connected Topics</h2>
        <ul>
          {connectedNodes.map((e, i) => (
            <li key={i}>{e.data.label}</li>
          ))}
        </ul>
      </div>
      <h2 className="text-xl font-bold">{node.data.unit}</h2>
    </div>
  );
}
