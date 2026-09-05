function Furniture({ items = [] }) {
  return (
    <>
      {/* ================= WINDOWS ================= */}

      <div
        className="absolute bg-sky-300/40 border border-sky-200 rounded-xl"
        style={{
          left: "120px",
          top: "25px",
          width: "180px",
          height: "18px",
        }}
      />

      <div
        className="absolute bg-sky-300/40 border border-sky-200 rounded-xl"
        style={{
          left: "900px",
          top: "25px",
          width: "180px",
          height: "18px",
        }}
      />

      {/* ================= MONGODB FURNITURE ================= */}

      {items.map((item) => {
        if (!item) return null;

        const type = (
          item.type || "table"
        ).toLowerCase();

        // Tables / desks
        if (
          type === "table" ||
          type === "desk"
        ) {
          return (
            <Desk
              key={
                item._id ||
                `${item.x}-${item.y}-${item.name}`
              }
              x={item.x}
              y={item.y}
              width={item.width}
              height={item.height}
              name={item.name}
              rotation={item.rotation}
            />
          );
        }

        // Cabinet / storage
        if (
          type === "cabinet" ||
          type === "storage"
        ) {
          return (
            <Cabinet
              key={
                item._id ||
                `${item.x}-${item.y}-${item.name}`
              }
              x={item.x}
              y={item.y}
              width={item.width}
              height={item.height}
              name={item.name}
              rotation={item.rotation}
            />
          );
        }

        // Chair
        if (type === "chair") {
          return (
            <div
              key={
                item._id ||
                `${item.x}-${item.y}`
              }
              className="absolute text-3xl"
              style={{
                left: item.x,
                top: item.y,
                transform: `rotate(${item.rotation || 0}deg)`,
              }}
            >
              🪑
            </div>
          );
        }

        // Generic furniture
        return (
          <div
            key={
              item._id ||
              `${item.x}-${item.y}-${item.name}`
            }
            className="absolute bg-slate-700/90 border border-slate-500 rounded-xl shadow-lg flex items-center justify-center"
            style={{
              left: item.x,
              top: item.y,
              width: item.width || 100,
              height: item.height || 60,
              transform: `rotate(${item.rotation || 0}deg)`,
            }}
          >
            <span className="text-white text-xs font-semibold text-center px-2">
              {item.name || "Furniture"}
            </span>
          </div>
        );
      })}

      {/* ================= STATIC DECORATION ================= */}

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

      <div
        className="absolute text-4xl"
        style={{
          left: "40px",
          top: "330px",
        }}
      >
        🪴
      </div>

      <div
        className="absolute text-4xl"
        style={{
          left: "1110px",
          top: "120px",
        }}
      >
        🌿
      </div>

      <div
        className="absolute text-4xl"
        style={{
          left: "1050px",
          top: "560px",
        }}
      >
        🪴
      </div>

      {/* ================= COFFEE ZONE ================= */}

      <div
        className="absolute bg-gradient-to-br from-green-600 to-emerald-700 rounded-2xl border border-green-300 shadow-xl flex flex-col justify-center items-center"
        style={{
          left: "920px",
          top: "250px",
          width: "190px",
          height: "140px",
        }}
      >
        <span className="text-5xl">
          ☕
        </span>

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
        <span className="text-5xl">
          🎤
        </span>

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

/* =====================================================
   DESK / TABLE
===================================================== */

function Desk({
  x = 0,
  y = 0,
  width = 170,
  height = 90,
  name,
  rotation = 0,
}) {
  return (
    <div
      className="absolute"
      style={{
        left: x,
        top: y,
        width,
        height,
        transform: `rotate(${rotation || 0}deg)`,
      }}
    >
      {/* Table */}

      <div
        className="absolute bg-gradient-to-r from-amber-700 to-yellow-600 rounded-xl border border-yellow-400 shadow-xl"
        style={{
          width: "100%",
          height: "100%",
        }}
      />

      {/* Monitor */}

      <div
        className="absolute bg-slate-900 rounded-md border border-gray-600"
        style={{
          left: "50%",
          top: "12px",
          width: "40px",
          height: "28px",
          transform: "translateX(-50%)",
        }}
      />

      {/* Keyboard */}

      <div
        className="absolute bg-gray-300 rounded"
        style={{
          left: "50%",
          top: "48px",
          width: "60px",
          height: "8px",
          transform: "translateX(-50%)",
        }}
      />

      {/* Chair */}

      <div
        className="absolute text-3xl"
        style={{
          left: "-28px",
          top: "22px",
        }}
      >
        💺
      </div>

      <div
        className="absolute text-3xl"
        style={{
          right: "-28px",
          top: "22px",
        }}
      >
        💺
      </div>

      {/* Coffee */}

      <div
        className="absolute text-xl"
        style={{
          left: "10px",
          top: "10px",
        }}
      >
        ☕
      </div>

      {/* Name */}

      {name && (
        <div
          className="absolute left-1/2 -bottom-6 -translate-x-1/2 whitespace-nowrap text-xs text-slate-300 font-medium"
        >
          {name}
        </div>
      )}
    </div>
  );
}

/* =====================================================
   CABINET
===================================================== */

function Cabinet({
  x = 0,
  y = 0,
  width = 100,
  height = 180,
  name,
  rotation = 0,
}) {
  return (
    <div
      className="absolute bg-gradient-to-b from-slate-600 to-slate-800 border-2 border-slate-400 rounded-lg shadow-xl"
      style={{
        left: x,
        top: y,
        width,
        height,
        transform: `rotate(${rotation || 0}deg)`,
      }}
    >
      {/* Cabinet doors */}

      <div className="absolute inset-2 grid grid-rows-3 gap-1">
        <div className="border border-slate-400/50 rounded bg-slate-700/70" />
        <div className="border border-slate-400/50 rounded bg-slate-700/70" />
        <div className="border border-slate-400/50 rounded bg-slate-700/70" />
      </div>

      {/* Handle */}

      <div className="absolute right-2 top-1/2 w-1 h-8 bg-slate-300 rounded" />

      {/* Name */}

      {name && (
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs text-slate-300 font-medium">
          {name}
        </div>
      )}
    </div>
  );
}

export default Furniture;