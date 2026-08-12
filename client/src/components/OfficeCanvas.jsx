import { useEffect, useState } from "react";
import Avatar from "./Avatar";

function OfficeCanvas() {
  const [position, setPosition] = useState({
    x: 200,
    y: 150,
  });

  const username = localStorage.getItem("username") || "Guest";

  useEffect(() => {
    const handleKey = (e) => {
      setPosition((prev) => {
        let { x, y } = prev;

        if (e.key === "ArrowUp") y -= 10;
        if (e.key === "ArrowDown") y += 10;
        if (e.key === "ArrowLeft") x -= 10;
        if (e.key === "ArrowRight") x += 10;

        return { x, y };
      });
    };

    window.addEventListener("keydown", handleKey);

    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <div className="flex-1 relative overflow-hidden bg-slate-900">

      {/* Grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px",
        }}
      />

      {/* Table */}
      <div
        className="absolute bg-amber-700 rounded-lg"
        style={{
          left: "350px",
          top: "180px",
          width: "140px",
          height: "80px",
        }}
      />

      {/* Table */}
      <div
        className="absolute bg-amber-700 rounded-lg"
        style={{
          left: "650px",
          top: "320px",
          width: "140px",
          height: "80px",
        }}
      />

      <Avatar
        x={position.x}
        y={position.y}
        name={username}
      />
    </div>
  );
}

export default OfficeCanvas;