"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../../components/ui/button";

export default function StudentAssignmentsPage() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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

  return (
    <div className="text-white p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-black tracking-wider uppercase mb-8">Questions</h1>
        
        {loading ? (
          <div className="text-zinc-500">Loading assignments...</div>
        ) : assignments.length === 0 ? (
          <div className="text-zinc-500">No assignments available yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {assignments.map((a) => (
              <div 
                key={a.id} 
                className="bg-[#09090b] border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all flex flex-col"
              >
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-white/90 mb-2">{a.title}</h2>
                  <p className="text-zinc-400 text-sm line-clamp-3 mb-4">
                    {a.description}
                  </p>
                  <div className="text-xs text-zinc-500 font-mono mb-4">
                    {a.testCases?.length || 0} Test Case(s)
                  </div>
                </div>
                <Button 
                  className="w-full bg-white text-black hover:bg-zinc-200"
                  onClick={() => router.push(`/student/assignments/${a.id}`)}
                >
                  Solve Assignment
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
