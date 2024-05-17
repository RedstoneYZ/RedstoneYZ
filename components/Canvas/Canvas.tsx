"use client";

import { useEffect, useRef, useState } from "react";
import Controller from "./controller/Controller";
import type { CanvasProps } from "./model/types";
import "styles/canvas.css";

const Canvas = ({ canvasHeight, canvasWidth, ...props }: CanvasProps) => {
  const [controller, setController] = useState<Controller>();
  const [currentBlock, setCurrentBlock] = useState("");
  const [fps, setFps] = useState(0);
  const [maxFps, setMaxFps] = useState(0);

  const { current: xLen } = useRef("xLen" in props ? props.xLen : props.preLoadData.xLen);
  const { current: yLen } = useRef("xLen" in props ? props.yLen : props.preLoadData.yLen);
  const { current: zLen } = useRef("xLen" in props ? props.xLen : props.preLoadData.zLen);
  const { current: mapName } = useRef(
    "preLoadData" in props ? props.preLoadData.mapName : "New Map",
  );
  const { current: preLoadData } = useRef("preLoadData" in props ? props.preLoadData : undefined);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spanRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const controller = new Controller({ canvas, xLen, yLen, zLen, mapName, preLoadData });
    controller.start(() => {
      setFps(Math.round(1000 / controller.renderer.mspf));
      setMaxFps(Math.round(1000 / controller.renderer.maxMspf));
    });

    setController(controller);
    setCurrentBlock(controller.currentBlockName);
    return () => controller.destroy();
  }, [xLen, yLen, zLen, mapName, preLoadData]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLCanvasElement>) {
    if (e.key === " ") {
      e.preventDefault();
    }
    controller?.addActiveKey(e.key.toLowerCase());
    if (controller?.jumpHotbar(e.key)) {
      setCurrentBlock(controller?.currentBlockName ?? "");
    }
  }

  function handleKeyUp(e: React.KeyboardEvent<HTMLCanvasElement>) {
    controller?.removeActiveKey(e.key.toLowerCase());
  }

  function handleMouseEnter() {
    window.addEventListener("wheel", preventDefault, { passive: false });
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (canvasRef.current) {
      const p = getPosition(canvasRef.current, e);
      controller?.mouseMove(p.x, p.y);
    }
  }

  function handleMouseLeave() {
    window.removeEventListener("wheel", preventDefault, false);
  }

  function handleDrag(e: React.DragEvent<HTMLCanvasElement>) {
    // 拖曳結束前的最後一個事件的座標會是 (0, 0)，因為會嚴重影響到畫面，所以直接擋掉
    if (e.clientX === 0 && e.clientY === 0) return;
    controller?.adjustAngles(e.clientX, e.clientY);
  }

  function handleDragStart(e: React.DragEvent<HTMLCanvasElement>) {
    // 把拖曳的殘影改成看不見的元素
    if (spanRef.current) {
      e.dataTransfer.setDragImage(spanRef.current, 0, 0);
    }
    controller?.adjustAngles(e.clientX, e.clientY, true);
  }

  function handleClick() {
    controller?.leftClick();
  }

  function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) {
    if (e.button !== 1) return;
    e.preventDefault();
    controller?.middleClick();
    setCurrentBlock(controller?.currentBlockName ?? "");
  }

  function handleContextMenu(e: React.MouseEvent<HTMLCanvasElement>) {
    e.preventDefault();
    controller?.rightClick(e.shiftKey);
  }

  function handleScroll(e: React.WheelEvent<HTMLCanvasElement>) {
    controller?.scrollHotbar(e.deltaY);
    setCurrentBlock(controller?.currentBlockName ?? "");
  }

  return (
    <div className="canvas-wrapper">
      <div className="canvas-wrapper-upper">
        <canvas
          className="canvas"
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          onMouseEnter={handleMouseEnter}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          draggable={true}
          onDrag={handleDrag}
          onDragStart={handleDragStart}
          onMouseDown={handleMouseDown}
          onClick={handleClick}
          onContextMenu={handleContextMenu}
          onWheelCapture={handleScroll}
        />
        <div className="canvas-wrapper-f3">
          {fps} fps / {maxFps} max fps
        </div>
        <span ref={spanRef} style={{ display: "none" }} />
      </div>
      <div className="canvas-wrapper-middle">{currentBlock}</div>
    </div>
  );
};

function getPosition(canvas: HTMLCanvasElement, event: React.MouseEvent<HTMLCanvasElement>) {
  const p = canvas.getBoundingClientRect();
  return {
    x: event.clientX - p.left,
    y: event.clientY - p.top,
  };
}

function preventDefault(e: WheelEvent) {
  e.preventDefault();
}

export default Canvas;
