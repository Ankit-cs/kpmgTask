"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, History, LayoutDashboard, HelpCircle } from "lucide-react";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems: { name: string; href: string; icon: any; exact?: boolean }[] = [
    { name: "Workspace", href: "/student/workspace", icon: LayoutDashboard },
    { name: "Questions", href: "/student/assignments", icon: BookOpen },
    { name: "Doubt Board", href: "/doubts", icon: HelpCircle },
    { name: "My History", href: "/student/history", icon: History },
  ];

  return (
    <div className="min-h-screen bg-[#050507] text-white flex flex-col font-inter">
      {/* Navbar */}
      <nav className="border-b border-white/10 bg-[#09090b]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link 
              href="/student" 
              className="flex items-center gap-2 text-white hover:text-white/80 transition-colors"
            >
              <LayoutDashboard className="w-5 h-5 text-primary" />
              <span className="font-black tracking-widest uppercase text-sm">Sandbox</span>
            </Link>

            <div className="flex items-center gap-1 border-l border-white/10 pl-8">
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
                        ? "bg-white/10 text-white" 
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
             <span className="text-xs font-mono text-zinc-500 uppercase">Student Portal</span>
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
