function Avatar({ x, y, name }) {
  return (
    <div
      className="absolute flex flex-col items-center transition-all duration-75"
      style={{
        left: x,
        top: y,
      }}
    >
      <div className="w-12 h-12 rounded-full bg-cyan-500 border-4 border-white shadow-lg"></div>

      <span className="text-white text-sm mt-1">{name}</span>
    </div>
  );
}

export default Avatar;