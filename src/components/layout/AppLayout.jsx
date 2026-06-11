import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import MobileHeader from "@/components/mobile/MobileHeader";

export default function AppLayout() {


  return (
    <div className="min-h-screen bg-background">
      <div className="hidden md:block">
        <Navbar />
      </div>
      <MobileHeader />
      <main className="pb-16 md:pb-0">
        <Outlet />
      </main>
    </div>
  );
}