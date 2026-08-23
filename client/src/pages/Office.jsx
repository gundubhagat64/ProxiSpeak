import { useEffect } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import OfficeCanvas from "../components/OfficeCanvas";
import socket from "../socket";

function Office() {
  useEffect(() => {
    socket.connect();

    socket.on("connect", () => {
      console.log("✅ Socket connected");
      console.log("🆔 Socket ID:", socket.id);
    });

    socket.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error.message);
    });

    return () => {
      socket.off("connect");
      socket.off("connect_error");
      socket.disconnect();
    };
  }, []);

  return (
    <div className="h-screen bg-slate-950 flex flex-col">

      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <OfficeCanvas />
      </div>

    </div>
  );
}

export default Office;