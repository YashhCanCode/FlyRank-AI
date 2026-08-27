// The flow editor is fully client-side (React Flow), so load it with SSR disabled.
import dynamic from "next/dynamic";

const FlowEditor = dynamic(() => import("@/components/FlowEditor"), { ssr: false });

export default function Home() {
  return <FlowEditor />;
}
