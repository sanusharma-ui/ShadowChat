import { useEffect } from "react";
import { MicOff, PhoneOff, VideoOff } from "lucide-react";

export default function ActiveCallPanel({
  activeCall,
  localVideoRef,
  remoteVideoRef,
  remoteAudioRef,
  localStream,
  remoteStream,
  onEndCall,
  onToggleMute,
  onToggleVideo
}) {
  useEffect(() => {
    if (localVideoRef?.current) {
      localVideoRef.current.srcObject = localStream || null;
    }
  }, [localStream, localVideoRef]);

  useEffect(() => {
    if (remoteVideoRef?.current) {
      remoteVideoRef.current.srcObject = remoteStream || null;
    }
  }, [remoteStream, remoteVideoRef]);

  useEffect(() => {
    if (remoteAudioRef?.current) {
      remoteAudioRef.current.srcObject = remoteStream || null;
    }
  }, [remoteAudioRef, remoteStream]);

  if (!activeCall) return null;

  const isAudioOnly = activeCall.type === "audio";

  return (
    <div className="call-panel glass-card">
      <div className={`call-videos ${isAudioOnly ? "audio-only" : ""}`}>
        {isAudioOnly ? (
          <div className="audio-call-stage">
            <div className="audio-pulse" />
            <strong>{activeCall.label}</strong>
            <span>{activeCall.status || "Voice call connected"}</span>
          </div>
        ) : null}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className={`remote-video ${isAudioOnly ? "hidden" : ""}`}
        />
        <audio ref={remoteAudioRef} autoPlay playsInline style={{ display: "none" }} />
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className={`local-video ${isAudioOnly ? "hidden" : ""}`}
        />
      </div>
      <div className="call-footer">
        <div>
          <strong>{activeCall.label}</strong>
          <p>{activeCall.status || (activeCall.type === "video" ? "Secure video call" : "Secure voice call")}</p>
        </div>
        <div className="call-actions compact">
          <button type="button" className="icon-button soft" onClick={onToggleMute} title="Mute">
            <MicOff size={18} />
          </button>
          {activeCall.type === "video" ? (
            <button type="button" className="icon-button soft" onClick={onToggleVideo} title="Camera">
              <VideoOff size={18} />
            </button>
          ) : null}
          <button type="button" className="icon-button danger solid" onClick={onEndCall} title="End call">
            <PhoneOff size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}