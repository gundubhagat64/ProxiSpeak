import { useEffect, useRef, useState } from "react";
import {
  MessageCircle,
  Send,
  X,
  MoreVertical,
} from "lucide-react";

function ChatBox({
  messages = [],
  onSend,
  username = "You",
}) {
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);

  const messagesEndRef = useRef(null);

  // Auto scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  const handleSend = () => {
    const text = message.trim();

    if (!text) return;

    if (onSend) {
      onSend(text);
    }

    setMessage("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";

    const date = new Date(timestamp);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      {/* ================= CHAT BUTTON ================= */}

      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open chat"
          className="
            absolute
            bottom-5
            left-5
            z-50
            w-12
            h-12
            rounded-full
            bg-cyan-500
            hover:bg-cyan-400
            text-white
            flex
            items-center
            justify-center
            shadow-xl
            shadow-cyan-500/20
            transition-all
            duration-200
            hover:scale-105
          "
        >
          <MessageCircle size={22} />

          {/* Notification dot */}
          {messages.length > 0 && (
            <span
              className="
                absolute
                -top-1
                -right-1
                w-3
                h-3
                bg-green-400
                border-2
                border-slate-950
                rounded-full
              "
            />
          )}
        </button>
      )}

      {/* ================= CHAT WINDOW ================= */}

      {open && (
        <div
          className="
            absolute
            bottom-5
            left-5
            z-50
            w-[calc(100vw-40px)]
            max-w-sm
            h-[420px]
            bg-slate-950/95
            backdrop-blur-xl
            border
            border-slate-700
            rounded-2xl
            shadow-2xl
            shadow-black/40
            flex
            flex-col
            overflow-hidden
          "
        >

          {/* ================= HEADER ================= */}

          <div
            className="
              flex
              items-center
              justify-between
              px-4
              py-3
              border-b
              border-slate-700
              bg-slate-900/80
            "
          >
            <div className="flex items-center gap-3">

              {/* Icon */}
              <div
                className="
                  w-9
                  h-9
                  rounded-xl
                  bg-cyan-500/15
                  flex
                  items-center
                  justify-center
                "
              >
                <MessageCircle
                  size={18}
                  className="text-cyan-400"
                />
              </div>

              {/* Title */}
              <div>
                <h3 className="text-white font-semibold text-sm">
                  Office Chat
                </h3>

                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />

                  <span className="text-[11px] text-gray-400">
                    Team conversation
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">

              <button
                className="
                  p-2
                  rounded-lg
                  text-gray-500
                  hover:text-white
                  hover:bg-slate-800
                  transition
                "
              >
                <MoreVertical size={17} />
              </button>

              <button
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                className="
                  p-2
                  rounded-lg
                  text-gray-400
                  hover:text-white
                  hover:bg-slate-800
                  transition
                "
              >
                <X size={18} />
              </button>

            </div>
          </div>

          {/* ================= MESSAGES ================= */}

          <div
            className="
              flex-1
              overflow-y-auto
              px-3
              py-4
              space-y-3
              scrollbar-thin
            "
          >
            {messages.length === 0 ? (
              <div
                className="
                  h-full
                  flex
                  flex-col
                  items-center
                  justify-center
                  text-center
                "
              >
                <div
                  className="
                    w-14
                    h-14
                    rounded-2xl
                    bg-slate-800
                    flex
                    items-center
                    justify-center
                    mb-3
                  "
                >
                  <MessageCircle
                    size={25}
                    className="text-slate-500"
                  />
                </div>

                <p className="text-gray-300 text-sm font-medium">
                  No messages yet
                </p>

                <p className="text-gray-500 text-xs mt-1">
                  Start a conversation with your team
                </p>
              </div>
            ) : (
              messages.map((msg, index) => {

                const isOwnMessage =
                  msg.userId === msg.senderId ||
                  msg.name === username;

                return (
                  <div
                    key={msg.id || index}
                    className={`flex ${
                      isOwnMessage
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`
                        max-w-[80%]
                        rounded-2xl
                        px-3
                        py-2
                        ${
                          isOwnMessage
                            ? "bg-cyan-500 text-white rounded-br-md"
                            : "bg-slate-800 text-gray-200 rounded-bl-md"
                        }
                      `}
                    >

                      {/* Sender */}
                      {!isOwnMessage && (
                        <p className="text-cyan-400 text-[11px] font-semibold mb-1">
                          {msg.name || "User"}
                        </p>
                      )}

                      {/* Message */}
                      <p className="text-sm break-words leading-relaxed">
                        {msg.text}
                      </p>

                      {/* Time */}
                      {msg.timestamp && (
                        <p
                          className={`
                            text-[9px]
                            mt-1
                            ${
                              isOwnMessage
                                ? "text-cyan-100/70"
                                : "text-gray-500"
                            }
                          `}
                        >
                          {formatTime(msg.timestamp)}
                        </p>
                      )}

                    </div>
                  </div>
                );
              })
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ================= INPUT ================= */}

          <div
            className="
              p-3
              border-t
              border-slate-700
              bg-slate-900/80
            "
          >
            <div
              className="
                flex
                items-center
                gap-2
                bg-slate-800
                border
                border-slate-700
                focus-within:border-cyan-400
                rounded-xl
                px-2
                py-1.5
                transition
              "
            >
              <input
                type="text"
                value={message}
                onChange={(e) =>
                  setMessage(e.target.value)
                }
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                className="
                  flex-1
                  bg-transparent
                  text-white
                  text-sm
                  px-2
                  py-2
                  outline-none
                  placeholder:text-gray-500
                "
              />

              <button
                onClick={handleSend}
                disabled={!message.trim()}
                aria-label="Send message"
                className="
                  w-9
                  h-9
                  rounded-lg
                  bg-cyan-500
                  hover:bg-cyan-400
                  disabled:bg-slate-700
                  disabled:text-gray-500
                  text-white
                  flex
                  items-center
                  justify-center
                  transition
                "
              >
                <Send size={16} />
              </button>
            </div>

            <p className="text-[9px] text-gray-600 mt-1.5 text-center">
              Press Enter to send
            </p>
          </div>

        </div>
      )}
    </>
  );
}

export default ChatBox;