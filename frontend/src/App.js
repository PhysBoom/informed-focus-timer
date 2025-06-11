import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ConfigProvider } from "./context/ConfigContext";
import Landing from "./pages/Landing";
import Timer from "./pages/Timer";
import SummaryPage from "./pages/Summary";
import { FocusMetricsProvider } from "./context/FocusMetricsContext";

export default function App() {
  return (
    <ConfigProvider>
      <FocusMetricsProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/timer" element={<Timer />} />
            <Route path="/summary" element={<SummaryPage />} />
          </Routes>
        </Router>
      </FocusMetricsProvider>
    </ConfigProvider>
  );
}
