import { createContext, ReactNode, useContext, useState } from "react";

const ReferenceContext = createContext<ReferenceValue | undefined>(undefined);

export default function ReferenceProvider({ children }: { children: ReactNode }) {
  const [references, setReferences] = useState<Reference[]>([]);

  function registerReference(ref: Reference): void {
    setReferences((prev) => {
      if (!prev.find((r) => r.id === ref.id)) {
        return [...prev, ref];
      }
      return prev;
    });
  }

  return (
    <ReferenceContext.Provider value={{ references, registerReference }}>
      {children}
    </ReferenceContext.Provider>
  );
}

export function useReferences() {
  const context = useContext(ReferenceContext);

  if (!context) {
    throw new Error("[[Provider Error]] ReferenceProvider is needed for citations to work.");
  }

  return context;
}

export interface Reference {
  id: string;
  href: string;
  text?: string;
}

interface ReferenceValue {
  references: Reference[];
  registerReference: (ref: Reference) => void;
}
