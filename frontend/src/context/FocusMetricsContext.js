import React, { createContext, useState, useContext } from "react";

const FocusMetricsContext = createContext();

export function FocusMetricsProvider({
  children,
  eegKeys = ["T7", "T8", "Pz", "AF3", "AF4"],
  affectKeys = [
    "Stress",
    "Attention or Focus",
    "Interest",
    "Engagement",
    "Relaxation",
    "Excitement",
  ],
}) {
  const [eegSpikeCounts, setEegSpikeCounts] = useState(() =>
    eegKeys.reduce((o, k) => ({ ...o, [k]: 0 }), {})
  );
  const [affectSpikeCounts, setAffectSpikeCounts] = useState(() =>
    affectKeys.reduce((o, k) => ({ ...o, [k]: 0 }), {})
  );
  const [totalFocusedTime, setTotalFocusedTime] = useState(0);

  return (
    <FocusMetricsContext.Provider
      value={{
        eegSpikeCounts,
        setEegSpikeCounts,
        affectSpikeCounts,
        setAffectSpikeCounts,
        totalFocusedTime,
        setTotalFocusedTime,
      }}
    >
      {children}
    </FocusMetricsContext.Provider>
  );
}

export function useFocusMetrics() {
  const ctx = useContext(FocusMetricsContext);
  if (!ctx) {
    throw new Error("useFocusMetrics must be inside FocusMetricsProvider");
  }
  return ctx;
}
