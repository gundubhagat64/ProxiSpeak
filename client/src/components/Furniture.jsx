function Furniture() {
  return (
    <>
      {/* ================= WINDOWS ================= */}

      <div
        className="absolute bg-sky-300/40 border border-sky-200 rounded-xl"
        style={{ left: "120px", top: "25px", width: "180px", height: "18px" }}
      />

      <div
        className="absolute bg-sky-300/40 border border-sky-200 rounded-xl"
        style={{ left: "900px", top: "25px", width: "180px", height: "18px" }}
      />

      {/* ================= RECEPTION ================= */}

      <div
        className="absolute bg-slate-800 border border-cyan-400 rounded-xl flex flex-col items-center justify-center shadow-xl"
        style={{
          left: "20px",
          top: "120px",
          width: "180px",
          height: "90px",
        }}
      >
        <span className="text-3xl">🏢</span>
        <span className="text-cyan-300 font-semibold">
          Reception
        </span>
      </div>

      {/* ================= PLANTS ================= */}

      <div className="absolute text-4xl" style={{ left: "40px", top: "330px" }}>
        🪴
      </div>

      <div className="absolute text-4xl" style={{ left: "1110px", top: "120px" }}>
        🌿
      </div>

      <div className="absolute text-4xl" style={{ left: "1050px", top: "560px" }}>
        🪴
      </div>

      {/* ================= DESK 1 ================= */}

      <Desk x={350} y={170} />

      {/* ================= DESK 2 ================= */}

      <Desk x={650} y={170} />

      {/* ================= DESK 3 ================= */}

      <Desk x={350} y={350} />

      {/* ================= DESK 4 ================= */}

      <Desk x={650} y={350} />

      {/* ================= COFFEE ================= */}

      <div
        className="absolute bg-gradient-to-br from-green-600 to-emerald-700 rounded-2xl border border-green-300 shadow-xl flex flex-col justify-center items-center"
        style={{
          left: "920px",
          top: "250px",
          width: "190px",
          height: "140px",
        }}
      >
        <span className="text-5xl">☕</span>

        <span className="text-white font-bold text-lg">
          Coffee Zone
        </span>

        <span className="text-green-100 text-xs">
          Take a Break
        </span>
      </div>

      {/* ================= MEETING ROOM ================= */}

      <div
        className="absolute bg-cyan-500/10 backdrop-blur-md border-2 border-cyan-400 rounded-2xl shadow-2xl flex flex-col items-center justify-center"
        style={{
          left: "120px",
          top: "430px",
          width: "260px",
          height: "170px",
        }}
      >
        <span className="text-5xl">🎤</span>

        <span className="text-cyan-300 font-bold text-lg">
          Meeting Room
        </span>

        <span className="text-cyan-200 text-xs">
          Capacity : 10
        </span>
      </div>
    </>
  );
}

function Desk({ x, y }) {
  return (
    <>
      <div
        className="absolute bg-gradient-to-r from-amber-700 to-yellow-600 rounded-xl border border-yellow-400 shadow-xl"
        style={{
          left: x,
          top: y,
          width: "170px",
          height: "90px",
        }}
      />

      <div
        className="absolute bg-slate-900 rounded-md border border-gray-600"
        style={{
          left: x + 65,
          top: y + 12,
          width: "40px",
          height: "28px",
        }}
      />

      <div
        className="absolute bg-gray-300 rounded"
        style={{
          left: x + 55,
          top: y + 48,
          width: "60px",
          height: "8px",
        }}
      />

      <div
        className="absolute text-3xl"
        style={{ left: x - 28, top: y + 22 }}
      >
        💺
      </div>

      <div
        className="absolute text-3xl"
        style={{ left: x + 175, top: y + 22 }}
      >
        💺
      </div>

      <div
        className="absolute text-xl"
        style={{ left: x + 10, top: y + 10 }}
      >
        ☕
      </div>
    </>
  );
}

export default Furniture;