"use client";

import { motion } from "framer-motion";

export function Loader({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] w-full h-full space-y-4">
      <div className="relative flex items-center justify-center">
        {/* Outer rotating ring */}
        <motion.div
          className="absolute w-16 h-16 rounded-full border-t-2 border-r-2 border-primary"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Inner pulsing ring */}
        <motion.div
          className="absolute w-12 h-12 rounded-full border-2 border-primary/30"
          animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Center dot */}
        <motion.div
          className="w-4 h-4 bg-primary rounded-full shadow-lg shadow-primary/50"
          animate={{ scale: [1, 1.5, 1] }}
          transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
      
      {/* Loading Text */}
      <motion.div
        className="text-sm font-medium text-muted-foreground tracking-widest uppercase"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      >
        {text}
      </motion.div>
    </div>
  );
}
