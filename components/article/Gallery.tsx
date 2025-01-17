"use client";

import { useGallery } from "@/providers/GalleryProvider";
import type { ImageProps } from "next/image";
import NextImage from "next/image";
import { useEffect, useState } from "react";

export function Image({ width: _width, height: _height, ...rest }: ImageProps) {
  const [ratio, setRatio] = useState(16 / 9);
  const { setImage, registerImage } = useGallery();

  function getHref() {
    return typeof rest.src === "string"
      ? rest.src
      : "src" in rest.src
        ? rest.src.src
        : rest.src.default.src;
  }

  useEffect(() => {
    registerImage({ href: getHref(), alt: rest.alt });
  });

  _width = typeof _width === "string" ? parseInt(_width) : _width;
  _height = typeof _height === "string" ? parseInt(_height) : _height;

  if (_width === undefined && _height === undefined) {
    throw new Error("[[Error]] Neither the width nor the height is assigned.");
  }

  const width = !_width && _height ? _height * ratio : _width;
  const height = _width && !_height ? _width / ratio : _height;

  return (
    <div className="my-3 flex w-full justify-center">
      <div className="transform overflow-hidden rounded-lg transition duration-150 hover:scale-105 hover:cursor-pointer">
        <NextImage
          {...rest}
          className="transform transition duration-150 hover:scale-105"
          width={width}
          height={height}
          // @ts-expect-error a type issue that should be a bug
          onLoad={({ target: { naturalWidth, naturalHeight } }) => {
            setRatio(naturalWidth / naturalHeight);
          }}
          onClick={() => {
            setImage(getHref());
          }}
        />
      </div>
    </div>
  );
}

const arrowStyle = "flex h-full w-20 transform items-center justify-center bg-black/[0.1] transition duration-150 dark:bg-white/[0.1]";
const arrowHoverStyle = "hover:scale-110 hover:cursor-pointer hover:bg-black/[0.15] hover:dark:bg-white/[0.15]";

export function Gallery() {
  const { images, index, setIndex } = useGallery();

  const image = images[index];
  if (!image) return <></>;

  return (
    <div className="fixed left-0 top-0 z-10 flex h-full w-full justify-between backdrop-blur">
      <div className="absolute h-full w-full" onClick={() => setIndex(-1)}></div>
      <div
        className={index === 0 ? arrowStyle : `${arrowStyle} ${arrowHoverStyle}`}
        onClick={() => setIndex((i) => (i === 0 ? 0 : i - 1))}
      >
        <span style={{ visibility: index === 0 ? "hidden" : "visible" }}>{"<"}</span>
      </div>
      <div className="m-10 flex w-[90%] items-center justify-center">
        <img
          className="h-full w-full object-scale-down"
          src={image.href}
          alt={image.alt}
          width={0}
          height={0}
        />
      </div>
      <div
        className={index === images.length - 1 ? arrowStyle : `${arrowStyle} ${arrowHoverStyle}`}
        onClick={() => setIndex((i) => (i === images.length - 1 ? i : i + 1))}
      >
        <span style={{ visibility: index === images.length - 1 ? "hidden" : "visible" }}>
          {">"}
        </span>
      </div>
    </div>
  );
}
