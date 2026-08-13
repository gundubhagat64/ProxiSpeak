function Furniture() {
  return (
    <>
      {/* Table 1 */}
      <div
        className="absolute bg-amber-700 rounded-lg shadow-lg"
        style={{
          left: "350px",
          top: "180px",
          width: "140px",
          height: "80px",
        }}
      />

      {/* Chairs */}
      <div
        className="absolute w-8 h-8 bg-gray-500 rounded"
        style={{ left: "320px", top: "205px" }}
      />

      <div
        className="absolute w-8 h-8 bg-gray-500 rounded"
        style={{ left: "500px", top: "205px" }}
      />

      {/* Table 2 */}
      <div
        className="absolute bg-amber-700 rounded-lg shadow-lg"
        style={{
          left: "650px",
          top: "320px",
          width: "140px",
          height: "80px",
        }}
      />

      {/* Chairs */}
      <div
        className="absolute w-8 h-8 bg-gray-500 rounded"
        style={{ left: "620px", top: "345px" }}
      />

      <div
        className="absolute w-8 h-8 bg-gray-500 rounded"
        style={{ left: "800px", top: "345px" }}
      />

      {/* Coffee Area */}
      <div
        className="absolute bg-emerald-700 rounded-xl flex items-center justify-center text-white font-bold"
        style={{
          left: "930px",
          top: "100px",
          width: "150px",
          height: "90px",
        }}
      >
        ☕ Coffee
      </div>

      {/* Meeting Room */}
      <div
        className="absolute border-2 border-cyan-400 rounded-xl flex items-center justify-center text-cyan-300 font-bold"
        style={{
          left: "100px",
          top: "430px",
          width: "220px",
          height: "140px",
        }}
      >
        Meeting Room
      </div>
    </>
  );
}

export default Furniture;