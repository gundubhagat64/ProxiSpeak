function Avatar({ x, y, name }) {
  return (
    <div
      className="absolute flex flex-col items-center transition-all duration-100"
      style={{
        left: x,
        top: y,
      }}
    >
      <div className="text-3xl select-none">🧑🏻‍💻</div>

      <span className="mt-1 px-2 py-0.5 bg-cyan-600 text-white text-xs rounded-full shadow">
        {name}
      </span>
    </div>
  );
}

export default Avatar;