import React from "react";

export default function WaveDivider({ flip = false, color = "hsl(var(--primary))", className = "" }) {
  return (
    <div className={`relative h-16 overflow-hidden ${flip ? "-scale-y-100" : ""} ${className}`} aria-hidden>
      <div className="absolute inset-x-0 bottom-0 h-full flex w-[200%] animate-wave-move will-change-transform">
        {[0, 1].map((k) => (
          <svg
            key={k}
            className="block h-full w-1/2 shrink-0"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
          >
            <path d="M0,60 C300,120 600,0 1200,60 L1200,120 L0,120 Z" fill={color} />
          </svg>
        ))}
      </div>
    </div>
  );
}
