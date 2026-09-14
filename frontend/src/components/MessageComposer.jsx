import { useEffect, useRef, useState } from "react";
import { LoaderCircle, Mic, Paperclip, Send, Smile, Square, X } from "lucide-react";

const quickEmoji = ["❤️", "🔥", "😂", "👍", "😮", "🎉", "👏", "🥹"];

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
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const typingTimerRef = useRef(null);
  const composingRef = useRef(false);

  useEffect(() => {
    if (editingMessage) setText(editingMessage.text || "");
  }, [editingMessage]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 132)}px`;
  }, [text]);

  useEffect(() => () => {
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop();
  }, []);

  function emitTyping() {
    onTypingStart?.();
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => onTypingStop?.(), 1200);
  }

  async function handleSubmit(event) {
    event?.preventDefault();
    if (disabled || busy || composingRef.current) return;
    const value = text.trim();
    if (!value) return;

    setBusy(true);
    setError("");
    try {
      await onSendText(value);
      setText("");
      setEmojiOpen(false);
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
      setEmojiOpen(false);
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
      setEmojiOpen(false);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        const file = new File([blob], `voice-note-${Date.now()}.webm`, { type: blob.type || "audio/webm" });
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
      setError("Microphone access was denied or is unavailable.");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  function insertEmoji(emoji) {
    setText((current) => `${current}${emoji}`);
    textareaRef.current?.focus();
  }

  const bannerLabel = editingMessage ? "Editing message" : "Replying to";
  const bannerSub = editingMessage
    ? editingMessage.text
    : replyingTo?.sender?.displayName || replyingTo?.sender?.username || "message";
  const canSend = !disabled && !busy && text.trim().length > 0;

  return (
    <div className="composer-shell">
      <div className="composer-inner">
        {replyingTo || editingMessage ? (
          <div className="composer-banner">
            <div className="composer-banner-copy">
              <strong>{bannerLabel}</strong>
              <p>{bannerSub}</p>
            </div>
            <button type="button" className="icon-button quiet small" onClick={editingMessage ? onCancelEdit : onCancelReply} title="Cancel" aria-label="Cancel reply or edit">
              <X size={15} aria-hidden="true" />
            </button>
          </div>
        ) : null}

        {error ? <div className="error-banner composer-error" role="alert">{error}</div> : null}

        <form className={`composer-form ${recording ? "is-recording" : ""}`} onSubmit={handleSubmit}>
          <button type="button" className="composer-action" onClick={() => fileInputRef.current?.click()} disabled={disabled || busy || recording} title="Attach file" aria-label="Attach a file">
            <Paperclip size={20} aria-hidden="true" />
          </button>
          <input ref={fileInputRef} type="file" hidden accept="image/*,video/*,audio/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt,.zip" onChange={handleFileChange} />

          {recording ? (
            <div className="recording-indicator" role="status" aria-live="polite">
              <span className="record-dot" aria-hidden="true" />
              <span>Recording voice message…</span>
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              placeholder={disabled ? "Choose a conversation to start messaging" : "Write a message"}
              aria-label="Message"
              value={text}
              disabled={disabled || busy}
              onChange={(event) => { setText(event.target.value); emitTyping(); }}
              onCompositionStart={() => { composingRef.current = true; }}
              onCompositionEnd={() => { composingRef.current = false; }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                  event.preventDefault();
                  handleSubmit(event);
                }
              }}
              onBlur={() => onTypingStop?.()}
              rows={1}
            />
          )}

          {!recording ? (
            <>
              <div className="emoji-control">
                <button type="button" className="composer-action" onClick={() => setEmojiOpen((open) => !open)} disabled={disabled || busy} title="Add emoji" aria-label="Add emoji" aria-expanded={emojiOpen}>
                  <Smile size={20} aria-hidden="true" />
                </button>
                {emojiOpen ? (
                  <div className="composer-emoji-picker" role="group" aria-label="Choose an emoji">
                    {quickEmoji.map((emoji) => (
                      <button key={emoji} type="button" onClick={() => insertEmoji(emoji)} aria-label={`Insert ${emoji}`}>{emoji}</button>
                    ))}
                  </div>
                ) : null}
              </div>
              <button type="button" className="composer-action" onClick={startRecording} disabled={disabled || busy} title="Record voice message" aria-label="Record a voice message">
                <Mic size={20} aria-hidden="true" />
              </button>
            </>
          ) : (
            <button type="button" className="composer-action stop-recording" onClick={stopRecording} title="Stop recording" aria-label="Stop recording">
              <Square size={18} aria-hidden="true" />
            </button>
          )}

          <button className="composer-send" type="submit" disabled={!canSend || recording} title={busy ? "Sending" : "Send message"} aria-label={busy ? "Sending message" : "Send message"}>
            {busy ? <LoaderCircle className="spin" size={19} aria-hidden="true" /> : <Send size={19} aria-hidden="true" />}
          </button>
        </form>
      </div>
    </div>
  );
}
