import { useState } from "react";
import {
  Check,
  CheckCheck,
  Copy,
  CornerUpLeft,
  FileText,
  MoreHorizontal,
  Pencil,
  SmilePlus,
  Trash2,
} from "lucide-react";
import Avatar from "./Avatar";
import { formatTime } from "../utils/chat";

const quickReactions = ["❤️", "🔥", "😂", "👍", "😮", "🎉"];

function AttachmentPreview({ attachment, messageType }) {
  if (!attachment?.url) return null;

  if (messageType === "image") {
    return <img className="message-image" src={attachment.url} alt={attachment.fileName || "Image attachment"} loading="lazy" />;
  }
  if (messageType === "video") {
    return <video className="message-video" src={attachment.url} controls preload="metadata" aria-label={attachment.fileName || "Video attachment"} />;
  }
  if (messageType === "voice" || messageType === "audio") {
    return <audio className="message-audio" src={attachment.url} controls preload="metadata" aria-label={attachment.fileName || "Voice message"} />;
  }

  return (
    <a className="file-chip" href={attachment.url} target="_blank" rel="noreferrer">
      <span className="file-icon"><FileText size={17} aria-hidden="true" /></span>
      <span>{attachment.fileName || "Open attachment"}</span>
    </a>
  );
}

function ReactionStrip({ reactions = [], onReact }) {
  if (!reactions.length) return null;
  return (
    <div className="reaction-strip" aria-label="Message reactions">
      {reactions.map((reaction) => (
        <button key={reaction.emoji} type="button" className="reaction-pill" onClick={() => onReact(reaction.emoji)} aria-label={`${reaction.emoji}, ${reaction.users?.length || 0} reactions`}>
          <span aria-hidden="true">{reaction.emoji}</span>
          <small>{reaction.users?.length || 0}</small>
        </button>
      ))}
    </div>
  );
}

export default function MessageBubble({
  message,
  isMine,
  groupStart,
  groupEnd,
  showAvatar,
  showSenderName,
  senderName,
  onDelete,
  onStartReply,
  onStartEdit,
  onReact,
}) {
  const [reactionsOpen, setReactionsOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const deleted = message.deletedForEveryone;
  const isSystem = message.type === "system" || message.type === "call";
  const seenByAnotherUser = isMine && (message.seenBy || []).some(
    (seen) => String(seen.user?._id || seen.user) !== String(message.sender?._id || message.sender)
  );

  if (isSystem) {
    return (
      <div className="system-message">
        <span>{message.text || (message.type === "call" ? "Call activity" : "Conversation update")}</span>
        <time dateTime={message.createdAt}>{formatTime(message.createdAt)}</time>
      </div>
    );
  }

  async function copyMessage() {
    if (!message.text) return;
    try {
      await navigator.clipboard.writeText(message.text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className={`message-row ${isMine ? "mine" : ""} ${groupStart ? "group-start" : ""} ${groupEnd ? "group-end" : ""}`}>
      {!isMine ? (
        showAvatar ? <Avatar name={senderName} src={message.sender?.avatarUrl} size="sm" /> : <div className="avatar-spacer" aria-hidden="true" />
      ) : null}

      <div className="message-cluster">
        <article className={`message-bubble ${isMine ? "mine" : ""} ${deleted ? "deleted" : ""}`}>
          {showSenderName ? <strong className="message-author">{senderName}</strong> : null}

          {message.replyTo ? (
            <div className="reply-chip">
              <CornerUpLeft size={13} aria-hidden="true" />
              <div>
                <strong>{message.replyTo?.sender?.displayName || "Reply"}</strong>
                <span>{message.replyTo?.text || `[${message.replyTo?.type || "message"}]`}</span>
              </div>
            </div>
          ) : null}

          {(message.attachments || []).map((attachment, index) => (
            <AttachmentPreview key={attachment.url || `${attachment.fileName}-${index}`} attachment={attachment} messageType={message.type} />
          ))}

          {!deleted && message.text ? <p className="message-text">{message.text}</p> : null}
          {deleted ? <p className="message-text muted-italic">This message was deleted.</p> : null}

          <div className="message-meta">
            {message.editedAt ? <span>Edited</span> : null}
            <time dateTime={message.createdAt}>{formatTime(message.createdAt)}</time>
            {isMine ? (
              <span className={seenByAnotherUser ? "delivery-state read" : "delivery-state"} aria-label={seenByAnotherUser ? "Read" : "Sent"}>
                {seenByAnotherUser ? <CheckCheck size={14} aria-hidden="true" /> : <Check size={14} aria-hidden="true" />}
              </span>
            ) : null}
          </div>

          {!deleted ? (
            <>
              <button
                type="button"
                className="message-actions-trigger"
                title="Message actions"
                aria-label="Show message actions"
                aria-expanded={actionsOpen}
                onClick={() => setActionsOpen((open) => !open)}
              >
                <MoreHorizontal size={16} aria-hidden="true" />
              </button>
              <div className={`message-tools ${actionsOpen ? "open" : ""}`} aria-label="Message actions">
              <button type="button" className="message-tool" title="Reply" aria-label="Reply to message" onClick={() => { onStartReply(); setActionsOpen(false); }}><CornerUpLeft size={14} aria-hidden="true" /></button>
              <button type="button" className="message-tool" title={copied ? "Copied" : "Copy"} aria-label={copied ? "Message copied" : "Copy message"} onClick={() => { copyMessage(); setActionsOpen(false); }} disabled={!message.text}><Copy size={14} aria-hidden="true" /></button>
              <button type="button" className="message-tool" title="React" aria-label="React to message" aria-expanded={reactionsOpen} onClick={() => setReactionsOpen((open) => !open)}><SmilePlus size={14} aria-hidden="true" /></button>
              {isMine ? (
                <>
                  <button type="button" className="message-tool" title="Edit" aria-label="Edit message" onClick={() => { onStartEdit(); setActionsOpen(false); }} disabled={!message.text}><Pencil size={14} aria-hidden="true" /></button>
                  <button type="button" className="message-tool danger" title="Delete" aria-label="Delete message" onClick={() => { onDelete(); setActionsOpen(false); }}><Trash2 size={14} aria-hidden="true" /></button>
                </>
              ) : null}
              {reactionsOpen ? (
                <div className="message-reaction-picker">
                  {quickReactions.map((emoji) => (
                    <button key={emoji} type="button" onClick={() => { onReact(emoji); setReactionsOpen(false); setActionsOpen(false); }} aria-label={`React with ${emoji}`}>{emoji}</button>
                  ))}
                </div>
              ) : null}
            </div>
            </>
          ) : null}
        </article>
        <ReactionStrip reactions={message.reactions} onReact={onReact} />
      </div>
    </div>
  );
}
