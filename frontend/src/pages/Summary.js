import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useFocusMetrics } from "../context/FocusMetricsContext";

/**
 * SummaryPage shows a recap of focus metrics collected during the session.
 * It displays total focused time, EEG spike exits per channel, and affect spike exits.
 * When clicking "Back to Timer", it resets all metrics in context before navigating back.
 */
export default function SummaryPage() {
  const navigate = useNavigate();
  const {
    eegSpikeCounts,
    affectSpikeCounts,
    totalFocusedTime,
    setEegSpikeCounts,
    setAffectSpikeCounts,
    setTotalFocusedTime,
  } = useFocusMetrics();

  // Reset all focus metrics in context
  const resetMetrics = () => {
    // reset EEG counts
    setEegSpikeCounts(
      Object.fromEntries(Object.keys(eegSpikeCounts).map((k) => [k, 0]))
    );
    // reset affect counts
    setAffectSpikeCounts(
      Object.fromEntries(Object.keys(affectSpikeCounts).map((k) => [k, 0]))
    );
    // reset total focused time
    setTotalFocusedTime(0);
  };

  // Format seconds to MM:SS or HH:MM:SS if over an hour
  const formatTime = (secs) => {
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const seconds = Math.floor(secs % 60)
      .toString()
      .padStart(2, "0");
    return hours > 0
      ? `${hours}:${minutes}:${seconds}`
      : `${minutes}:${seconds}`;
  };

  // Layout animations
  const container = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } },
  };
  const item = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <motion.div
        className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-md"
        variants={container}
        initial="hidden"
        animate="visible"
      >
        <motion.h1
          variants={item}
          className="text-3xl font-bold mb-6 text-center"
        >
          Session Summary
        </motion.h1>

        <motion.div variants={item} className="mb-6">
          <h2 className="text-xl font-semibold">Total Focused Time</h2>
          <p className="text-2xl font-mono mt-2">
            {formatTime(totalFocusedTime)}
          </p>
        </motion.div>

        <motion.div variants={item} className="mb-6">
          <h2 className="text-xl font-semibold">EEG Spike Exits</h2>
          <div className="grid grid-cols-2 gap-4 mt-2">
            {Object.entries(eegSpikeCounts).map(([key, count]) => (
              <div key={key} className="flex justify-between">
                <span>{key}:</span>
                <span className="font-mono">{count}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={item} className="mb-6">
          <h2 className="text-xl font-semibold">Affect Spike Exits</h2>
          <div className="grid grid-cols-2 gap-4 mt-2">
            {Object.entries(affectSpikeCounts).map(([key, count]) => (
              <div key={key} className="flex justify-between">
                <span>{key}:</span>
                <span className="font-mono">{count}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={item} className="text-center mt-8">
          <button
            onClick={() => {
              resetMetrics();
              navigate(-1);
            }}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
          >
            Back to Timer
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
