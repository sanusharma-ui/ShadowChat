import { PhoneIncoming, PhoneOff, Video } from "lucide-react";
import Avatar from "./Avatar";

export default function IncomingCallModal({ call, onAccept, onDecline }) {
  if (!call) return null;

  return (
    <div className="modal-backdrop center-overlay">
      <div className="call-card glass-card">
        <Avatar name={call.from?.displayName} src={call.from?.avatarUrl} size="xl" />
        <h3>{call.from?.displayName || "Incoming call"}</h3>
        <p>{call.callType === "video" ? "Video call" : "Voice call"}</p>

        <div className="call-actions">
          <button type="button" className="secondary-button danger" onClick={onDecline}>
            <PhoneOff size={18} />
            Decline
          </button>
          <button type="button" className="primary-button" onClick={onAccept}>
            {call.callType === "video" ? <Video size={18} /> : <PhoneIncoming size={18} />}
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
