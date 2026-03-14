type BadgeOptions = {
  isHost?: boolean;
  isSelf?: boolean;
};

export function getParticipantBadge(name: string, options: BadgeOptions = {}) {
  const trimmed = name.trim();

  if (options.isHost || trimmed === "ホスト") {
    return "H";
  }

  const match = trimmed.match(/^P(\d+)$/);
  if (options.isSelf && match) {
    return "ME";
  }

  if (match) {
    return match[1];
  }

  if (options.isSelf && trimmed === "わたし") {
    return "ME";
  }

  if (!trimmed) {
    return "?";
  }

  return trimmed.slice(0, 1).toUpperCase();
}
