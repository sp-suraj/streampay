import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const socket = io("http://localhost:3000");

interface MetricData {
  time: string;
  count: number;
}

function App() {
  const [data, setData] = useState<MetricData[]>([]);
  const [currentCount, setCurrentCount] = useState<number>(0);

  useEffect(() => {
    socket.on("live_metrics", (incomingData: MetricData) => {
      setCurrentCount(incomingData.count);

      setData((prevData) => {
        const newData = [...prevData, incomingData];
        return newData.slice(-20);
      });
    });

    return () => {
      socket.off("live_metrics");
    };
  }, []);

  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        backgroundColor: "#0f172a",
        color: "white",
        minHeight: "100vh",
      }}
    >
      <h1>StreamPay Observability</h1>
      <p style={{ color: "#94a3b8" }}>
        Real-time event processing throughput via Kafka & Redis
      </p>

      <div
        style={{
          margin: "20px 0",
          padding: "20px",
          backgroundColor: "#1e293b",
          borderRadius: "8px",
          display: "inline-block",
        }}
      >
        <h2 style={{ margin: 0, fontSize: "3rem", color: "#38bdf8" }}>
          {currentCount.toLocaleString()}
        </h2>
        <span style={{ fontSize: "0.9rem", color: "#94a3b8" }}>
          Total Heartbeats Processed
        </span>
      </div>

      <div style={{ width: "100%", height: 400, marginTop: "40px" }}>
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="time" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" domain={["dataMin", "auto"]} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "none",
                borderRadius: "4px",
              }}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#38bdf8"
              strokeWidth={3}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default App;
