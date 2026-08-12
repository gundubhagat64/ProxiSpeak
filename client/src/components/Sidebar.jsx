import {
  Users,
  Mic,
  Settings,
  LogOut,
} from "lucide-react";

function Sidebar() {
  return (
    <aside className="w-64 bg-slate-900 text-white p-5 border-r border-slate-700">

      <h2 className="text-cyan-400 font-bold text-xl mb-6">
        Menu
      </h2>

      <div className="space-y-5">

        <div className="flex items-center gap-3 cursor-pointer hover:text-cyan-400">
          <Users size={20} />
          <span>Participants</span>
        </div>

        <div className="flex items-center gap-3 cursor-pointer hover:text-cyan-400">
          <Mic size={20} />
          <span>Voice</span>
        </div>

        <div className="flex items-center gap-3 cursor-pointer hover:text-cyan-400">
          <Settings size={20} />
          <span>Settings</span>
        </div>

        <div className="flex items-center gap-3 cursor-pointer hover:text-red-400">
          <LogOut size={20} />
          <span>Logout</span>
        </div>

      </div>

    </aside>
  );
}

export default Sidebar;