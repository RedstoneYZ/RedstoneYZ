"use client";

import { useEffect, useRef, useState } from "react";

// import Button from "../Button";
// import Message from "../Message";

import Controller from "./controller/Controller";

import Official_Map_1 from "@/public/json/levels/Official Map 1.json";
import { CanvasProps } from "./model/types";

const Canvas = ({ canvasHeight, canvasWidth, storable, checkable, ...props }: CanvasProps) => {
  const [controller, setController] = useState<Controller>();
  const [currentBlock, setCurrentBlock] = useState('');

  // @ts-ignore
  props.preLoadData = Official_Map_1

  const { current: xLen } = useRef('xLen' in props ? props.xLen : props.preLoadData.xLen);
  const { current: yLen } = useRef('xLen' in props ? props.yLen : props.preLoadData.yLen);
  const { current: zLen } = useRef('xLen' in props ? props.xLen : props.preLoadData.zLen);
  const { current: mapName } = useRef('preLoadData' in props ? props.preLoadData.mapName : 'New Map');
  const { current: preLoadData } = useRef('preLoadData' in props ? props.preLoadData : undefined);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spanRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const controller = new Controller({ canvas, xLen, yLen, zLen, mapName, preLoadData });
    controller.start();
    setController(controller);
    setCurrentBlock(controller.currentBlockName);
    return () => controller.destroy();
  }, [xLen, yLen, zLen, mapName, preLoadData]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLCanvasElement>) {
    if (e.key === " ") {
      e.preventDefault();
    }
    controller?.addActiveKey(e.key);
  }

  function handleKeyUp(e: React.KeyboardEvent<HTMLCanvasElement>) {
    controller?.removeActiveKey(e.key);
  }

  function handleMouseEnter() {
    window.addEventListener('wheel', preventDefault, { passive: false });
  }

  function handleMouseLeave() {
    window.removeEventListener('wheel', preventDefault, false);
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

  function handleClick(e: React.MouseEvent<HTMLCanvasElement>) {
    if (canvasRef.current) {
      const p = getPosition(canvasRef.current, e);
      controller?.leftClick(p.x, p.y);
    }
  }

  function handleContextMenu(e: React.MouseEvent<HTMLCanvasElement>) {
    e.preventDefault();

    if (canvasRef.current) {
      const p = getPosition(canvasRef.current, e);
      controller?.rightClick(p.x, p.y, e.shiftKey);
    }
  }

  function handleScroll(e: React.WheelEvent<HTMLCanvasElement>) {
    controller?.scrollHotbar(e.deltaY);
    setCurrentBlock(controller?.currentBlockName ?? '');
  }

  // async function handleCheckMap() {
  //   if (!controller) return;

  //   if (await Engine.validate(controller.engine)) {
  //     console.log('Pass');
  //     // Message.send({ content: '恭喜你通過檢查！', type: 'success' });
  //   }
  //   else {
  //     console.log('Fail');
  //     // Message.send({ content: '很抱歉，但你沒有通過檢查 :(', type: 'error' });
  //   }
  // }
  
  return (
    <div className="canvas-wrapper">
      <div className="canvas-wrapper-upper">
        <canvas className="canvas"
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}

          tabIndex={0}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}

          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          
          draggable={true}
          onDrag={handleDrag}
          onDragStart={handleDragStart}

          onClick={handleClick}
          onContextMenu={handleContextMenu}

          onWheelCapture={handleScroll}
        />
        <span ref={spanRef} style={{ display: 'none' }} />
      </div>
      <div className="canvas-wrapper-middle">{currentBlock}</div>
      {
        // TODO: 
        // storable || (checkable && controller?.engine.validation) ? 
        //   <div className="canvas-wrapper-lower">
        //     {checkable && controller?.engine.validation ? <Button type="primary" onClick={handleCheckMap}>檢查地圖</Button> : <></>}
        //   </div> :
        //   <></>
      }
    </div>
  );
}

function getPosition(canvas: HTMLCanvasElement, event: React.MouseEvent<HTMLCanvasElement>) {
  const p = canvas.getBoundingClientRect();
  return {
    x: event.clientX - p.left, 
    y: event.clientY - p.top
  };
}

function preventDefault(e: WheelEvent) {
  e.preventDefault();
}

export default Canvas;