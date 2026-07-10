import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import { createSocket } from "../lib/socket";
import { useAuth } from "../contexts/AuthContext";
import Sidebar from "../components/Sidebar";
import ChatHeader from "../components/ChatHeader";
import MessageList from "../components/MessageList";
import MessageComposer from "../components/MessageComposer";
import SearchUsersModal from "../components/SearchUsersModal";
import CreateGroupModal from "../components/CreateGroupModal";
import ProfilePanel from "../components/ProfilePanel";
import ConversationInfoPanel from "../components/ConversationInfoPanel";
import IncomingCallModal from "../components/IncomingCallModal";
import ActiveCallPanel from "../components/ActiveCallPanel";
import { getConversationTitle, getOtherParticipant, normalizeError } from "../utils/chat";

const SOCKET_EVENTS = {
  PRESENCE_UPDATE: "presence:update",
  MESSAGE_NEW: "message:new",
  MESSAGE_EDITED: "message:edited",
  MESSAGE_DELETED: "message:deleted",
  MESSAGE_REACTION: "message:reaction",
  MESSAGE_SEEN: "message:seen",
  TYPING_START: "typing:start",
  TYPING_STOP: "typing:stop",
  CALL_RING: "call:ring",
  CALL_OFFER: "call:offer",
  CALL_ANSWER: "call:answer",
  CALL_ICE: "call:ice-candidate",
  CALL_END: "call:end"
};

function toAbsoluteUrl(url) {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;

  const rawBase = import.meta.env.VITE_API_BASE_URL || "";
  const origin = rawBase.replace(/\/api\/?$/, "");

  if (!origin) return url;
  if (url.startsWith("/")) return `${origin}${url}`;
  return `${origin}/${url}`;
}

function normalizeAttachment(attachment) {
  if (!attachment) return attachment;
  return {
    ...attachment,
    url: toAbsoluteUrl(attachment.url || attachment.path || attachment.fileUrl || "")
  };
}

function normalizeMessageForUi(message, currentProfile) {
  if (!message) return null;

  const normalizedSender =
    typeof message.sender === "object" && message.sender !== null
      ? {
          ...message.sender,
          displayName:
            message.sender.displayName ||
            message.sender.username ||
            currentProfile?.displayName ||
            currentProfile?.username ||
            "User"
        }
      : {
          _id: message.sender || currentProfile?._id,
          displayName: currentProfile?.displayName || currentProfile?.username || "You",
          username: currentProfile?.username || "you",
          avatarUrl: currentProfile?.avatarUrl || ""
        };

  return {
    ...message,
    sender: normalizedSender,
    conversation:
      typeof message.conversation === "object" && message.conversation !== null
        ? message.conversation._id
        : message.conversation || message.conversationId,
    attachments: Array.isArray(message.attachments)
      ? message.attachments.map(normalizeAttachment)
      : [],
    createdAt: message.createdAt || new Date().toISOString(),
    text: message.text || ""
  };
}

function mergeMessages(prev, incoming, currentProfile) {
  const normalized = normalizeMessageForUi(incoming, currentProfile);
  if (!normalized?._id) return prev;
  if (prev.some((item) => item._id === normalized._id)) {
    return prev.map((item) => (item._id === normalized._id ? { ...item, ...normalized } : item));
  }
  return [...prev, normalized];
}

function updateConversationPreview(conversations, message) {
  const conversationId = String(
    message?.conversation || message?.conversationId || message?.conversation?._id || ""
  );

  return [...conversations]
    .map((conversation) => {
      if (conversation._id !== conversationId) {
        return conversation;
      }

      return {
        ...conversation,
        lastMessage: {
          message: message._id,
          sender: message.sender?._id || message.sender,
          type: message.type,
          text: message.deletedForEveryone
            ? "This message was deleted"
            : message.text || `[${message.type || "message"}]`,
          createdAt: message.createdAt
        },
        updatedAt: message.createdAt || new Date().toISOString()
      };
    })
    .sort(
      (a, b) =>
        new Date(b.updatedAt || b.lastMessage?.createdAt || 0) -
        new Date(a.updatedAt || a.lastMessage?.createdAt || 0)
    );
}

