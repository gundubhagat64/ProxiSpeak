import { useEffect, useState } from "react";
import Avatar from "./Avatar";
import Furniture from "./Furniture";
import MiniMap from "./MiniMap";

function OfficeCanvas() {
  const [position, setPosition] = useState({
    x: 200,
    y: 150,
  });

  const username = localStorage.getItem("username") || "Guest";

  // Dummy Employees
  const users = [
    { id: 1, name: "Rahul", x: 550, y: 180 },
    { id: 2, name: "Priya", x: 650, y: 250 },
    { id: 3, name: "Amit", x: 350, y: 350 },
    { id: 4, name: "Neha", x: 800, y: 180 },
  ];

  // Obstacles
  const obstacles = [
    { x: 350, y: 180, width: 140, height: 80 },
    { x: 650, y: 320, width: 140, height: 80 },
    { x: 100, y: 430, width: 220, height: 140 },
  ];

  // Collision Detection
  const checkCollision = (x, y) => {
    const avatarSize = 40;

    return obstacles.some((obj) => {
      return (
        x < obj.x + obj.width &&
        x + avatarSize > obj.x &&
        y < obj.y + obj.height &&
        y + avatarSize > obj.y
      );
    });
  };

  useEffect(() => {
    const handleKey = (e) => {
      setPosition((prev) => {
        let { x, y } = prev;

        const speed = 10;

        if (e.key === "ArrowUp") y -= speed;
        if (e.key === "ArrowDown") y += speed;
        if (e.key === "ArrowLeft") x -= speed;
        if (e.key === "ArrowRight") x += speed;

        // Canvas Boundary
        x = Math.max(0, Math.min(x, 1150));
        y = Math.max(0, Math.min(y, 650));

        // Collision Check
        if (!checkCollision(x, y)) {
          return { x, y };
        }

        return prev;
      });
    };

    window.addEventListener("keydown", handleKey);

    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <div className="flex-1 relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-black pb-16 lg:pb-0">

      {/* Glow Background */}
      <div className="absolute w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -top-32 -left-32"></div>

      <div className="absolute w-96 h-96 bg-purple-500/10 rounded-full blur-3xl bottom-0 right-0"></div>

    {/* Premium Office Floor */}
<div
  className="absolute inset-0"
  style={{
    background: `
      linear-gradient(90deg, #3b3b3b 1px, transparent 1px),
      linear-gradient(#3b3b3b 1px, transparent 1px),
      linear-gradient(135deg, #2f343c, #23272f)
    `,
    backgroundSize: "80px 80px, 80px 80px, 100% 100%",
  }}
/>

{/* Floor Lighting */}
<div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/10 pointer-events-none" />
{/* Light Reflection */}
<div
  className="absolute inset-0 pointer-events-none"
  style={{
    background:
      "linear-gradient(to bottom right, rgba(255,255,255,0.06), transparent 45%)",
  }}
/>

      {/* Furniture */}
      <Furniture />

      {/* Your Avatar */}
      <Avatar
        x={position.x}
        y={position.y}
        name={username}
      />

      {/* Dummy Users */}
      {users.map((user) => (
        <Avatar
          key={user.id}
          x={user.x}
          y={user.y}
          name={user.name}
        />
      ))}

      {/* Mini Map (Desktop Only) */}
      <div className="hidden lg:block">
        <MiniMap
          position={position}
          users={users}
        />
      </div>

    </div>
  );
}

export default OfficeCanvas;