import Canvas from "@/components/Canvas";
import type { MapData } from "@/components/Canvas/model/types";
import map from "@/public/json/levels/Official Map 6.json";

export default function CanvasPage() {
  return (
    <Canvas canvasHeight={720} canvasWidth={1080} checkable={true} preLoadData={map as MapData} />
  );
}
