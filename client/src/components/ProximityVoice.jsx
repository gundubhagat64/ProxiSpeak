import { useState } from "react";
import { Mic, MicOff, Volume2, X } from "lucide-react";

function ProximityVoice({ nearbyUsers = [] }) {
  const [muted, setMuted] = useState(false);
  const [open, setOpen] = useState(true);

  // Don't show anything when nobody is nearby
  if (nearbyUsers.length === 0 || !open) {
    return null;
  }

  return (
    <div
      className="
        absolute
        bottom-5
        right-5
        z-50
        w-72
        bg-slate-950/95
        backdrop-blur-xl
        border
        border-cyan-500/30
        rounded-2xl
        shadow-2xl
        overflow-hidden
      "
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Volume2
              size={18}
              className="text-cyan-400"
            />

            <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full" />
          </div>

          <div>
            <h3 className="text-white text-sm font-semibold">
              Proximity Voice
            </h3>

            <p className="text-green-400 text-[10px]">
              Voice zone active
            </p>
          </div>
        </div>

        <button
          onClick={() => setOpen(false)}
          className="text-gray-400 hover:text-white"
        >
          <X size={17} />
        </button>
      </div>

      {/* Nearby Users */}
      <div className="p-3 space-y-2">
        {nearbyUsers.map((user) => (
          <div
            key={user.userId}
            className="
              flex
              items-center
              gap-3
              bg-slate-800/70
              rounded-xl
              px-3
              py-2
            "
          >
            {/* Avatar */}
            <div
              className="
                w-9
                h-9
                rounded-full
                bg-cyan-500/20
                border
                border-cyan-400/30
                flex
                items-center
                justify-center
                text-cyan-300
                font-bold
              "
            >
              {user.name?.charAt(0)?.toUpperCase() || "U"}
            </div>

            {/* Name */}
            <div className="flex-1 min-w-0">
              <p className="text-gray-200 text-sm font-medium truncate">
                {user.name}
              </p>

              <p className="text-green-400 text-[10px]">
                Nearby
              </p>
            </div>

            {/* Voice indicator */}
            <div className="flex items-end gap-[2px] h-4">
              <span className="w-[2px] h-2 bg-cyan-400 rounded-full" />
              <span className="w-[2px] h-4 bg-cyan-400 rounded-full" />
              <span className="w-[2px] h-3 bg-cyan-400 rounded-full" />
              <span className="w-[2px] h-1 bg-cyan-400 rounded-full" />
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="px-3 pb-3">
        <button
          onClick={() => setMuted((prev) => !prev)}
          className={`
            w-full
            flex
            items-center
            justify-center
            gap-2
            rounded-xl
            py-2.5
            text-sm
            font-medium
            transition
            ${
              muted
                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                : "bg-cyan-500 text-white hover:bg-cyan-400"
            }
          `}
        >
          {muted ? (
            <>
              <MicOff size={17} />
              Unmute
            </>
          ) : (
            <>
              <Mic size={17} />
              Mute
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default ProximityVoice;