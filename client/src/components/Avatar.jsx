function Avatar({ x, y, name, isNearby = false }) {
  return (
    <div
      className="absolute flex flex-col items-center transition-all duration-100"
      style={{
        left: x,
        top: y,
      }}
    >
      {isNearby && (
        <div className="mb-1 px-2 py-0.5 bg-green-500 text-white text-[10px] font-semibold rounded-full shadow">
          Nearby
        </div>
      )}

      <div
        className={`text-3xl select-none ${
          isNearby ? "scale-110" : ""
        }`}
      >
        🧑🏻‍💻
      </div>

      <span className="mt-1 px-2 py-0.5 bg-cyan-600 text-white text-xs rounded-full shadow">
        {name}
      </span>
    </div>
  );
}

export default Avatar;