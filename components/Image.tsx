import type { ImageProps } from "next/image";
import NextImage from "next/image";

const Image = ({ ...rest }: ImageProps) => {
  return (
    <div style={{ width: rest.width, height: rest.height }}>
      <NextImage
        {...rest}
        width="0"
        height="0"
        sizes="100vw"
        style={{ width: "100%", height: "auto" }}
      />
    </div>
  );
};

export default Image;
