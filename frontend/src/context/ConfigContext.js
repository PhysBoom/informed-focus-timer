import React, { createContext, useContext, useState } from "react";

const ConfigContext = createContext(null);

export function ConfigProvider({ children }) {
  const [broker, setBroker] = useState("");
  const [eegTopic, setEegTopic] = useState("");
  const [affectTopic, setAffectTopic] = useState("");

  return (
    <ConfigContext.Provider
      value={{
        broker,
        setBroker,
        eegTopic,
        setEegTopic,
        affectTopic,
        setAffectTopic,
      }}
    >
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error("useConfig must be inside ConfigProvider");
  return ctx;
}
