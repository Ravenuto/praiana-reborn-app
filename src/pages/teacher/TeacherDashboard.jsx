import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { isTeacherUser, isAdminUser } from "@/lib/roles";
import AttendanceBySchedule from "@/components/admin/AttendanceBySchedule";
import ManageSessions from "@/components/admin/ManageSessions";
import { ClipboardCheck, CalendarDays } from "lucide-react";

const TABS = [
  { key: "attendance", label: "Presenças", icon: ClipboardCheck },
  { key: "agenda", label: "Minha agenda", icon: CalendarDays },
];

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("attendance");
  const isTeacher = isTeacherUser(user);
  const isAdmin = isAdminUser(user);

  if (!isTeacher && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  const myName = user?.full_name || user?.email || "";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 font-body">
      <div className="mb-6">
        <h1 className="font-heading text-lg font-semibold">Área da Professora</h1>
        <p className="mt-1 text-muted-foreground text-xs">
          Marque presenças e gerencie as aulas em que você está cadastrada.
        </p>
      </div>

      <div className="mb-5 flex items-center justify-center gap-2">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-medium transition-colors ${
              activeTab === key
                ? "bg-primary text-primary-foreground"
                : "bg-muted/40 text-muted-foreground hover:text-primary"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === "attendance" ? (
        <AttendanceBySchedule />
      ) : (
        <ManageSessions
          instructorFilter={isAdmin && !isTeacher ? "" : myName}
          canCreate={false}
          title="Minhas aulas"
        />
      )}
    </div>
  );
}
