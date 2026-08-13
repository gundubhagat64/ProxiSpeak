import { useEffect, useState } from "react";
import Avatar from "./Avatar";
import Furniture from "./Furniture";

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
    { x: 350, y: 180, width: 140, height: 80 },   // Table 1
    { x: 650, y: 320, width: 140, height: 80 },   // Table 2
    { x: 100, y: 430, width: 220, height: 140 },  // Meeting Room
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

        // Stop at Furniture
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

      {/* Office Furniture */}
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
    </div>
  );
}

export default OfficeCanvas;