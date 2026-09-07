import { useEffect } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import OfficeCanvas from "../components/OfficeCanvas";
import socket from "../socket";

function Office() {
  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    const handleConnect = () => {
      console.log("✅ Socket connected");
      console.log("🆔 Socket ID:", socket.id);
    };

    const handleConnectError = (error) => {
      console.error(
        "❌ Socket connection error:",
        error.message
      );
    };

    socket.on("connect", handleConnect);
    socket.on(
      "connect_error",
      handleConnectError
    );

    return () => {
      socket.off("connect", handleConnect);
      socket.off(
        "connect_error",
        handleConnectError
      );
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