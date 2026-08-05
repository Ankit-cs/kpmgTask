"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, Edit } from "lucide-react";
import { Button } from "../../../components/ui/button";

export default function TeacherAssignmentsPage() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAssignments() {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const res = await fetch(`${API_URL}/api/assignments`);
        if (res.ok) {
          const data = await res.json();
          setAssignments(data);
        }
      } catch (e) {
        console.error("Failed to fetch assignments", e);
      } finally {
        setLoading(false);
      }
    }
    fetchAssignments();
  }, []);

  if (loading) {
    return <div className="p-8 text-zinc-400">Loading assignments...</div>;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[#EDFF66]">Manage Assignments</h1>
          <p className="text-zinc-400 mt-1">Create, edit, and view all coding challenges.</p>
        </div>
        <Button 
          onClick={() => router.push("/teacher/assignments/new")}
          className="bg-[#EDFF66] hover:bg-[#d4e65c] text-black font-bold"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Assignment
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {assignments.map((assignment, idx) => (
          <motion.div 
            key={assignment.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-[#1e1e24] border border-white/10 rounded-xl p-5 hover:border-[#EDFF66]/50 transition-colors flex flex-col group relative overflow-hidden"
          >
            <h2 className="text-xl font-bold text-white mb-2">{assignment.title}</h2>
            <p className="text-sm text-zinc-400 line-clamp-2 mb-4 flex-1">
              {assignment.description}
            </p>
            <div className="flex items-center justify-between text-xs text-zinc-500 mb-6">
              <span>{assignment.testCases?.length || 0} Test Cases</span>
            </div>
            
            <Button 
              variant="outline"
              className="w-full bg-white/5 border-white/10 hover:bg-white/10 hover:text-white group-hover:bg-[#EDFF66] group-hover:text-black group-hover:border-[#EDFF66] transition-all"
              onClick={() => router.push(`/teacher/assignments/${assignment.id}/edit`)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Assignment
            </Button>
          </motion.div>
        ))}
      </div>

      {assignments.length === 0 && (
        <div className="text-center py-20 bg-[#1e1e24] rounded-xl border border-white/5 border-dashed">
          <p className="text-zinc-500 mb-4">No assignments created yet.</p>
          <Button 
            variant="outline"
            onClick={() => router.push("/teacher/assignments/new")}
          >
            Create Your First Assignment
          </Button>
        </div>
      )}
    </div>
  );
}
