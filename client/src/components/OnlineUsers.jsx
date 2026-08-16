import { Users, Circle } from "lucide-react";

function OnlineUsers({ users = [] }) {
  return (
    <div className="absolute top-4 left-4 w-56 bg-slate-950/90 backdrop-blur-md border border-slate-700 rounded-2xl shadow-2xl p-4 z-40">
      
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Users size={18} className="text-cyan-400" />

        <h3 className="text-white font-semibold">
          Online Users
        </h3>

        <span className="ml-auto text-xs bg-cyan-500/20 text-cyan-300 px-2 py-1 rounded-full">
          {users.length}
        </span>
      </div>

      {/* Users */}
      <div className="space-y-2 max-h-40 overflow-y-auto">

        {users.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-3">
            No other users online
          </p>
        ) : (
          users.map((user) => (
            <div
              key={user.userId || user.id}
              className="flex items-center gap-3 bg-slate-800/70 rounded-lg px-3 py-2"
            >
              <Circle
                size={9}
                fill="currentColor"
                className="text-green-400"
              />

              <span className="text-gray-200 text-sm truncate">
                {user.name}
              </span>
            </div>
          ))
        )}

      </div>
    </div>
  );
}

export default OnlineUsers;