// Timer.jsx
import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useConfig } from "../context/ConfigContext";
import SpikeGrapher from "../components/SpikeGrapher";
import { useFocusMetrics } from "../context/FocusMetricsContext";
import { useNavigate } from "react-router-dom";

// Durations in seconds
const FOCUS_DURATION = 25 * 60;
const BREAK_DURATION = 5 * 60;

export default function Timer() {
  const { broker, eegTopic, affectTopic } = useConfig();
  const navigate = useNavigate();

  const eegKeys = ["T7", "T8", "Pz", "AF3", "AF4"];
  const affectKeys = [
    "Stress",
    "Attention or Focus",
    "Interest",
    "Engagement",
    "Relaxation",
    "Excitement",
  ];

  const [phase, setPhase] = useState("Focus");
  const [endTime, setEndTime] = useState(null);
  const [timeLeft, setTimeLeft] = useState(FOCUS_DURATION);
  const [isRunning, setIsRunning] = useState(false);
  const rafRef = useRef();
  const focusStartRef = useRef(null);

  const {
    eegSpikeCounts,
    affectSpikeCounts,
    setEegSpikeCounts,
    setAffectSpikeCounts,
    setTotalFocusedTime,
  } = useFocusMetrics();

  const flushFocusTimer = () => {
    if (phase === "Focus" && focusStartRef.current != null) {
      const elapsedSec = (Date.now() - focusStartRef.current) / 1000;
      setTotalFocusedTime((t) => t + elapsedSec);
      focusStartRef.current = null;
    }
  };

  // Start or resume timer
  const startTimer = () => {
    if (!isRunning) {
      if (phase === "Focus" && focusStartRef.current == null) {
        focusStartRef.current = Date.now();
      }
      setEndTime(Date.now() + timeLeft * 1000);
      setIsRunning(true);
    }
  };

  // Pause timer
  const pauseTimer = () => {
    if (isRunning) {
      setIsRunning(false);
      flushFocusTimer();
    }
  };

  // Reset timer to phase default
  const resetTimer = () => {
    flushFocusTimer();
    const duration = phase === "Focus" ? FOCUS_DURATION : BREAK_DURATION;
    setTimeLeft(duration);
    setEndTime(null);
    setIsRunning(false);
  };

  // Switch phase
  const switchPhase = () => {
    const next = phase === "Focus" ? "Break" : "Focus";
    flushFocusTimer();
    setPhase(next);
    setTimeLeft(next === "Focus" ? FOCUS_DURATION : BREAK_DURATION);
    setEndTime(null);
    setIsRunning(false);
  };

  // Countdown loop
  useEffect(() => {
    const step = () => {
      if (isRunning && endTime) {
        const diff = Math.max(0, Math.round((endTime - Date.now()) / 1000));
        setTimeLeft(diff);
        if (diff === 0) {
          return switchPhase();
        }
      }
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isRunning, endTime]);

  // Format MM:SS
  const formatTime = (secs) => {
    const m = String(Math.floor(secs / 60)).padStart(2, "0");
    const s = String(secs % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  // Animations
  const container = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } },
  };
  const item = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-200 to-purple-400 p-4">
      <motion.div
        className="max-w-xl mx-auto"
        variants={container}
        initial="hidden"
        animate="visible"
      >
        <div className="bg-white p-8 rounded-xl shadow-xl text-center">
          <motion.h2 className="text-2xl font-semibold mb-4" variants={item}>
            {phase} Session
          </motion.h2>
          <motion.div className="text-6xl font-mono mb-6" variants={item}>
            {formatTime(timeLeft)}
          </motion.div>

          <motion.div
            className="flex justify-center space-x-4 mb-6"
            variants={item}
          >
            {!isRunning ? (
              <button
                onClick={startTimer}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700"
              >
                Start
              </button>
            ) : (
              <button
                onClick={pauseTimer}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg shadow hover:bg-yellow-600"
              >
                Pause
              </button>
            )}
            <button
              onClick={resetTimer}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg shadow hover:bg-gray-400"
            >
              Reset
            </button>
            <button
              onClick={() => {
                flushFocusTimer();
                navigate("/summary");
              }}
              className="px-4 py-2 bg-red-300 text-black rounded-lg shadow hover:bg-red-400"
            >
              End
            </button>
          </motion.div>
        </div>

        {/* Display counters if you like */}
        <div className="mt-4 text-center">
          <strong>EEG Spike Exits:</strong>{" "}
          {eegKeys.map((k) => (
            <span key={k} className="mx-2">
              {k}: {eegSpikeCounts[k]}
            </span>
          ))}
        </div>
        <div className="mt-2 text-center">
          <strong>Affect Spike Exits:</strong>{" "}
          {affectKeys.map((k) => (
            <span key={k} className="mx-2">
              {k}: {affectSpikeCounts[k]}
            </span>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium text-center mb-2">EEG Spikes</h3>
            <SpikeGrapher
              mqttLink={broker}
              mqttTopic={eegTopic}
              keys={eegKeys}
              record={isRunning}
              onSpikeExit={(key) =>
                setEegSpikeCounts((c) => ({ ...c, [key]: c[key] + 1 }))
              }
            />
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium text-center mb-2">
              Affect Spikes
            </h3>
            <SpikeGrapher
              mqttLink={broker}
              mqttTopic={affectTopic}
              keys={affectKeys}
              record={isRunning}
              onSpikeExit={(key) =>
                setAffectSpikeCounts((c) => ({ ...c, [key]: c[key] + 1 }))
              }
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
