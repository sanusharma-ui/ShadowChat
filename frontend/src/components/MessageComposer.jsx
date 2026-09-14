import { useEffect, useRef, useState } from "react";
import { Mic, Paperclip, Send, Square, X } from "lucide-react";

const emojiBar = ["❤️", "🔥", "😂", "👍", "😮", "🎉", "👏", "🥹"];

export default function MessageComposer({
  disabled,
  replyingTo,
  editingMessage,
  onCancelReply,
  onCancelEdit,
  onSendText,
  onUploadMedia,
  onUploadVoice,
  onTypingStart,
  onTypingStop,
}) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const typingTimerRef = useRef(null);

  useEffect(() => {
    if (editingMessage) setText(editingMessage.text || "");
  }, [editingMessage]);

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, []);

  function emitTyping() {
    onTypingStart?.();
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => onTypingStop?.(), 1200);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (disabled || busy) return;
    const value = text.trim();
    if (!value) return;

    setBusy(true);
    setError("");
    try {
      await onSendText(value);
      setText("");
      onTypingStop?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      await onUploadMedia(file, text.trim());
      setText("");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  }

  async function startRecording() {
    try {
      setError("");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        const file = new File([blob], `voice-note-${Date.now()}.webm`, {
          type: blob.type || "audio/webm",
        });
        setBusy(true);
        try {
          await onUploadVoice(file);
        } catch (err) {
          setError(err.message);
        } finally {
          setBusy(false);
        }
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
    } catch {
      setError("Microphone access denied or unavailable.");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  const bannerLabel = editingMessage ? "Edit message" : "Reply";
  const bannerSub = editingMessage
    ? editingMessage.text
    : `To ${replyingTo?.sender?.displayName || replyingTo?.sender?.username || "message"}`;

  const canSend = !disabled && !busy && text.trim().length > 0;

  return (
    <div className="composer-shell glass-panel">
      {/* ── Reply / Edit banner ── */}
      {(replyingTo || editingMessage) ? (
        <div className="composer-banner">
          <div style={{ minWidth: 0 }}>
            <strong style={{ fontSize: "0.84rem" }}>{bannerLabel}</strong>
            <p>{bannerSub}</p>
          </div>
          <button
            type="button"
            className="icon-button soft"
            onClick={editingMessage ? onCancelEdit : onCancelReply}
            style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0 }}
          >
            <X size={14} />
          </button>
        </div>
      ) : null}

      {/* ── Error ── */}
      {error ? <div className="error-banner composer-error">{error}</div> : null}

      {/* ── Quick Emoji Bar ── */}
      <div className="emoji-row">
        {emojiBar.map((emoji) => (
          <button
            key={emoji}
            className="emoji-button"
            type="button"
            onClick={() => setText((prev) => `${prev}${emoji}`)}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* ── Composer form ── */}
      <form className="composer-form" onSubmit={handleSubmit}>
        {/* Attach file */}
        <button
          type="button"
          className="icon-button soft"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || busy}
          title="Attach file"
        >
          <Paperclip size={18} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          hidden
          accept="image/*,video/*,audio/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
          onChange={handleFileChange}
        />

        {/* Text area */}
        {recording ? (
          <div className="recording-indicator">
            <div className="record-dot" />
            Recording…
          </div>
        ) : (
          <textarea
            placeholder={disabled ? "Choose a chat to start messaging" : "Type a message…"}
            value={text}
            disabled={disabled || busy}
            onChange={(e) => {
              setText(e.target.value);
              emitTyping();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            onBlur={() => onTypingStop?.()}
            rows={1}
          />
        )}

        {/* Mic / Stop */}
        {!recording ? (
          <button
            type="button"
            className="icon-button soft"
            onClick={startRecording}
            disabled={disabled || busy}
            title="Voice note"
          >
            <Mic size={18} />
          </button>
        ) : (
          <button
            type="button"
            className="icon-button danger"
            onClick={stopRecording}
            title="Stop recording"
          >
            <Square size={18} />
          </button>
        )}

        {/* Send */}
        <button
          className="primary-icon-button"
          type="submit"
          disabled={!canSend}
          title="Send"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