export default function ChatPage() {
  const navigate = useNavigate();
  const { profile, logout, updateMyProfile, resendVerification, getToken } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [conversationFilter, setConversationFilter] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [groupOpen, setGroupOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusError, setStatusError] = useState("");
  const [typingByConversation, setTypingByConversation] = useState({});
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const [localMediaStream, setLocalMediaStream] = useState(null);
  const [remoteMediaStream, setRemoteMediaStream] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);

  const socketRef = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pendingOfferRef = useRef(null);
  const pendingCallerRef = useRef(null);
  const pendingIceCandidatesRef = useRef([]);
  const activeConversationRef = useRef(null);

  useEffect(() => {
    activeConversationRef.current = activeConversation;
  }, [activeConversation]);

  const currentTypingUsers = useMemo(
    () => (activeConversation ? typingByConversation[activeConversation._id] || [] : []),
    [typingByConversation, activeConversation]
  );

  const filteredConversations = useMemo(() => {
    const q = conversationFilter.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((conversation) =>
      getConversationTitle(conversation, profile?._id).toLowerCase().includes(q)
    );
  }, [conversationFilter, conversations, profile?._id]);

  const loadConversations = useCallback(async () => {
    setLoadingConversations(true);
    try {
      const response = await api.get("/conversations", {
        params: { limit: 100, _: Date.now() },
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0"
        }
      });

      const list = Array.isArray(response.data?.data) ? response.data.data : [];

      setConversations(list);
      setActiveConversation((prev) => {
        if (!list.length) return null;
        if (!prev?._id) return list[0];
        const matched = list.find((item) => item._id === prev._id);
        return matched || list[0];
      });
      setStatusError("");
    } catch (error) {
      setStatusError(error.message || "Failed to load conversations");
    } finally {
      setLoadingConversations(false);
    }
  }, []);

  const loadMessages = useCallback(async (conversationId) => {
    if (!conversationId) return;

    setLoadingMessages(true);
    try {
      const response = await api.get(`/conversations/${conversationId}/messages`, {
        params: {
          limit: 50,
          _: Date.now()
        },
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0"
        }
      });

      const nextMessages = Array.isArray(response.data?.data) ? response.data.data : [];
      setMessages(nextMessages.map((message) => normalizeMessageForUi(message, profile)).filter(Boolean));
      setStatusError("");
    } catch (error) {
      setStatusError(error.message || "Failed to load messages");
    } finally {
      setLoadingMessages(false);
    }
  }, [profile]);

  const markSeen = useCallback(async (conversationId, messageId = null) => {
    if (!conversationId) return;
    try {
      if (socketRef.current?.connected) {
        socketRef.current.emit("message:seen", { conversationId, messageId });
      } else {
        await api.post("/messages/seen", { conversationId, messageId });
      }
    } catch (error) {
      console.error("markSeen failed:", error.message);
    }
  }, []);

  useEffect(() => {
    if (!profile?._id) return;
    loadConversations();
  }, [profile?._id, loadConversations]);

  useEffect(() => {
    if (!activeConversation?._id) return;
    loadMessages(activeConversation._id).then(() => markSeen(activeConversation._id));
  }, [activeConversation?._id, loadMessages, markSeen]);

  const cleanupCall = useCallback(() => {
    peerRef.current?.close();
    peerRef.current = null;

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

    setLocalMediaStream(null);
    setRemoteMediaStream(null);
    setActiveCall(null);
    setIncomingCall(null);
    pendingOfferRef.current = null;
    pendingCallerRef.current = null;
    pendingIceCandidatesRef.current = [];
  }, []);

  async function flushPendingIceCandidates(peer) {
    if (!peer || !pendingIceCandidatesRef.current.length) return;

    const candidates = pendingIceCandidatesRef.current;
    pendingIceCandidatesRef.current = [];

    for (const candidate of candidates) {
      try {
        await peer.addIceCandidate(candidate);
      } catch (error) {
        console.error("Queued ICE candidate add failed:", error);
      }
    }
  }
  const attachSocketListeners = useCallback((socket) => {
    const refreshAfterConnect = () => {
      loadConversations();
      const currentConversation = activeConversationRef.current;
      if (currentConversation?._id) {
        socket.emit("conversation:join", { conversationId: currentConversation._id });
        loadMessages(currentConversation._id).then(() => markSeen(currentConversation._id));
      }
    };

    socket.on("connect", () => {
      setSocketConnected(true);
      refreshAfterConnect();
    });
    socket.on("disconnect", () => setSocketConnected(false));
    if (socket.connected) queueMicrotask(() => {
      setSocketConnected(true);
      refreshAfterConnect();
    });
    socket.on(SOCKET_EVENTS.PRESENCE_UPDATE, ({ userId, isOnline, lastSeenAt }) => {
      setConversations((prev) =>
        prev.map((conversation) => ({
          ...conversation,
          participants: (conversation.participants || []).map((participant) =>
            String(participant.user?._id || participant.user) === String(userId)
              ? {
                  ...participant,
                  user: {
                    ...(participant.user || {}),
                    isOnline,
                    lastSeenAt
                  }
                }
              : participant
          )
        }))
      );
    });

    socket.on(SOCKET_EVENTS.MESSAGE_NEW, (message) => {
      const normalized = normalizeMessageForUi(message, profile);
      if (!normalized) return;

      setConversations((prev) => {
        const hasConversation = prev.some((conversation) => String(conversation._id) === String(normalized.conversation));
        if (!hasConversation) {
          queueMicrotask(() => loadConversations());
          return prev;
        }
        return updateConversationPreview(prev, normalized);
      });
      setMessages((prev) => {
        const currentConversation = activeConversationRef.current;
        if (
          currentConversation &&
          String(normalized.conversation) === String(currentConversation._id)
        ) {
          return mergeMessages(prev, normalized, profile);
        }
        return prev;
      });

      const currentConversation = activeConversationRef.current;
      if (
        currentConversation &&
        String(normalized.conversation) === String(currentConversation._id)
      ) {
        markSeen(String(normalized.conversation), normalized._id);
      }
    });

    socket.on(SOCKET_EVENTS.MESSAGE_EDITED, (message) => {
      const normalized = normalizeMessageForUi(message, profile);
      setMessages((prev) => prev.map((item) => (item._id === normalized?._id ? normalized : item)));
      if (normalized) {
        setConversations((prev) => updateConversationPreview(prev, normalized));
      }
    });

    socket.on(SOCKET_EVENTS.MESSAGE_DELETED, (message) => {
      const normalized = normalizeMessageForUi(message, profile);
      setMessages((prev) => prev.map((item) => (item._id === normalized?._id ? normalized : item)));
      if (normalized) {
        setConversations((prev) => updateConversationPreview(prev, normalized));
      }
    });

    socket.on(SOCKET_EVENTS.MESSAGE_REACTION, (message) => {
      const normalized = normalizeMessageForUi(message, profile);
      setMessages((prev) => prev.map((item) => (item._id === normalized?._id ? normalized : item)));
    });

    socket.on(SOCKET_EVENTS.TYPING_START, ({ conversationId, user }) => {
      setTypingByConversation((prev) => ({
        ...prev,
        [conversationId]: [...(prev[conversationId] || []).filter((entry) => entry._id !== user._id), user]
      }));
    });

    socket.on(SOCKET_EVENTS.TYPING_STOP, ({ conversationId, userId }) => {
      setTypingByConversation((prev) => ({
        ...prev,
        [conversationId]: (prev[conversationId] || []).filter((entry) => entry._id !== userId)
      }));
    });

    socket.on(SOCKET_EVENTS.CALL_RING, (payload) => {
      setIncomingCall({ ...payload, offerReady: Boolean(pendingOfferRef.current) });
      pendingCallerRef.current = payload.from?._id;
    });

    socket.on(SOCKET_EVENTS.CALL_OFFER, async ({ conversationId, fromUserId, offer, callType = "video" }) => {
      pendingOfferRef.current = { conversationId, fromUserId, offer };
      pendingCallerRef.current = fromUserId;
      setIncomingCall((prev) => {
        if (prev && String(prev.conversationId) === String(conversationId)) {
          return { ...prev, callType: prev.callType || callType, offerReady: true };
        }
        return {
          conversationId,
          callType,
          offerReady: true,
          from: {
            _id: fromUserId,
            displayName: "Incoming call",
            username: "caller"
          }
        };
      });
    });

    socket.on(SOCKET_EVENTS.CALL_ANSWER, async ({ answer }) => {
      if (!peerRef.current) return;
      await peerRef.current.setRemoteDescription(answer);
      await flushPendingIceCandidates(peerRef.current);
    });

    socket.on(SOCKET_EVENTS.CALL_ICE, async ({ candidate }) => {
      if (!candidate) return;
      if (!peerRef.current || !peerRef.current.remoteDescription) {
        pendingIceCandidatesRef.current.push(candidate);
        return;
      }
      try {
        await peerRef.current.addIceCandidate(candidate);
      } catch (error) {
        console.error("ICE candidate add failed:", error);
      }
    });

    socket.on(SOCKET_EVENTS.CALL_END, () => {
      cleanupCall();
    });
  }, [cleanupCall, loadConversations, loadMessages, markSeen, profile]);

  useEffect(() => {
    let mounted = true;
    let socket;

    async function connect() {
      if (!profile?._id) return;
      const token = await getToken();
      if (!token || !mounted) return;

      socket = createSocket(token);
      socketRef.current = socket;
      attachSocketListeners(socket);
    }

    connect();

    return () => {
      mounted = false;
      if (socket) {
        socket.removeAllListeners();
        socket.disconnect();
      }
    };
  }, [profile?._id, getToken, attachSocketListeners]);

  useEffect(() => {
    if (socketRef.current && activeConversation?._id) {
      socketRef.current.emit("conversation:join", { conversationId: activeConversation._id });
    }
  }, [activeConversation?._id]);
  useEffect(() => {
    if (!activeConversation?._id || socketConnected) return undefined;

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        loadMessages(activeConversation._id);
      }
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [activeConversation?._id, loadMessages, socketConnected]);

  const selectConversation = useCallback((conversation) => {
    setActiveConversation((prev) => {
      if (prev?._id === conversation?._id) return prev;
      return conversation;
    });
    setReplyingTo(null);
    setEditingMessage(null);
    setInfoOpen(false);
  }, []);

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  async function handleStartConversation(user) {
    try {
      const response = await api.post("/conversations/direct", { targetUserId: user._id });
      const conversation = response.data?.data;
      if (!conversation?._id) return;

      setConversations((prev) => {
        const exists = prev.some((item) => item._id === conversation._id);
        return exists ? prev : [conversation, ...prev];
      });

      setSearchOpen(false);
      selectConversation(conversation);
    } catch (error) {
      setStatusError(error.message || "Failed to start conversation");
    }
  }

  function handleGroupCreated(conversation) {
    if (!conversation?._id) return;
    setConversations((prev) => [conversation, ...prev.filter((item) => item._id !== conversation._id)]);
    setGroupOpen(false);
    selectConversation(conversation);
  }

  async function sendTextMessage(text) {
    if (!activeConversation?._id) throw new Error("Select a conversation first");

    if (editingMessage) {
      const payload = await new Promise((resolve, reject) => {
        if (!socketRef.current?.connected) {
          api
            .patch(`/messages/${editingMessage._id}`, { text })
            .then((response) => resolve(response.data?.data))
            .catch(reject);
          return;
        }

        socketRef.current.emit("message:edit", { messageId: editingMessage._id, text }, (ack) => {
          if (ack?.success) resolve(ack.data);
          else reject(new Error(ack?.message || "Failed to edit message"));
        });
      });

      const normalized = normalizeMessageForUi(payload, profile);
      setMessages((prev) => prev.map((item) => (item._id === normalized?._id ? normalized : item)));
      setEditingMessage(null);
      return normalized;
    }

    const payload = {
      conversationId: activeConversation._id,
      text,
      replyToId: replyingTo?._id || null,
      type: "text"
    };

    const message = await new Promise((resolve, reject) => {
      if (!socketRef.current?.connected) {
        api.post("/messages", payload).then((response) => resolve(response.data?.data)).catch(reject);
        return;
      }

      socketRef.current.emit("message:send", payload, (ack) => {
        if (ack?.success) resolve(ack.data);
        else reject(new Error(ack?.message || "Failed to send message"));
      });
    });

    const normalized = normalizeMessageForUi(message, profile);

    setMessages((prev) => mergeMessages(prev, normalized, profile));
    setConversations((prev) => updateConversationPreview(prev, normalized));
    setReplyingTo(null);

    if (socketRef.current?.connected) {
      markSeen(activeConversation._id, normalized?._id);
    }

    return normalized;
  }

  async function handleDeleteMessage(message) {
    try {
      const nextMessage = await new Promise((resolve, reject) => {
        if (!socketRef.current?.connected) {
          api.delete(`/messages/${message._id}`).then((response) => resolve(response.data?.data)).catch(reject);
          return;
        }

        socketRef.current.emit("message:delete", { messageId: message._id }, (ack) => {
          if (ack?.success) resolve(ack.data);
          else reject(new Error(ack?.message || "Failed to delete message"));
        });
      });

      const normalized = normalizeMessageForUi(nextMessage, profile);
      setMessages((prev) => prev.map((item) => (item._id === normalized?._id ? normalized : item)));
      if (normalized) {
        setConversations((prev) => updateConversationPreview(prev, normalized));
      }
    } catch (error) {
      setStatusError(error.message || "Failed to delete message");
    }
  }

  async function handleReactMessage(message, emoji) {
    try {
      const nextMessage = await new Promise((resolve, reject) => {
        if (!socketRef.current?.connected) {
          api
            .post(`/messages/${message._id}/reactions`, { emoji })
            .then((response) => resolve(response.data?.data))
            .catch(reject);
          return;
        }

        socketRef.current.emit("message:react", { messageId: message._id, emoji }, (ack) => {
          if (ack?.success) resolve(ack.data);
          else reject(new Error(ack?.message || "Failed to react to message"));
        });
      });

      const normalized = normalizeMessageForUi(nextMessage, profile);
      setMessages((prev) => prev.map((item) => (item._id === normalized?._id ? normalized : item)));
    } catch (error) {
      setStatusError(error.message || "Failed to react to message");
    }
  }

  async function handleUpload(file, caption = "") {
    const conversationId = activeConversation?._id;
    if (!conversationId) throw new Error("Select a conversation first");

    const formData = new FormData();
    formData.append("media", file);
    formData.append("conversationId", conversationId);
    if (caption) formData.append("caption", caption);
    if (replyingTo?._id) formData.append("replyToId", replyingTo._id);

    try {
      const response = await api.post("/uploads/media", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      const rawMessage = response.data?.data?.message || response.data?.data;
      const message = normalizeMessageForUi(rawMessage, profile);

      if (message) {
        setMessages((prev) => mergeMessages(prev, message, profile));
        setConversations((prev) => updateConversationPreview(prev, message));
      }


      setReplyingTo(null);
      setStatusError("");
      return message;
    } catch (error) {
      setStatusError(error.message || "Failed to upload media");
      throw error;
    }
  }

  async function handleUploadVoice(file) {
    const conversationId = activeConversation?._id;
    if (!conversationId) throw new Error("Select a conversation first");

    const formData = new FormData();
    formData.append("voiceNote", file);
    formData.append("conversationId", conversationId);
    if (replyingTo?._id) formData.append("replyToId", replyingTo._id);

    try {
      const response = await api.post("/uploads/voice-note", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      const rawMessage = response.data?.data?.message || response.data?.data;
      const message = normalizeMessageForUi(rawMessage, profile);

      if (message) {
        setMessages((prev) => mergeMessages(prev, message, profile));
        setConversations((prev) => updateConversationPreview(prev, message));
      }


      setReplyingTo(null);
      setStatusError("");
      return message;
    } catch (error) {
      setStatusError(error.message || "Failed to upload voice note");
      throw error;
    }
  }

  function emitTypingStart() {
    if (!activeConversation?._id) return;
    socketRef.current?.emit("typing:start", { conversationId: activeConversation._id });
  }

  function emitTypingStop() {
    if (!activeConversation?._id) return;
    socketRef.current?.emit("typing:stop", { conversationId: activeConversation._id });
  }

  function buildPeer(targetUserId, conversationId) {
    const peer = new RTCPeerConnection({
      iceServers: [{ urls: ["stun:stun.l.google.com:19302"] }]
    });

    peer.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (remoteStream) {
        setRemoteMediaStream(remoteStream);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
      }
    };

    peer.onconnectionstatechange = () => {
      const state = peer.connectionState;
      if (state === "connected") {
        setActiveCall((prev) => (prev ? { ...prev, status: "Connected" } : prev));
      }
      if (["failed", "disconnected", "closed"].includes(state)) {
        setActiveCall((prev) => (prev ? { ...prev, status: "Reconnecting" } : prev));
      }
    };

    peer.onicecandidate = (event) => {
      if (!event.candidate) return;
      socketRef.current?.emit("call:ice-candidate", {
        conversationId,
        targetUserId,
        candidate: event.candidate
      });
    };

    peerRef.current = peer;
    return peer;
  }

  async function attachLocalStream(type) {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: type === "video"
    });

    localStreamRef.current = stream;
    setLocalMediaStream(stream);
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }
    return stream;
  }

  async function startCall(type) {
    if (!activeConversation || activeConversation.type !== "direct") return;

    try {
      const otherUser = getOtherParticipant(activeConversation, profile?._id);
      if (!otherUser?._id) return;

      const stream = await attachLocalStream(type);
      const peer = buildPeer(otherUser._id, activeConversation._id);

      stream.getTracks().forEach((track) => peer.addTrack(track, stream));

      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);

      socketRef.current?.emit("call:ring", {
        conversationId: activeConversation._id,
        callType: type
      });

      socketRef.current?.emit("call:offer", {
        conversationId: activeConversation._id,
        targetUserId: otherUser._id,
        offer,
        callType: type
      });

      setActiveCall({
        type,
        conversationId: activeConversation._id,
        targetUserId: otherUser._id,
        label: otherUser.displayName || otherUser.username || "Call",
        status: "Ringing"
      });
    } catch (error) {
      setStatusError(`Call failed: ${normalizeError(error)}`);
      cleanupCall();
    }
  }

  async function acceptIncomingCall() {
    try {
      const incoming = incomingCall;
      const pending = pendingOfferRef.current;
      if (!incoming) return;
      if (!pending) {
        setStatusError("Call is still connecting. Please try again in a moment.");
        return;
      }

      const stream = await attachLocalStream(incoming.callType || "video");
      const peer = buildPeer(pending.fromUserId, pending.conversationId);

      stream.getTracks().forEach((track) => peer.addTrack(track, stream));
      await peer.setRemoteDescription(pending.offer);
      await flushPendingIceCandidates(peer);

      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);

      socketRef.current?.emit("call:answer", {
        conversationId: pending.conversationId,
        targetUserId: pending.fromUserId,
        answer
      });

      setActiveCall({
        type: incoming.callType || "video",
        conversationId: pending.conversationId,
        targetUserId: pending.fromUserId,
        label: incoming.from?.displayName || incoming.from?.username || "Call",
        status: "Connected"
      });

      setIncomingCall(null);
    } catch (error) {
      setStatusError(`Could not accept call: ${normalizeError(error)}`);
      cleanupCall();
    }
  }

  function declineIncomingCall() {
    if (incomingCall?.conversationId) {
      socketRef.current?.emit("call:end", { conversationId: incomingCall.conversationId });
    }
    cleanupCall();
  }

  function endCurrentCall() {
    if (activeCall?.conversationId) {
      socketRef.current?.emit("call:end", { conversationId: activeCall.conversationId });
    }
    cleanupCall();
  }

  function toggleMute() {
    const audioTrack = localStreamRef.current?.getAudioTracks?.()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
    }
  }

  function toggleVideo() {
    const videoTrack = localStreamRef.current?.getVideoTracks?.()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
    }
  }

  const emptyState = (
    <div className="chat-placeholder glass-panel">
      <h2>ShadowChat</h2>
      <p>Start a direct conversation, create a group, and chat in real time with Firebase-backed login.</p>
    </div>
  );

  return (
    <div className="page-shell app-shell">
      <div className="app-layout">
        <Sidebar
          profile={profile}
          conversations={filteredConversations}
          activeConversationId={activeConversation?._id}
          onSelectConversation={(conversation) => {
            selectConversation(conversation);
            setMobileSidebarOpen(false);
          }}
          onOpenSearch={() => setSearchOpen(true)}
          onOpenGroup={() => setGroupOpen(true)}
          onOpenProfile={() => setProfileOpen(true)}
          onLogout={handleLogout}
          conversationFilter={conversationFilter}
          setConversationFilter={setConversationFilter}
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />
        <button
          type="button"
          className={`sidebar-scrim ${mobileSidebarOpen ? "show" : ""}`}
          aria-label="Close chats"
          onClick={() => setMobileSidebarOpen(false)}
        />

        <main className="chat-main">
          <ChatHeader
            conversation={activeConversation}
            currentUserId={profile?._id}
            onOpenProfile={() => setInfoOpen(true)}
            onStartCall={startCall}
            onToggleSidebar={() => setMobileSidebarOpen(true)}
          />

          {statusError ? <div className="error-banner floating-banner">{statusError}</div> : null}
          {statusMessage ? <div className="success-banner floating-banner">{statusMessage}</div> : null}

          {loadingConversations ? (
            <div className="glass-panel loading-zone">Loading conversations...</div>
          ) : activeConversation ? (
            <>
              {loadingMessages ? (
                <div className="glass-panel loading-zone">Loading messages...</div>
              ) : (
                <MessageList
                  messages={messages}
                  currentUserId={profile?._id}
                  typingUsers={currentTypingUsers}
                  onDeleteMessage={handleDeleteMessage}
                  onReplyMessage={setReplyingTo}
                  onEditMessage={(message) => {
                    setReplyingTo(null);
                    setEditingMessage(message);
                  }}
                  onReactMessage={handleReactMessage}
                />
              )}

              <MessageComposer
                disabled={!activeConversation}
                replyingTo={replyingTo}
                editingMessage={editingMessage}
                onCancelReply={() => setReplyingTo(null)}
                onCancelEdit={() => setEditingMessage(null)}
                onSendText={sendTextMessage}
                onUploadMedia={handleUpload}
                onUploadVoice={handleUploadVoice}
                onTypingStart={emitTypingStart}
                onTypingStop={emitTypingStop}
              />
            </>
          ) : (
            emptyState
          )}
        </main>
      </div>

      <SearchUsersModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onStartConversation={handleStartConversation}
      />

      <CreateGroupModal
        open={groupOpen}
        onClose={() => setGroupOpen(false)}
        onCreated={handleGroupCreated}
      />

      <ProfilePanel
        open={profileOpen}
        profile={profile}
        onClose={() => setProfileOpen(false)}
        onSave={async (payload) => {
          const updated = await updateMyProfile(payload);
          setStatusMessage("Profile updated successfully.");
          setTimeout(() => setStatusMessage(""), 2500);
          return updated;
        }}
        onResendVerification={async () => {
          await resendVerification();
          setStatusMessage("Verification email sent.");
          setTimeout(() => setStatusMessage(""), 2500);
        }}
      />

      <ConversationInfoPanel
        open={infoOpen}
        conversation={activeConversation}
        currentUserId={profile?._id}
        onClose={() => setInfoOpen(false)}
      />

      <IncomingCallModal
        call={incomingCall}
        onAccept={acceptIncomingCall}
        onDecline={declineIncomingCall}
        acceptDisabled={!incomingCall?.offerReady}
      />

      <ActiveCallPanel
        activeCall={activeCall}
        localVideoRef={localVideoRef}
        remoteVideoRef={remoteVideoRef}
        localStream={localMediaStream}
        remoteStream={remoteMediaStream}
        onEndCall={endCurrentCall}
        onToggleMute={toggleMute}
        onToggleVideo={toggleVideo}
      />
    </div>
  );
}
