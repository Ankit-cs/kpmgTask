// @ts-nocheck
"use client";

import React, { useState } from "react";
import { useRole } from "./RoleProvider";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

export function Navbar() {
  const { role, setRole } = useRole();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const links = [
    { href: "/", label: "Workspace" },
    { href: "/doubts", label: "Doubt Board" },
    ...(role === "STUDENT" ? [{ href: "/student/history", label: "My History", className: "text-blue-400" }] : []),
    ...(role === "TEACHER" ? [
      { href: "/teacher", label: "Review Portal", className: "text-purple-400" },
      { href: "/teacher/assignments/new", label: "New Assignment", className: "text-purple-400" }
    ] : []),
  ];

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="bg-[#0a0a0f] text-white p-4 border-b border-white/10 sticky top-0 z-50 shadow-2xl"
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-6">
          <Link href="/">
            <motion.div whileHover={{ scale: 1.05 }} className="font-bold text-xl tracking-wider text-[#EDFF66]">
              CODE<span className="text-white">JUDGE</span>
            </motion.div>
          </Link>
          
          {/* Desktop Links */}
          <div className="hidden md:flex gap-6 items-center">
            {links.map((link, idx) => (
              <motion.div key={link.href} whileHover={{ y: -2 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 * idx }}>
                <Link href={link.href} className={`text-sm font-medium hover:text-[#EDFF66] transition-colors ${link.className || "text-gray-300"}`}>
                  {link.label}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right side: Role Switcher & Mobile Menu Toggle */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center bg-[#1e1e24] rounded overflow-hidden text-sm border border-white/10">
            <button
              onClick={() => setRole("STUDENT")}
              className={`px-4 py-2 transition-colors ${role === "STUDENT" ? "bg-[#EDFF66] text-black font-bold" : "text-gray-400 hover:text-white"}`}
            >
              Student
            </button>
            <button
              onClick={() => setRole("TEACHER")}
              className={`px-4 py-2 transition-colors ${role === "TEACHER" ? "bg-purple-500 text-white font-bold" : "text-gray-400 hover:text-white"}`}
            >
              Teacher
            </button>
          </div>

          <button 
            className="md:hidden p-2 text-gray-300 hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden mt-4"
          >
            <div className="flex flex-col gap-4 p-4 bg-[#1e1e24] rounded-lg border border-white/5">
              {links.map((link) => (
                <Link 
                  key={link.href} 
                  href={link.href} 
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-sm font-medium py-2 border-b border-white/5 ${link.className || "text-gray-300"}`}
                >
                  {link.label}
                </Link>
              ))}
              
              <div className="pt-2">
                <p className="text-xs text-gray-500 mb-2 uppercase">Switch Role</p>
                <div className="flex rounded overflow-hidden text-sm border border-white/10">
                  <button
                    onClick={() => { setRole("STUDENT"); setMobileMenuOpen(false); }}
                    className={`flex-1 px-4 py-2 transition-colors ${role === "STUDENT" ? "bg-[#EDFF66] text-black font-bold" : "bg-[#0a0a0f] text-gray-400"}`}
                  >
                    Student
                  </button>
                  <button
                    onClick={() => { setRole("TEACHER"); setMobileMenuOpen(false); }}
                    className={`flex-1 px-4 py-2 transition-colors ${role === "TEACHER" ? "bg-purple-500 text-white font-bold" : "bg-[#0a0a0f] text-gray-400"}`}
                  >
                    Teacher
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
