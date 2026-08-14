import {
  Home,
  Users,
  Mic,
  Calendar,
  Settings,
  LogOut,
} from "lucide-react";

function Sidebar() {
  const menuItems = [
    { icon: <Home size={20} />, title: "Dashboard" },
    { icon: <Users size={20} />, title: "Participants" },
    { icon: <Mic size={20} />, title: "Voice Chat" },
    { icon: <Calendar size={20} />, title: "Meetings" },
    { icon: <Settings size={20} />, title: "Settings" },
  ];

  return (
    <aside className="w-72 bg-slate-950 border-r border-slate-800 flex flex-col">

      {/* Header */}
      <div className="p-6 border-b border-slate-800">
        <h2 className="text-2xl font-bold text-white">
          Workspace
        </h2>

        <p className="text-sm text-gray-400 mt-1">
          Virtual Office
        </p>
      </div>

      {/* Menu */}
      <div className="flex-1 p-4 space-y-2">

        {menuItems.map((item, index) => (
          <button
            key={index}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-gray-300 hover:bg-cyan-500/20 hover:text-cyan-400 transition-all duration-300"
          >
            {item.icon}
            <span>{item.title}</span>
          </button>
        ))}

      </div>

      {/* User Card */}
      <div className="mx-4 mb-4 bg-slate-900 rounded-xl border border-slate-700 p-4">

        <div className="flex items-center gap-3">

          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center text-xl">
            🧑🏻‍💻
          </div>

          <div>
            <h3 className="text-white font-semibold">
              {localStorage.getItem("username") || "Guest"}
            </h3>

            <p className="text-green-400 text-xs">
              ● Available
            </p>
          </div>

        </div>

      </div>

      {/* Logout */}
      <div className="p-4 border-t border-slate-800">

        <button className="w-full flex items-center justify-center gap-3 bg-red-500/20 text-red-400 py-3 rounded-xl hover:bg-red-500 hover:text-white transition-all duration-300">

          <LogOut size={20} />

          Logout

        </button>

      </div>

    </aside>
  );
}

export default Sidebar;