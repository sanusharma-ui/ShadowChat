import { useEffect, useRef, useState } from "react";
import { Mic, Paperclip, Send, Square, X } from "lucide-react";

const emojiBar = ["❤️", "🔥", "😂", "👍", "😮", "🎉"];

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
  onTypingStop
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
    if (editingMessage) {
      setText(editingMessage.text || "");
    }
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
          type: blob.type || "audio/webm"
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
    } catch (err) {
      setError("Microphone access denied or unavailable.");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  const bannerText = editingMessage
    ? `Editing message: ${editingMessage.text}`
    : replyingTo
      ? `Replying to ${replyingTo.sender?.displayName || replyingTo.sender?.username || "message"}`
      : "";

  return (
    <div className="composer-shell glass-panel">
      {(replyingTo || editingMessage) ? (
        <div className="composer-banner">
          <div>
            <strong>{editingMessage ? "Edit message" : "Reply"}</strong>
            <p>{bannerText}</p>
          </div>
          <button
            type="button"
            className="icon-button soft"
            onClick={editingMessage ? onCancelEdit : onCancelReply}
          >
            <X size={16} />
          </button>
        </div>
      ) : null}

      {error ? <div className="error-banner composer-error">{error}</div> : null}

      <div className="emoji-row">
        {emojiBar.map((emoji) => (
          <button key={emoji} className="emoji-button" type="button" onClick={() => setText((prev) => `${prev}${emoji}`)}>
            {emoji}
          </button>
        ))}
      </div>

      <form className="composer-form" onSubmit={handleSubmit}>
        <button type="button" className="icon-button soft" onClick={() => fileInputRef.current?.click()} disabled={disabled || busy}>
          <Paperclip size={18} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          hidden
          accept="image/*,video/*,audio/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
          onChange={handleFileChange}
        />

        <textarea
          placeholder={disabled ? "Choose a chat to start messaging" : "Type a message"}
          value={text}
          disabled={disabled || busy}
          onChange={(e) => {
            setText(e.target.value);
            emitTyping();
          }}
          onBlur={() => onTypingStop?.()}
          rows={1}
        />

        {!recording ? (
          <button type="button" className="icon-button soft" onClick={startRecording} disabled={disabled || busy}>
            <Mic size={18} />
          </button>
        ) : (
          <button type="button" className="icon-button soft danger" onClick={stopRecording}>
            <Square size={18} />
          </button>
        )}

        <button className="primary-icon-button" type="submit" disabled={disabled || busy || !text.trim()}>
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
