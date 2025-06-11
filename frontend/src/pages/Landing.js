import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useConfig } from "../context/ConfigContext";

export default function Landing() {
  const navigate = useNavigate();
  const {
    broker,
    setBroker,
    eegTopic,
    setEegTopic,
    affectTopic,
    setAffectTopic,
  } = useConfig();

  // Motion variants for staggered animation
  const container = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.2 } },
  };
  const item = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

  const onStart = () => {
    // you can also validate that none are empty…
    navigate("/timer");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-200 to-purple-400">
      <motion.div
        className="p-1 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
        variants={container}
        initial="hidden"
        animate="visible"
      >
        <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md">
          <motion.h1
            className="text-4xl font-bold text-center mb-6"
            variants={item}
          >
            Emotiv Focus Timer
          </motion.h1>

          <motion.input
            type="text"
            value={broker}
            onChange={(e) => setBroker(e.target.value)}
            placeholder="MQTT Broker"
            className="w-full mb-4 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            variants={item}
          />

          <motion.input
            type="text"
            value={eegTopic}
            onChange={(e) => setEegTopic(e.target.value)}
            placeholder="EEG Topic"
            className="w-full mb-4 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            variants={item}
          />

          <motion.input
            type="text"
            value={affectTopic}
            onChange={(e) => setAffectTopic(e.target.value)}
            placeholder="Affect Topic"
            className="w-full mb-6 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            variants={item}
          />

          <motion.button
            className="w-full p-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onStart}
            variants={item}
          >
            Start
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
