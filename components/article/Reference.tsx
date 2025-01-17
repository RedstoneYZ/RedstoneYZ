"use client";

import { useEffect } from "react";
import Link from "@/components/Link";
import type { Reference } from "@/providers/ReferenceProvider";
import { useReferences } from "@/providers/ReferenceProvider";

export function Citation(ref: Reference) {
  const { registerReference } = useReferences();

  useEffect(() => {
    registerReference(ref);
  }, [ref, registerReference]);

  return (
    <sup id={`citation-${ref.id}`}>
      <Link href={`#reference-${ref.id}`}>[{ref.id}]</Link>
    </sup>
  );
}

export function ReferenceList() {
  const { references } = useReferences();

  if (!references.length) {
    return <></>;
  }

  return (
    <>
      <h2>參考</h2>
      <ol>
        {references.map((ref) => (
          <li key={ref.id} id={`reference-${ref.id}`}>
            <Link href={ref.href}>{ref.text ?? ref.href}</Link>
          </li>
        ))}
      </ol>
    </>
  );
}
