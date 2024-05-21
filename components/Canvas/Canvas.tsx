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

    document?.addEventListener?.("pointerlockchange", () => {
      if (document.pointerLockElement !== canvasRef.current) {
        window.removeEventListener("wheel", preventDefault, false);
      }
    });

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

  function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) {
    switch (e.button) {
      case 0:
        if (canvasRef.current && document.pointerLockElement !== canvasRef.current) {
          window.addEventListener("wheel", preventDefault, { passive: false });
          canvasRef.current.requestPointerLock();
        } else {
          controller?.leftClick();
        }
        break;

      case 1:
        e.preventDefault();
        controller?.middleClick();
        setCurrentBlock(controller?.currentBlockName ?? "");
        break;

      case 2:
        controller?.rightClick(e.shiftKey);
        break;
    }
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (canvasRef.current && document.pointerLockElement === canvasRef.current) {
      controller?.adjustAngles(e.movementX, e.movementY);
    }
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
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
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

function preventDefault(e: WheelEvent) {
  e.preventDefault();
}

export default Canvas;
