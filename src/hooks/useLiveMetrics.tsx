import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

export interface MetricData {
  time: string;
  count: number;
}

export const useLiveMetrics = (serverUrl: string) => {
  const [data, setData] = useState<MetricData[]>([]);
  const [currentCount, setCurrentCount] = useState<number>(0);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("streamPayToken");

    if (!token) {
      setAuthError("Authentication required. Please log in.");
      return;
    }

    const socket: Socket = io(serverUrl, {
      auth: {
        token: token,
      },
    });

    socket.on("connect", () => {
      setIsConnected(true);
      setAuthError(null);
    });

    socket.on("connect_error", (err) => {
      console.error("WebSocket Connection Error:", err.message);
      setAuthError(err.message);
      setIsConnected(false);
    });

    socket.on("disconnect", () => setIsConnected(false));

    socket.on("live_metrics", (incomingData: MetricData) => {
      setCurrentCount(incomingData.count);
      setData((prevData) => {
        const newData = [...prevData, incomingData];
        return newData.slice(-20);
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [serverUrl]);

  return { data, currentCount, isConnected, authError };
};
