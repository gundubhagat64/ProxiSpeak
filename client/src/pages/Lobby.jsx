import { useNavigate } from "react-router-dom";

function Lobby() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="bg-slate-800 p-8 rounded-2xl shadow-xl w-[450px]">

        <h1 className="text-4xl text-white font-bold text-center">
          Lobby
        </h1>

        <p className="text-gray-400 text-center mt-2 mb-8">
          Ready to enter your virtual office?
        </p>

        <button
          onClick={() => navigate("/office")}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg"
        >
          Enter Office
        </button>

      </div>
    </div>
  );
}

export default Lobby;