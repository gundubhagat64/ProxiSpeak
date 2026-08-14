function MiniMap({ position, users }) {
  return (
    <div className="absolute bottom-4 right-4 w-40 h-32 bg-black/70 backdrop-blur-md border border-cyan-400 rounded-xl shadow-xl p-2 z-50">

      {/* Title */}
      <h3 className="text-cyan-300 text-xs font-semibold text-center mb-1">
        🗺 Map
      </h3>

      {/* Map */}
      <div className="relative w-full h-20 bg-slate-900 rounded-md overflow-hidden border border-slate-700">

        {/* Grid */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)
            `,
            backgroundSize: "15px 15px",
          }}
        />

        {/* Meeting Room */}
        <div
          className="absolute bg-cyan-500/30 border border-cyan-400 rounded"
          style={{
            left: 8,
            top: 48,
            width: 28,
            height: 16,
          }}
        />

        {/* Table 1 */}
        <div
          className="absolute bg-amber-500 rounded"
          style={{
            left: 48,
            top: 24,
            width: 16,
            height: 8,
          }}
        />

        {/* Table 2 */}
        <div
          className="absolute bg-amber-500 rounded"
          style={{
            left: 90,
            top: 46,
            width: 16,
            height: 8,
          }}
        />

        {/* You */}
        <div
          className="absolute w-2.5 h-2.5 bg-cyan-400 rounded-full border border-white"
          style={{
            left: position.x / 10,
            top: position.y / 10,
          }}
        />

        {/* Other Users */}
        {users.map((user) => (
          <div
            key={user.id}
            className="absolute w-2.5 h-2.5 bg-white rounded-full"
            style={{
              left: user.x / 10,
              top: user.y / 10,
            }}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex justify-between text-[8px] text-gray-400 mt-1">
        <span>🔵 You</span>
        <span>⚪ Users</span>
        <span>🟫 Desk</span>
      </div>

    </div>
  );
}

export default MiniMap;