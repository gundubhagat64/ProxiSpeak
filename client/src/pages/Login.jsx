import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const [name, setName] = useState("");
  const navigate = useNavigate();

  const joinOffice = () => {
    if (!name.trim()) return;

    localStorage.setItem("username", name);
    navigate("/office");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#020617] via-[#0f172a] to-[#1e293b] relative overflow-hidden">

      {/* Glow Background */}
      <div className="absolute w-72 h-72 bg-cyan-500 rounded-full blur-[120px] opacity-30 -top-10 -left-10"></div>
      <div className="absolute w-80 h-80 bg-purple-500 rounded-full blur-[120px] opacity-25 bottom-0 right-0"></div>

      <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-10 w-[420px] shadow-2xl">

        <h1 className="text-5xl font-extrabold text-center text-cyan-400 drop-shadow-lg">
          ProxiSpeak
        </h1>

        <p className="text-center text-gray-300 mt-3 mb-8">
          Geospatial Audio Collaboration
        </p>

        <input
          type="text"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-4 rounded-xl bg-slate-900/70 border border-cyan-400 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-cyan-400 transition"
        />

        <button
          onClick={joinOffice}
          className="w-full mt-6 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-lg hover:scale-105 hover:shadow-[0_0_25px_#06b6d4] duration-300"
        >
          🚀 Join Virtual Office
        </button>

      </div>
    </div>
  );
}

export default Login;