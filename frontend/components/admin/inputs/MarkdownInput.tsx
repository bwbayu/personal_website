"use client";

import dynamic from "next/dynamic";
import type { FieldInputProps } from "./index";
import "@uiw/react-md-editor/markdown-editor.css";

// The editor pulls in browser-only APIs, so it must never run during the static
// export build: load it client-side only (ssr: false).
const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

export function MarkdownInput({ field, value, onChange }: FieldInputProps) {
  const text = typeof value === "string" ? value : "";
  return (
    <div data-color-mode="dark">
      <MDEditor
        id={field.key}
        value={text}
        onChange={(next) => onChange(next ?? "")}
        height={400}
      />
    </div>
  );
}
