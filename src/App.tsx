import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useLiveMetrics } from "./hooks/useLiveMetrics";

function App() {
  const [hasToken, setHasToken] = useState(
    !!localStorage.getItem("streamPayToken"),
  );
  const { data, currentCount, isConnected, authError } = useLiveMetrics(
    hasToken ? "http://localhost:3001" : "",
  );

  const handleLogin = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "user_123" }),
      });

      const { token } = await response.json();
      localStorage.setItem("streamPayToken", token);
      setHasToken(true);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("streamPayToken");
    setHasToken(false);
  };

  if (!hasToken || authError) {
    return (
      <div
        style={{
          padding: "40px",
          backgroundColor: "#0f172a",
          color: "white",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <h2>StreamPay Secure Dashboard</h2>
        {authError && <p style={{ color: "#ef4444" }}>{authError}</p>}
        <button
          onClick={handleLogin}
          style={{
            padding: "10px 20px",
            fontSize: "1.2rem",
            cursor: "pointer",
            backgroundColor: "#38bdf8",
            border: "none",
            borderRadius: "4px",
            color: "#0f172a",
            fontWeight: "bold",
          }}
        >
          Authenticate & Connect
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "40px",
        fontFamily: "system-ui, sans-serif",
        backgroundColor: "#0f172a",
        color: "white",
        minHeight: "100vh",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1>StreamPay Observability</h1>
        <button
          onClick={handleLogout}
          style={{
            padding: "8px 16px",
            cursor: "pointer",
            backgroundColor: "#334155",
            color: "white",
            border: "none",
            borderRadius: "4px",
          }}
        >
          Disconnect
        </button>
      </div>

      <p style={{ color: isConnected ? "#22c55e" : "#f59e0b" }}>
        {isConnected ? "🟢 Live System Connection" : "🟡 Reconnecting..."}
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
          Concurrent Viewers
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
