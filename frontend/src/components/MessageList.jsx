import { useEffect, useMemo, useRef } from "react";
import { MessageCircle } from "lucide-react";
import MessageBubble from "./MessageBubble";
import { groupMessagesByDay } from "../utils/chat";

function isRenderableMessage(message) {
  return Boolean(
    message &&
      (message.deletedForEveryone ||
        String(message.text || "").trim() ||
        message.attachments?.length ||
        message.type === "system" ||
        message.type === "call")
  );
}

export default function MessageList({
  messages,
  currentUserId,
  conversationType,
  typingUsers,
  onDeleteMessage,
  onReplyMessage,
  onEditMessage,
  onReactMessage,
}) {
  const bottomRef = useRef(null);
  const visibleMessages = useMemo(() => messages.filter(isRenderableMessage), [messages]);
  const rows = useMemo(() => groupMessagesByDay(visibleMessages), [visibleMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [visibleMessages, typingUsers]);

  return (
    <div className="message-list custom-scroll" role="log" aria-live="polite" aria-label="Conversation messages">
      <div className="message-content">
        {!visibleMessages.length ? (
          <div className="empty-conversation">
            <div className="empty-state-icon"><MessageCircle size={22} aria-hidden="true" /></div>
            <h2>No messages here yet</h2>
            <p>Send a message to begin this conversation.</p>
          </div>
        ) : null}

        {rows.map((row, index) => {
          if (row.type === "label") {
            return (
              <div key={`${row.label}-${index}`} className="message-day-divider" role="separator">
                <span>{row.label}</span>
              </div>
            );
          }

          const message = row.message;
          const previous = rows[index - 1]?.type === "message" ? rows[index - 1].message : null;
          const next = rows[index + 1]?.type === "message" ? rows[index + 1].message : null;
          const senderId = String(message.sender?._id || message.sender || "");
          const sameSenderBefore = previous && String(previous.sender?._id || previous.sender || "") === senderId;
          const sameSenderAfter = next && String(next.sender?._id || next.sender || "") === senderId;
          const isMine = senderId === String(currentUserId);

          return (
            <MessageBubble
              key={message._id}
              message={message}
              isMine={isMine}
              groupStart={!sameSenderBefore}
              groupEnd={!sameSenderAfter}
              showAvatar={!isMine && !sameSenderAfter}
              showSenderName={conversationType === "group" && !isMine && !sameSenderBefore}
              senderName={message.sender?.displayName || message.sender?.username || "User"}
              onDelete={() => onDeleteMessage(message)}
              onStartReply={() => onReplyMessage(message)}
              onStartEdit={() => onEditMessage(message)}
              onReact={(emoji) => onReactMessage(message, emoji)}
            />
          );
        })}

        {typingUsers.length ? (
          <div className="typing-indicator" aria-label="Someone is typing">
            <span className="typing-dots" aria-hidden="true"><i /><i /><i /></span>
            <span>{typingUsers.map((user) => user.displayName || user.username || "Someone").join(", ")} typing</span>
          </div>
        ) : null}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
