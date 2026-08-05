"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckCircle, FilePlus, LayoutDashboard } from "lucide-react";

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/teacher", icon: LayoutDashboard, exact: true },
    { name: "Assignments", href: "/teacher/assignments", icon: FilePlus, exact: true },
    { name: "Review Doubts", href: "/teacher/review", icon: CheckCircle },
  ];

  return (
    <div className="min-h-screen bg-[#050507] text-white flex flex-col font-inter">
      {/* Navbar */}
      <nav className="border-b border-[#EDFF66]/30 bg-[#09090b]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link 
              href="/" 
              className="flex items-center gap-2 text-white hover:text-white/80 transition-colors"
            >
              <LayoutDashboard className="w-5 h-5 text-[#EDFF66]" />
              <span className="font-black tracking-widest uppercase text-sm">CODEJUDGE</span>
            </Link>

            <div className="flex items-center gap-1 border-l border-[#EDFF66]/30 pl-8">
              {navItems.map((item) => {
                const isActive = item.exact 
                  ? pathname === item.href 
                  : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                      isActive 
                        ? "bg-[#EDFF66]/20 text-[#EDFF66]" 
                        : "text-zinc-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <span className="text-xs font-mono text-[#EDFF66] uppercase">Teacher Portal</span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 w-full relative">
        {children}
      </main>
    </div>
  );
}
