import React from "react";

/**
 * Decorative blurred organic blobs to use as a section/page backdrop.
 * Render INSIDE a `relative overflow-hidden` container. Sits behind content
 * with `pointer-events-none`.
 */
export default function PraianaBlobs({ variant = "default", className = "" }) {
  if (variant === "minimal") {
    return (
      <div className={`pointer-events-none absolute inset-0 -z-10 overflow-hidden ${className}`} aria-hidden>
        <div className="absolute -top-24 -right-24 w-80 h-80 organic-blob bg-primary/10 blur-3xl animate-float-slow" />
        <div className="absolute -bottom-32 -left-20 w-72 h-72 organic-blob-2 bg-accent/10 blur-3xl animate-float-slow [animation-delay:2s]" />
      </div>
    );
  }
  return (
    <div className={`pointer-events-none absolute inset-0 -z-10 overflow-hidden ${className}`} aria-hidden>
      <div className="absolute -top-24 -right-32 w-[420px] h-[420px] organic-blob bg-primary/15 blur-3xl animate-float-slow" />
      <div className="absolute -bottom-32 -left-32 w-[360px] h-[360px] organic-blob-2 bg-accent/15 blur-3xl animate-float-slow [animation-delay:2s]" />
      <div className="absolute top-1/3 left-1/2 w-[260px] h-[260px] organic-blob bg-primary/8 blur-3xl animate-float-y" />
    </div>
  );
}
