import NextImage from "next/image";

export default function Image({ src, alt, width, height }: ImageProps) {
  return (
    <NextImage
      src={src}
      alt={alt ?? ""}
      width={width}
      height={height}
    />
  );
}

export interface ImageProps extends React.PropsWithChildren {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
}