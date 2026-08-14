import { Home, Users, Mic, Settings } from "lucide-react";

function MobileNavbar() {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700 flex justify-around items-center h-16 z-50 lg:hidden">

      <button className="text-cyan-400">
        <Home size={24} />
      </button>

      <button className="text-white">
        <Users size={24} />
      </button>

      <button className="text-white">
        <Mic size={24} />
      </button>

      <button className="text-white">
        <Settings size={24} />
      </button>

    </div>
  );
}

export default MobileNavbar;