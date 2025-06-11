// SpikeGrapher.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Scatter,
} from "recharts";

export default function SpikeGrapher({
  mqttLink,
  mqttPort = 1883,
  mqttTopic,
  keepalive = 3600,
  keys,
  record = true,
  onSpikeEnter = () => {},
  onSpikeExit = () => {},
}) {
  const spikeQueue = useRef({});
  const sum = useRef({});
  const sumSq = useRef({});
  const inSpike = useRef({});

  // Refs to hold the latest callbacks without re-running effects
  const onEnterRef = useRef(onSpikeEnter);
  const onExitRef = useRef(onSpikeExit);
  useEffect(() => {
    onEnterRef.current = onSpikeEnter;
    onExitRef.current = onSpikeExit;
  }, [onSpikeEnter, onSpikeExit]);

  // Helper to create distinct “empty” data points
  const makeEmptyPoint = () => ({
    time: new Date().toLocaleTimeString(),
    ...keys.reduce(
      (o, k) => ({
        ...o,
        [`${k}_avg`]: 0,
        [`${k}_upper`]: 0,
        [`${k}_lower`]: 0,
      }),
      {}
    ),
  });
  const [data, setData] = useState(Array.from({ length: 60 }, makeEmptyPoint));
  const [listenerId, setListenerId] = useState(null);

  // 1) Create the MQTT listener once (on mount or when broker/topic change)
  useEffect(() => {
    if (!mqttLink || !mqttTopic) return;

    const windowSize = 60;
    keys.forEach((key) => {
      spikeQueue.current[key] = Array(windowSize).fill(0);
      sum.current[key] = 0;
      sumSq.current[key] = 0;
      inSpike.current[key] = false;
    });

    let active = true;
    let idRef = null;

    fetch(`${process.env.REACT_APP_API_URL}/listener/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        broker: mqttLink,
        port: mqttPort,
        keepalive,
        topics: [mqttTopic],
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to create listener");
        return res.json();
      })
      .then(({ id }) => {
        if (!active) {
          // unmounted before we got our ID
          fetch(`${process.env.REACT_APP_API_URL}/listener/${id}`, {
            method: "DELETE",
          }).catch(() => {});
        } else {
          idRef = id;
          setListenerId(id);
        }
      })
      .catch((err) => console.error("Listener creation error:", err));

    return () => {
      active = false;
      if (idRef) {
        fetch(`${process.env.REACT_APP_API_URL}/listener/${idRef}`, {
          method: "DELETE",
        }).catch(() => {});
        setListenerId(null);
      }
    };
  }, [mqttLink, mqttTopic, mqttPort, keepalive]);

  // 2) Poll every second, only while `record` is true and we have a listener
  useEffect(() => {
    if (!record || !listenerId) return;

    const windowSize = 60;
    const iv = setInterval(() => {
      fetch(`${process.env.REACT_APP_API_URL}/listener/${listenerId}`)
        .then((res) => {
          if (!res.ok) throw new Error("Listener not found");
          return res.json();
        })
        .then(({ messages }) => {
          const point = { time: new Date().toLocaleTimeString() };
          const sums = {};
          const counts = {};

          messages.forEach(({ payload }) => {
            let msg;
            try {
              msg = JSON.parse(payload);
            } catch {
              return;
            }
            keys.forEach((key) => {
              const val = parseFloat(msg[key]);
              if (!isNaN(val)) {
                sums[key] = (sums[key] || 0) + val;
                counts[key] = (counts[key] || 0) + 1;
              }
            });
          });

          keys.forEach((key) => {
            const avg = counts[key] ? sums[key] / counts[key] : 0;
            point[`${key}_avg`] = Number(avg.toFixed(2));

            // Update sliding window
            const q = spikeQueue.current[key];
            const old = q.shift();
            q.push(avg);

            // Running stats
            sum.current[key] += avg - old;
            sumSq.current[key] += avg * avg - old * old;
            const mean = sum.current[key] / windowSize;
            const variance = sumSq.current[key] / windowSize - mean * mean;
            const std = Math.sqrt(Math.max(0, variance));
            const upper = mean + 2 * std;
            const lower = mean - 2 * std;
            point[`${key}_upper`] = Number(upper.toFixed(2));
            point[`${key}_lower`] = Number(lower.toFixed(2));

            // Spike entry/exit detection
            const above = avg > upper || avg < lower;
            if (!inSpike.current[key] && above) {
              point[`${key}_start`] = Number(avg.toFixed(2));
              inSpike.current[key] = true;
              onEnterRef.current(key);
            } else if (inSpike.current[key] && !above) {
              point[`${key}_end`] = Number(avg.toFixed(2));
              inSpike.current[key] = false;
              onExitRef.current(key);
            }
          });

          setData((prev) => [...prev, point].slice(-windowSize));
        })
        .catch((err) => console.error("Polling error:", err));
    }, 1000);

    return () => clearInterval(iv);
  }, [record, listenerId]);

  // Debug
  useEffect(() => {
    console.log("chart data updated:", data);
  }, [data]);

  return (
    <div className="p-4 w-full">
      <ComposedChart
        width={500}
        height={400}
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="time" />
        <YAxis domain={["auto", "auto"]} />
        <Tooltip />
        <Legend />

        {keys.map((key, i) => (
          <Line
            key={`${key}-avg`}
            dataKey={`${key}_avg`}
            stroke={["#8884d8", "#82ca9d", "#ff7300"][i % 3]}
            dot={false}
          />
        ))}

        {keys.map((key) => (
          <Scatter key={`${key}-start`} dataKey={`${key}_start`} fill="red" />
        ))}
        {keys.map((key) => (
          <Scatter key={`${key}-end`} dataKey={`${key}_end`} fill="blue" />
        ))}
      </ComposedChart>
    </div>
  );
}
