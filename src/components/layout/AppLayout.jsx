import React from "react";
import { Outlet, Navigate } from "react-router-dom";
import Navbar from "./Navbar";
import MobileHeader from "@/components/mobile/MobileHeader";
import { useAuth } from "@/lib/AuthContext";
import InactivePlanScreen from "@/components/shared/InactivePlanScreen";

const isPlanInactive = (u) => {
  const d = { ...(u || {}), ...((u && u.data) || {}) };
  if (d.is_active === false) return true;
  if (d.plan === "rejected") return true;
  if (d.plan_status && d.plan_status !== "active") return true;
  if (d.plan_end_date) {
    const end = new Date(String(d.plan_end_date).length === 10 ? d.plan_end_date + "T23:59:59" : d.plan_end_date);
    if (!isNaN(end.getTime()) && end < new Date()) return true;
  }
  return false;
};

export default function AppLayout() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.is_admin === true;

  if (user?.must_change_password) {
    return <Navigate to="/definir-senha" replace />;
  }

  if (user && !isAdmin && isPlanInactive(user)) {
    return <InactivePlanScreen />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="hidden md:block">
        <Navbar />
      </div>
      <MobileHeader />
      <main className="pt-20 md:pt-24 pb-28 md:pb-12">
        <Outlet />
      </main>
    </div>
  );
}
