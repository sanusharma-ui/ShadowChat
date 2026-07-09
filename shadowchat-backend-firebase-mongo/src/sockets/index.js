const { Server } = require("socket.io");
const { getAuth } = require("../config/firebase");
const env = require("../config/env");
const { syncUserFromFirebase } = require("../services/auth.service");
const Conversation = require("../models/Conversation");
const User = require("../models/User");
const {
  MESSAGE_NEW,
  MESSAGE_EDITED,
  MESSAGE_DELETED,
  MESSAGE_REACTION,
  MESSAGE_SEEN,
  PRESENCE_UPDATE,
  TYPING_START,
  TYPING_STOP,
  CALL_RING,
  CALL_OFFER,
  CALL_ANSWER,
  CALL_ICE,
  CALL_END
} = require("../constants/events");
const {
  ensureParticipant,
  getConversationParticipants
} = require("../services/conversation.service");
const {
  createMessage,
  editMessage,
  deleteMessage,
  toggleReaction,
  markConversationSeen
} = require("../services/message.service");

function roomForUser(userId) {
  return `user:${userId}`;
}

function roomForConversation(conversationId) {
  return `conversation:${conversationId}`;
}

async function emitToConversationParticipants(io, conversationId, eventName, payload) {
  if (!io || !conversationId || !eventName) return;

  const participantIds = await getConversationParticipants(conversationId);
  let target = io.to(roomForConversation(conversationId));
  participantIds.forEach((participantId) => {
    target = target.to(roomForUser(participantId));
  });
  target.emit(eventName, payload);
}

async function getUserConversationIds(userId) {
  const conversations = await Conversation.find({
    "participants.user": userId
  }).select("_id");
  return conversations.map((item) => String(item._id));
}

function buildSocketError(message, details) {
  return {
    success: false,
    message,
    details: details || null
  };
}

