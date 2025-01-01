"use client";

import type { ImageProps } from "next/image";
import NextImage from "next/image";
import { useState } from "react";

const Image = ({ width: _width, height: _height, ...rest }: ImageProps) => {
  const [ratio, setRatio] = useState(16 / 9);

  let width = typeof _width === "string" ? parseInt(_width) : _width;
  let height = typeof _height === "string" ? parseInt(_height) : _height;

  if (width === undefined && height === undefined) {
    throw new Error("[[Error]] Neither the width nor the height is assigned.");
  }

  width = !width && height ? height * ratio : width;
  height = width && !height ? width / ratio : height;

  return (
    <div className="my-3 w-full flex justify-center">
      <div className="transition transform duration-150 ease-in-out hover:scale-[1.05] hover:cursor-pointer rounded-lg overflow-hidden">
        <NextImage
          {...rest}
          className="transition transform duration-150 ease-in-out hover:scale-[1.05]"
          width={width}
          height={height}
          // @ts-ignore a type issue that should be a bug
          onLoad={({ target: { naturalWidth, naturalHeight } }) => {
            setRatio(naturalWidth / naturalHeight);
          }}
        />
      </div>
    </div>
  );
};

export default Image;
