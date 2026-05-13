const AVATAR_COLORS = [
  'bg-sky-700',
  'bg-indigo-700',
  'bg-emerald-700',
  'bg-violet-700',
  'bg-rose-700',
  'bg-amber-700',
];

export function getAvatarColor(id: string): string {
  const seed = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_COLORS[seed % AVATAR_COLORS.length];
}
