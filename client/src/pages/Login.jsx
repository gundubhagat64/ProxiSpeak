import { useState } from "react";

function Login() {
  const [name, setName] = useState("");
  const [room, setRoom] = useState("");

  const handleJoin = () => {
    if (!name || !room) {
      alert("Please enter your name and room code");
      return;
    }

    alert("Joined Successfully");
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="bg-slate-800 p-8 rounded-2xl w-[420px] shadow-lg">

        <h1 className="text-4xl font-bold text-center text-white">
          ProxiSpeak
        </h1>

        <p className="text-center text-gray-400 mt-2 mb-8">
          Virtual Office Communication
        </p>

        <input
          type="text"
          placeholder="Enter Your Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full mb-4 p-3 rounded-lg bg-slate-700 text-white"
        />

        <input
          type="text"
          placeholder="Room Code"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
          className="w-full mb-6 p-3 rounded-lg bg-slate-700 text-white"
        />

        <button
          onClick={handleJoin}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg"
        >
          Join Office
        </button>

      </div>
    </div>
  );
}

export default Login;