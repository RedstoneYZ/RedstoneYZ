import Canvas from "@/components/Canvas";

export default function CanvasPage() {
  return (
    <Canvas canvasHeight={720} canvasWidth={1080} checkable={true} xLen={5} yLen={5} zLen={5} />
  );
}
