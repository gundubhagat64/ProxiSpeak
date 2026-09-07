import { useEffect, useState } from "react";
import { Mic, MicOff } from "lucide-react";

function VoiceControls() {
  const [muted, setMuted] = useState(false);
  const [micAvailable, setMicAvailable] = useState(false);

  useEffect(() => {
    const checkMicrophone = async () => {
      try {
        const stream =
          await navigator.mediaDevices.getUserMedia({
            audio: true,
          });

        stream.getTracks().forEach((track) => {
          track.stop();
        });

        setMicAvailable(true);
      } catch (error) {
        console.error(
          "Microphone permission denied:",
          error
        );

        setMicAvailable(false);
      }
    };

    checkMicrophone();
  }, []);

  const toggleMute = () => {
    setMuted((prev) => !prev);
  };

  return (
    <div className="absolute bottom-5 right-5 z-50">
      <button
        onClick={toggleMute}
        disabled={!micAvailable}
        className={`
          flex
          items-center
          gap-2
          px-4
          py-3
          rounded-xl
          text-sm
          font-medium
          shadow-xl
          transition
          ${
            !micAvailable
              ? "bg-slate-700 text-gray-400 cursor-not-allowed"
              : muted
              ? "bg-red-500 text-white hover:bg-red-400"
              : "bg-cyan-500 text-white hover:bg-cyan-400"
          }
        `}
      >
        {muted ? (
          <>
            <MicOff size={18} />
            Unmute
          </>
        ) : (
          <>
            <Mic size={18} />
            Mute
          </>
        )}
      </button>
    </div>
  );
}

export default VoiceControls;