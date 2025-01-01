'use client';

import { useEffect } from "react";
import Link from "@/components/Link";
import { Reference, useReferences } from "@/providers/ReferenceProvider";

export function Citation(ref: Reference) {
  const { registerReference } = useReferences();

  useEffect(() => {
    registerReference(ref);
  }, [ref, registerReference]);

  return (
    <sup id={`citation-${ref.id}`}>
      <Link href={`#reference-${ref.id}`}>
        [{ref.id}]
      </Link>
    </sup>
  );
}

export function ReferenceList() {
  const { references } = useReferences();

  return (
    <ol>
      {references.map((ref) => (
        <li key={ref.id} id={`reference-${ref.id}`}>
          <Link href={ref.href}>{ref.text ?? ref.href}</Link>
        </li>
      ))}
    </ol>
  );
}
