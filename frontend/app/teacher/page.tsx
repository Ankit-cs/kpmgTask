"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, FilePlus, Users } from "lucide-react";
import { motion } from "framer-motion";

export default function TeacherDashboard() {
  const router = useRouter();

  const cards = [
    {
      title: "Review Portal",
      description: "Review and approve AI-generated doubt drafts for your students.",
      icon: CheckCircle,
      href: "/teacher/review",
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
      hoverBorder: "hover:border-purple-500/50"
    },
    {
      title: "Create Assignment",
      description: "Create new coding assignments and define test cases for automatic grading.",
      icon: FilePlus,
      href: "/teacher/assignments/new",
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      hoverBorder: "hover:border-blue-500/50"
    }
  ];

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Teacher Dashboard</h1>
        <p className="text-zinc-400 mb-8">Manage assignments and review student doubts.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cards.map((card, idx) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              key={card.title}
              onClick={() => router.push(card.href)}
              className={`cursor-pointer rounded-xl p-6 border ${card.border} ${card.hoverBorder} bg-[#09090b] transition-all hover:bg-[#0c0c0f] flex flex-col group`}
            >
              <div className={`w-12 h-12 rounded-lg ${card.bg} flex items-center justify-center mb-4`}>
                <card.icon className={`w-6 h-6 ${card.color}`} />
              </div>
              <h2 className="text-xl font-bold text-white/90 mb-2 group-hover:text-white transition-colors">{card.title}</h2>
              <p className="text-zinc-400 text-sm">
                {card.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
