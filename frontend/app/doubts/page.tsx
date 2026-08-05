// @ts-nocheck
"use client";

import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useRole } from "../../components/RoleProvider";
import { motion } from "framer-motion";

export default function DoubtBoard() {
  const { role } = useRole();
  const [doubts, setDoubts] = useState<any[]>([]);
  const [newDoubt, setNewDoubt] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDoubts();
  }, []);

  const fetchDoubts = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/doubts");
      const data = await res.json();
      setDoubts(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handlePostDoubt = async () => {
    if (!newDoubt.trim()) return;
    setLoading(true);
    try {
      // Mock studentId - in a real app this comes from auth
      const res = await fetch("http://localhost:5000/api/doubts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: "student-123", content: newDoubt }),
      });
      if (res.ok) {
        setNewDoubt("");
        alert("Doubt posted! The AI is drafting an answer for teacher review.");
        fetchDoubts();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to post doubt");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDoubt = async (id: string) => {
    if (!confirm("Are you sure you want to delete this doubt?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/doubts/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchDoubts();
      } else {
        alert("Failed to delete doubt");
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-[#050507] text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-[#EDFF66]">Doubt Resolution Board</h1>
          <button 
            onClick={fetchDoubts}
            className="text-sm bg-[#1e1e24] px-4 py-2 rounded hover:bg-[#2a2a32] transition-colors"
          >
            Refresh Board
          </button>
        </div>
        
        {role === "STUDENT" && (
          <div className="bg-[#1e1e24] p-6 rounded-lg mb-10 border border-white/10">
            <h2 className="text-xl font-semibold mb-4">Post a new doubt</h2>
            <textarea
              className="w-full bg-[#0a0a0f] border border-white/20 rounded p-4 text-white focus:outline-none focus:border-[#EDFF66] transition-colors h-32"
              placeholder="E.g., Why do we get a segmentation fault here?"
              value={newDoubt}
              onChange={(e) => setNewDoubt(e.target.value)}
            />
            <button
              onClick={handlePostDoubt}
              disabled={loading}
              className="mt-4 bg-[#EDFF66] text-black font-semibold py-2 px-6 rounded hover:bg-[#d4e65c] transition-colors disabled:opacity-50"
            >
              {loading ? "Posting..." : "Post Doubt"}
            </button>
          </div>
        )}

        <div className="space-y-6">
          <h2 className="text-2xl font-semibold mb-4 border-b border-white/10 pb-2">Recent Doubts</h2>
          {doubts.map((doubt, index) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              key={doubt.id} 
              className="bg-[#0a0a0f] border border-white/10 rounded-lg p-6 hover:border-[#EDFF66]/50 transition-colors"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-xs text-gray-500">
                    {new Date(doubt.createdAt).toLocaleString()}
                  </span>
                </div>
                {role === "STUDENT" && (
                  <button 
                    onClick={() => handleDeleteDoubt(doubt.id)}
                    className="text-xs text-red-500 hover:text-red-400 transition-colors bg-red-500/10 hover:bg-red-500/20 px-2 py-1 rounded"
                  >
                    Delete
                  </button>
                )}
              </div>
              <div className="mb-4 text-lg">
                <span className="font-bold text-gray-400">Q: </span>
                {doubt.content}
              </div>
              
              {doubt.responses && doubt.responses.length > 0 ? (
                <div className={`bg-[#1e1e24] p-4 rounded border-l-4 ${doubt.responses[0].status === 'DRAFT' ? 'border-orange-500' : 'border-[#EDFF66]'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs uppercase font-bold tracking-wider ${doubt.responses[0].status === 'DRAFT' ? 'text-orange-500' : 'text-[#EDFF66]'}`}>
                      Answered by {doubt.responses[0].author}
                    </span>
                    {doubt.responses[0].status === 'DRAFT' && (
                      <span className="text-[10px] bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full border border-orange-500/50">
                        Pending Teacher Verification
                      </span>
                    )}
                  </div>
                  <div className="prose prose-invert max-w-none">
                    <ReactMarkdown>{doubt.responses[0].content}</ReactMarkdown>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500 italic">
                  Waiting for an approved answer...
                </div>
              )}
            </motion.div>
          ))}
          {doubts.length === 0 && (
            <div className="text-gray-500 text-center py-10">No doubts posted yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
