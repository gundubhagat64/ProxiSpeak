import { Bell, Settings, UserCircle2 } from "lucide-react";

function Navbar() {
  const username = localStorage.getItem("username") || "Guest";

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-700 flex items-center justify-between px-6">
      <h1 className="text-2xl font-bold text-cyan-400">
        ProxiSpeak
      </h1>

      <div className="flex items-center gap-5 text-white">
        <Bell size={20} />
        <Settings size={20} />

        <div className="flex items-center gap-2">
          <UserCircle2 size={32} />
          <span>{username}</span>
        </div>
      </div>
    </header>
  );
}

export default Navbar;