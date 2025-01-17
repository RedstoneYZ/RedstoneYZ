import { createContext, ReactNode, useContext, useState } from "react";

const GalleryContext = createContext<GalleryValue | undefined>(undefined);

export default function GalleryProvider({ children }: { children: ReactNode }) {
  const [images, setImages] = useState<ImageProps[]>([]);
  const [index, setIndex] = useState<number>(-1);

  function registerImage(image: ImageProps): void {
    setImages((prev) => {
      if (!prev.find(img => img.href === image.href)) {
        return [...prev, image];
      }
      return prev;
    });
  }

  function setImage(href: string | null) {
    if (href) {
      const i = images.findIndex(img => img.href === href);
      if (i >= 0) {
        setIndex(i);
        return;
      }
    }

    setIndex(-1);
  }

  return (
    <GalleryContext.Provider value={{ index, images, setImage, setIndex, registerImage }}>
      {children}
    </GalleryContext.Provider>
  );
}

export function useGallery() {
  const context = useContext(GalleryContext);

  if (!context) {
    throw new Error("[[Provider Error]] GalleryProvider is needed for gallery to work.");
  }

  return context;
}

interface ImageProps {
  href: string;
  alt: string;
}

interface GalleryValue {
  index: number;
  images: ImageProps[];
  setImage: (href: string | null) => void;
  setIndex: React.Dispatch<React.SetStateAction<number>>;
  registerImage: (image: ImageProps) => void;
}
