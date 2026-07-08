export function formatTime(dateValue) {
  if (!dateValue) return "";
  const date = new Date(dateValue);
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

export function formatDayLabel(dateValue) {
  const date = new Date(dateValue);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const isSameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (isSameDay(date, today)) return "Today";
  if (isSameDay(date, yesterday)) return "Yesterday";

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: today.getFullYear() === date.getFullYear() ? undefined : "numeric"
  }).format(date);
}

export function getConversationTitle(conversation, currentUserId) {
  if (!conversation) return "Choose a chat";
  if (conversation.type === "group") return conversation.title || "Untitled group";

  const other = (conversation.participants || []).find(
    (item) => String(item.user?._id || item.user) !== String(currentUserId)
  );

  return other?.user?.displayName || other?.user?.username || "Direct chat";
}

export function getConversationSubtitle(conversation, currentUserId) {
  if (!conversation) return "";
  if (conversation.type === "group") {
    return `${conversation.participants?.length || 0} members`;
  }

  const other = (conversation.participants || []).find(
    (item) => String(item.user?._id || item.user) !== String(currentUserId)
  );

  if (!other?.user) return "";
  if (other.user.isOnline) return "Online";
  return other.user.lastSeenAt
    ? `Last seen ${new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
      }).format(new Date(other.user.lastSeenAt))}`
    : "Offline";
}

export function getConversationAvatar(conversation, currentUserId) {
  if (!conversation) return "";
  if (conversation.type === "group") return conversation.avatarUrl || "";

  const other = (conversation.participants || []).find(
    (item) => String(item.user?._id || item.user) !== String(currentUserId)
  );

  return other?.user?.avatarUrl || "";
}

export function getOtherParticipant(conversation, currentUserId) {
  return (conversation?.participants || []).find(
    (item) => String(item.user?._id || item.user) !== String(currentUserId)
  )?.user;
}

export function normalizeError(error, fallback = "Something went wrong") {
  return error?.message || fallback;
}

export function initialsFromName(name = "ShadowChat") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "SC";
}

export function groupMessagesByDay(messages = []) {
  const groups = [];
  let lastLabel = "";

  messages.forEach((message) => {
    const label = formatDayLabel(message.createdAt);
    if (label !== lastLabel) {
      groups.push({ type: "label", label });
      lastLabel = label;
    }
    groups.push({ type: "message", message });
  });

  return groups;
}
