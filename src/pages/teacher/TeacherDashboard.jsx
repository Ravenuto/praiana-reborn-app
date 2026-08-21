import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import AttendanceBySchedule from "@/components/admin/AttendanceBySchedule";
import { ClipboardCheck } from "lucide-react";

export default function TeacherDashboard() {
  const { user } = useAuth();
  const isTeacher = user?.role === "teacher" || user?.is_teacher === true;
  const isAdmin = user?.role === "admin" || user?.is_admin === true;

  if (!isTeacher && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 font-body">
      <div className="mb-6">
        <h1 className="font-heading text-lg font-semibold">Área da Professora</h1>
        <p className="mt-1 text-muted-foreground text-xs">
          Escolha o dia, abra a aula e marque presença ou falta das alunas.
        </p>
      </div>

      <div className="mb-5 flex items-center justify-center">
        <div className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-medium">
          <ClipboardCheck className="h-4 w-4" />
          Presenças
        </div>
      </div>

      <AttendanceBySchedule />
    </div>
  );
}