async function setupSocket(io, socket) {
  const user = socket.data.user;
  const userRoom = roomForUser(user._id);
  socket.join(userRoom);

  const conversationIds = await getUserConversationIds(user._id);
  conversationIds.forEach((conversationId) => socket.join(roomForConversation(conversationId)));

  await User.findByIdAndUpdate(user._id, {
    $set: {
      isOnline: true,
      lastSeenAt: null
    }
  });

  const presencePayload = {
    userId: String(user._id),
    isOnline: true,
    lastSeenAt: null
  };

  conversationIds.forEach((conversationId) => {
    socket.to(roomForConversation(conversationId)).emit(PRESENCE_UPDATE, presencePayload);
  });

  socket.emit(PRESENCE_UPDATE, presencePayload);

  socket.on("conversation:join", async ({ conversationId }, ack) => {
    try {
      await ensureParticipant(conversationId, user._id);
      socket.join(roomForConversation(conversationId));
      if (typeof ack === "function") ack({ success: true, conversationId });
    } catch (error) {
      if (typeof ack === "function") ack(buildSocketError(error.message));
    }
  });

  socket.on("conversation:leave", ({ conversationId }, ack) => {
    socket.leave(roomForConversation(conversationId));
    if (typeof ack === "function") ack({ success: true, conversationId });
  });

  socket.on(TYPING_START, async ({ conversationId }, ack) => {
    try {
      await ensureParticipant(conversationId, user._id);
      socket.to(roomForConversation(conversationId)).emit(TYPING_START, {
        conversationId,
        user: {
          _id: String(user._id),
          displayName: user.displayName,
          username: user.username,
          avatarUrl: user.avatarUrl
        }
      });
      if (typeof ack === "function") ack({ success: true });
    } catch (error) {
      if (typeof ack === "function") ack(buildSocketError(error.message));
    }
  });

  socket.on(TYPING_STOP, async ({ conversationId }, ack) => {
    try {
      await ensureParticipant(conversationId, user._id);
      socket.to(roomForConversation(conversationId)).emit(TYPING_STOP, {
        conversationId,
        userId: String(user._id)
      });
      if (typeof ack === "function") ack({ success: true });
    } catch (error) {
      if (typeof ack === "function") ack(buildSocketError(error.message));
    }
  });

  socket.on("message:send", async (payload, ack) => {
    try {
      const message = await createMessage({
        conversationId: payload.conversationId,
        senderId: user._id,
        type: payload.type || "text",
        text: payload.text || "",
        attachments: Array.isArray(payload.attachments) ? payload.attachments : [],
        replyToId: payload.replyToId || null,
        meta: payload.meta || {}
      });

      await emitToConversationParticipants(io, payload.conversationId, MESSAGE_NEW, message);
      if (typeof ack === "function") ack({ success: true, data: message });
    } catch (error) {
      if (typeof ack === "function") ack(buildSocketError(error.message));
    }
  });

  socket.on("message:edit", async ({ messageId, text }, ack) => {
    try {
      const message = await editMessage({
        messageId,
        userId: user._id,
        text
      });
      await emitToConversationParticipants(io, String(message.conversation), MESSAGE_EDITED, message);
      if (typeof ack === "function") ack({ success: true, data: message });
    } catch (error) {
      if (typeof ack === "function") ack(buildSocketError(error.message));
    }
  });

  socket.on("message:delete", async ({ messageId }, ack) => {
    try {
      const message = await deleteMessage({
        messageId,
        userId: user._id
      });
      await emitToConversationParticipants(io, String(message.conversation), MESSAGE_DELETED, message);
      if (typeof ack === "function") ack({ success: true, data: message });
    } catch (error) {
      if (typeof ack === "function") ack(buildSocketError(error.message));
    }
  });

  socket.on("message:react", async ({ messageId, emoji }, ack) => {
    try {
      const message = await toggleReaction({
        messageId,
        userId: user._id,
        emoji
      });
      await emitToConversationParticipants(io, String(message.conversation), MESSAGE_REACTION, message);
      if (typeof ack === "function") ack({ success: true, data: message });
    } catch (error) {
      if (typeof ack === "function") ack(buildSocketError(error.message));
    }
  });

  socket.on("message:seen", async ({ conversationId, messageId }, ack) => {
    try {
      const result = await markConversationSeen({
        conversationId,
        userId: user._id,
        messageId: messageId || null
      });
      await emitToConversationParticipants(io, conversationId, MESSAGE_SEEN, {
        conversationId,
        messageId: messageId || null,
        userId: String(user._id),
        modifiedCount: result.modifiedCount
      });
      if (typeof ack === "function") ack({ success: true, data: result });
    } catch (error) {
      if (typeof ack === "function") ack(buildSocketError(error.message));
    }
  });

  socket.on(CALL_RING, async ({ conversationId, callType = "video" }, ack) => {
    try {
      await ensureParticipant(conversationId, user._id);
      const participantIds = await getConversationParticipants(conversationId);
      participantIds
        .filter((participantId) => participantId !== String(user._id))
        .forEach((participantId) => {
          io.to(roomForUser(participantId)).emit(CALL_RING, {
            conversationId,
            callType,
            from: {
              _id: String(user._id),
              displayName: user.displayName,
              username: user.username,
              avatarUrl: user.avatarUrl
            }
          });
        });

      if (typeof ack === "function") ack({ success: true });
    } catch (error) {
      if (typeof ack === "function") ack(buildSocketError(error.message));
    }
  });

  socket.on(CALL_OFFER, async ({ conversationId, targetUserId, offer }, ack) => {
    try {
      await ensureParticipant(conversationId, user._id);
      io.to(roomForUser(targetUserId)).emit(CALL_OFFER, {
        conversationId,
        fromUserId: String(user._id),
        offer
      });
      if (typeof ack === "function") ack({ success: true });
    } catch (error) {
      if (typeof ack === "function") ack(buildSocketError(error.message));
    }
  });

  socket.on(CALL_ANSWER, async ({ conversationId, targetUserId, answer }, ack) => {
    try {
      await ensureParticipant(conversationId, user._id);
      io.to(roomForUser(targetUserId)).emit(CALL_ANSWER, {
        conversationId,
        fromUserId: String(user._id),
        answer
      });
      if (typeof ack === "function") ack({ success: true });
    } catch (error) {
      if (typeof ack === "function") ack(buildSocketError(error.message));
    }
  });

  socket.on(CALL_ICE, async ({ conversationId, targetUserId, candidate }, ack) => {
    try {
      await ensureParticipant(conversationId, user._id);
      io.to(roomForUser(targetUserId)).emit(CALL_ICE, {
        conversationId,
        fromUserId: String(user._id),
        candidate
      });
      if (typeof ack === "function") ack({ success: true });
    } catch (error) {
      if (typeof ack === "function") ack(buildSocketError(error.message));
    }
  });

  socket.on(CALL_END, async ({ conversationId }, ack) => {
    try {
      await ensureParticipant(conversationId, user._id);
      socket.to(roomForConversation(conversationId)).emit(CALL_END, {
        conversationId,
        userId: String(user._id)
      });
      if (typeof ack === "function") ack({ success: true });
    } catch (error) {
      if (typeof ack === "function") ack(buildSocketError(error.message));
    }
  });

  socket.on("disconnect", async () => {
    try {
      setTimeout(async () => {
        const stillConnectedCount = io.sockets.adapter.rooms.get(userRoom)?.size || 0;
        if (stillConnectedCount === 0) {
          const lastSeenAt = new Date();
          await User.findByIdAndUpdate(user._id, {
            $set: {
              isOnline: false,
              lastSeenAt
            }
          });

          const presencePayload = {
            userId: String(user._id),
            isOnline: false,
            lastSeenAt: lastSeenAt.toISOString()
          };

          conversationIds.forEach((conversationId) => {
            socket.to(roomForConversation(conversationId)).emit(PRESENCE_UPDATE, presencePayload);
          });
        }
      }, 0);
    } catch (error) {
      console.error("Socket disconnect cleanup failed:", error.message);
    }
  });
}

function initSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin(origin, callback) {
        if (!origin) return callback(null, true);
        if (env.clientOrigins.includes(origin)) return callback(null, true);
        if (origin.includes("localhost")) return callback(null, true);
        return callback(new Error("Not allowed by CORS"));
      },
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, "") ||
        "";

      if (!token) return next(new Error("Missing Firebase auth token"));

      const decoded = await getAuth().verifyIdToken(token, env.checkRevokedTokens);
      const user = await syncUserFromFirebase(decoded);

      socket.data.firebaseUser = decoded;
      socket.data.user = user;
      return next();
    } catch (error) {
      return next(new Error("Socket authentication failed"));
    }
  });

  io.on("connection", async (socket) => {
    try {
      await setupSocket(io, socket);
    } catch (error) {
      console.error("Socket setup failed:", error);
      socket.disconnect(true);
    }
  });

  return io;
}

module.exports = {
  initSocketServer,
  roomForUser,
  roomForConversation,
  emitToConversationParticipants
};


