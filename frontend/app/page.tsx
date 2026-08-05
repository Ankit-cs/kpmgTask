"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useRole } from "../components/RoleProvider";
import { GraduationCap, Briefcase } from "lucide-react";

export default function GlobalLandingPage() {
  const router = useRouter();
  const { setRole } = useRole();

  const handleLogin = (role: "STUDENT" | "TEACHER") => {
    setRole(role);
    if (role === "STUDENT") {
      router.push("/student");
    } else {
      router.push("/teacher");
    }
  };

  return (
    <div className="min-h-screen bg-[#050507] text-white flex flex-col items-center justify-center p-8 relative overflow-hidden font-inter">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#EDFF66]/10 blur-[120px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="z-10 text-center max-w-2xl w-full"
      >
        <h1 className="text-5xl md:text-6xl font-black tracking-widest mb-6">
          <span className="text-[#EDFF66]">CODE</span>
          <span className="text-white">JUDGE</span>
        </h1>
        <p className="text-zinc-400 text-lg mb-12 max-w-lg mx-auto">
          Welcome to the AI-Powered Code Grading & Doubt Resolution Portal. Please select your role to continue.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-xl mx-auto">
          {/* Student Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleLogin("STUDENT")}
            className="flex flex-col items-center justify-center gap-4 p-8 rounded-2xl bg-[#0a0a0f] border border-[#EDFF66]/30 hover:bg-[#0c0c12] hover:border-[#EDFF66]/60 transition-all group shadow-xl shadow-black/50"
          >
            <div className="w-16 h-16 rounded-full bg-[#EDFF66]/10 flex items-center justify-center group-hover:bg-[#EDFF66]/20 transition-colors">
              <GraduationCap className="w-8 h-8 text-[#EDFF66]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Login as Student</h2>
              <p className="text-xs text-zinc-500">Access sandbox and assignments</p>
            </div>
          </motion.button>

          {/* Teacher Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleLogin("TEACHER")}
            className="flex flex-col items-center justify-center gap-4 p-8 rounded-2xl bg-[#0a0a0f] border border-purple-500/30 hover:bg-[#0c0c12] hover:border-purple-500/60 transition-all group shadow-xl shadow-black/50"
          >
            <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
              <Briefcase className="w-8 h-8 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Login as Teacher</h2>
              <p className="text-xs text-zinc-500">Review doubts and manage tasks</p>
            </div>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
