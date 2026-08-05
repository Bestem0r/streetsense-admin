import { getAvatarColor } from './avatar.utils';

describe('getAvatarColor', () => {
  const VALID_CLASSES = [
    'bg-sky-700', 'bg-indigo-700', 'bg-emerald-700',
    'bg-violet-700', 'bg-rose-700', 'bg-amber-700',
  ];

  it('returns a valid Tailwind bg class', () => {
    expect(VALID_CLASSES).toContain(getAvatarColor('abc123'));
  });

  it('is deterministic — same id always same color', () => {
    const id = 'inspector-42';
    expect(getAvatarColor(id)).toBe(getAvatarColor(id));
  });

  it('distributes across palette — different ids can produce different colors', () => {
    const results = new Set(
      ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'].map(getAvatarColor)
    );
    expect(results.size).toBeGreaterThan(1);
  });

  it('handles empty string without throwing', () => {
    expect(() => getAvatarColor('')).not.toThrow();
    expect(VALID_CLASSES).toContain(getAvatarColor(''));
  });

  it('handles long ids without throwing', () => {
    const longId = 'a'.repeat(1000);
    expect(VALID_CLASSES).toContain(getAvatarColor(longId));
  });
});
