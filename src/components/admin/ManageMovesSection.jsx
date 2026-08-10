import React, { useState } from "react";
import ManageMoves from "@/components/admin/ManageMoves";
import ManageStudentMoves from "@/components/admin/ManageStudentMoves";

const SUBTABS = [
  { key: "plan", label: "Plano do mês" },
  { key: "library", label: "Biblioteca" },
];

export default function ManageMovesSection() {
  const [sub, setSub] = useState("plan");
  return (
    <div>
      <div className="flex gap-1.5 mb-5">
        {SUBTABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setSub(key)}
            className={`px-4 py-2 rounded-full text-xs font-medium transition-colors ${
              sub === key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {sub === "plan" ? <ManageStudentMoves /> : <ManageMoves />}
    </div>
  );
}
