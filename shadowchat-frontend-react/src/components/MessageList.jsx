import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";
import { groupMessagesByDay } from "../utils/chat";

export default function MessageList({
  messages,
  currentUserId,
  typingUsers,
  onDeleteMessage,
  onReplyMessage,
  onEditMessage,
  onReactMessage
}) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  const rows = groupMessagesByDay(messages);

  return (
    <div className="message-list custom-scroll">
      {rows.map((row, index) => {
        if (row.type === "label") {
          return (
            <div key={`${row.label}-${index}`} className="message-day-divider">
              <span>{row.label}</span>
            </div>
          );
        }

        const message = row.message;
        const previous = rows[index - 1]?.type === "message" ? rows[index - 1].message : null;
        const isMine = String(message.sender?._id) === String(currentUserId);
        const showAvatar = !previous || String(previous.sender?._id) !== String(message.sender?._id);

        return (
          <MessageBubble
            key={message._id}
            message={message}
            isMine={isMine}
            showAvatar={showAvatar}
            senderName={message.sender?.displayName || message.sender?.username || "User"}
            onDelete={() => onDeleteMessage(message)}
            onStartReply={() => onReplyMessage(message)}
            onStartEdit={() => onEditMessage(message)}
            onReact={(emoji) => onReactMessage(message, emoji)}
          />
        );
      })}

      {typingUsers.length ? (
        <div className="typing-pill">
          <span>{typingUsers.map((user) => user.displayName || user.username || "Someone").join(", ")} typing...</span>
        </div>
      ) : null}
      <div ref={bottomRef} />
    </div>
  );
}
