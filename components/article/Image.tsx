"use client";

import type { ImageProps } from "next/image";
import NextImage from "next/image";
import { useEffect, useRef, useState } from "react";

const divClassSm =
  "transform overflow-hidden rounded-lg transition duration-150 hover:cursor-pointer hover:scale-105";
const divClassLg =
  "transform overflow-hidden rounded-none transition duration-150 hover:cursor-auto z-20";
const imgClassSm = "transform transition duration-150 hover:scale-105";
const imgClassLg = "transform transition duration-150";

const Image = ({ width: _width, height: _height, ...rest }: ImageProps) => {
  const [imageDim, setImageDim] = useState<[number, number]>([1920, 1080]);
  const [screen, setScreen] = useState<[number, number]>([1920, 1080]);
  const [enlarged, setEnlarged] = useState(false);

  const blrRef = useRef<HTMLDivElement>(null);
  const divRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const resetScreen = () => {
      setScreen([window.innerWidth, window.innerHeight]);
    }

    resetScreen();
    window.addEventListener('resize', resetScreen);

    return () => {
      window.removeEventListener('resize', resetScreen);
    }
  }, [setScreen]);

  let width = typeof _width === "string" ? parseInt(_width) : _width;
  let height = typeof _height === "string" ? parseInt(_height) : _height;

  if (width === undefined && height === undefined) {
    throw new Error("[[Error]] Neither the width nor the height is assigned.");
  }

  const ratio = imageDim[0] / imageDim[1];
  width = !width && height ? height * ratio : width;
  height = width && !height ? width / ratio : height;

  function centeringDiv(div: HTMLDivElement) {
    const displayWidth = screen[0] - 30;
    const displayHeight = screen[1] - 30;

    // typescript is not smart enough
    (width = width!), (height = height!);

    const scale =
    displayWidth < imageDim[0] || displayHeight < imageDim[1]
    ? Math.min(displayWidth / width, displayHeight / height) : imageDim[0] / width;

    const x = (screen[0] - width * scale) / 2 - div.offsetLeft;
    const y = (screen[1] - height * scale) / 2 - div.offsetTop;
    div.style.transform = `scale(${scale}) translate(${x}px, ${y}px)`;
  }

  function toggleImage() {
    const body = document.body;
    const blr = blrRef.current;
    const div = divRef.current;
    const img = imgRef.current;
    if (!blr || !div || !img) return;

    if (enlarged) {
      blr.style.display = "none";

      img.className = imgClassSm;
      div.className = divClassSm;
      div.style.transform = "";

      body.style.paddingRight = "";
      body.style.overflow = "auto";
    } else {
      blr.style.display = "block";

      img.className = imgClassLg;
      div.className = divClassLg;
      centeringDiv(div);

      body.style.paddingRight = `${window.innerWidth - body.offsetWidth}px`;
      body.style.overflow = "hidden";
    }

    setEnlarged((a) => !a);
  }

  return (
    <>
      <div className="my-3 flex w-full justify-center">
        <div ref={divRef} className={divClassSm}>
          <NextImage
            {...rest}
            className={imgClassSm}
            ref={imgRef}
            width={width}
            height={height}
            // @ts-expect-error a type issue that should be a bug
            onLoad={({ target: { naturalWidth, naturalHeight } }) => {
              setImageDim([naturalWidth, naturalHeight]);
            }}
            onClick={toggleImage}
          />
        </div>
        <div
          className="fixed left-0 top-0 z-10 hidden h-full w-full backdrop-blur"
          ref={blrRef}
          onClick={toggleImage}
        ></div>
      </div>
    </>
  );
};

export default Image;
