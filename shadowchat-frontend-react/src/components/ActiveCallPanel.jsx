import { MicOff, PhoneOff, VideoOff } from "lucide-react";

export default function ActiveCallPanel({
  activeCall,
  localVideoRef,
  remoteVideoRef,
  onEndCall,
  onToggleMute,
  onToggleVideo
}) {
  if (!activeCall) return null;

  return (
    <div className="call-panel glass-card">
      <div className="call-videos">
        <video ref={remoteVideoRef} autoPlay playsInline className="remote-video" />
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className={`local-video ${activeCall.type === "audio" ? "hidden" : ""}`}
        />
      </div>
      <div className="call-footer">
        <div>
          <strong>{activeCall.label}</strong>
          <p>{activeCall.type === "video" ? "Secure video call" : "Secure voice call"}</p>
        </div>
        <div className="call-actions compact">
          <button type="button" className="icon-button soft" onClick={onToggleMute}>
            <MicOff size={18} />
          </button>
          {activeCall.type === "video" ? (
            <button type="button" className="icon-button soft" onClick={onToggleVideo}>
              <VideoOff size={18} />
            </button>
          ) : null}
          <button type="button" className="icon-button danger solid" onClick={onEndCall}>
            <PhoneOff size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
