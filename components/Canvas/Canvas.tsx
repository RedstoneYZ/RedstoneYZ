"use client";

import { useEffect, useRef, useState } from "react";
import Controller from "./controller/Controller";
import type { CanvasProps } from "./model/types";
import "styles/canvas.css";

const Canvas = ({ canvasHeight, canvasWidth, ...props }: CanvasProps) => {
  const [controller, setController] = useState<Controller>();
  const [fps, setFps] = useState(0);
  const [maxFps, setMaxFps] = useState(0);

  const { current: xLen } = useRef("xLen" in props ? props.xLen : props.preLoadData.xLen);
  const { current: yLen } = useRef("yLen" in props ? props.yLen : props.preLoadData.yLen);
  const { current: zLen } = useRef("zLen" in props ? props.zLen : props.preLoadData.zLen);
  const { current: preLoadData } = useRef("preLoadData" in props ? props.preLoadData : undefined);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spanRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    document?.addEventListener?.("pointerlockchange", () => {
      if (document.pointerLockElement !== canvasRef.current) {
        window.removeEventListener("wheel", preventDefault, false);
      }

      if (controller) {
        controller.inGame = Boolean(document.pointerLockElement);
      }
    });

    const canvas = canvasRef.current;
    const controller = new Controller({ canvas, xLen, yLen, zLen, mapName: "Map", preLoadData });
    controller.start(() => {
      setFps(Math.round(1000 / controller.renderer.mspf));
      setMaxFps(Math.round(1000 / controller.renderer.maxMspf));
    });

    setController(controller);
    return () => controller.destroy();
  }, [xLen, yLen, zLen, preLoadData]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLCanvasElement>) {
    if (e.code === "Space") {
      e.preventDefault();
    }
    controller?.keyDown(e.code);
  }

  function handleKeyUp(e: React.KeyboardEvent<HTMLCanvasElement>) {
    controller?.keyUp(e.code);
  }

  function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) {
    if (!controller) return;

    switch (e.button) {
      case 0:
        if (canvasRef.current && document.pointerLockElement !== canvasRef.current) {
          window.addEventListener("wheel", preventDefault, { passive: false });
          canvasRef.current.requestPointerLock();
        } else {
          controller.leftClick();
        }
        break;

      case 1:
        e.preventDefault();
        controller.middleClick();
        break;

      case 2:
        controller.rightClick(e.shiftKey);
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
  }

  return (
    <>
      <h2>控制鍵</h2>
      <h3>遊戲</h3>
      <ul>
        <li>滑鼠左鍵：進入遊戲</li>
        <li>Esc：退出遊戲</li>
        <li>R：切換太陽是否移動</li>
      </ul>

      <h3>移動</h3>
      <ul>
        <li>W：向前移動</li>
        <li>A：向左移動</li>
        <li>S：向後移動</li>
        <li>D：向右移動</li>
        <li>左 Shift：向下移動</li>
        <li>空白鍵：向上移動</li>
      </ul>

      <h3>快捷欄</h3>
      <ul>
        <li>滑鼠滾輪：滾動快捷欄</li>
        <li>數字 1-9：快捷欄 1-9</li>
      </ul>

      <h3>滑鼠</h3>
      <ul>
        <li>滑鼠左鍵：破壞方塊</li>
        <li>滑鼠右鍵：放置方塊／與方塊互動</li>
        <li>滑鼠中鍵：選取方塊</li>
      </ul>

      <br />

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
      </div>
    </>
  );
};

function preventDefault(e: WheelEvent) {
  e.preventDefault();
}

export default Canvas;
