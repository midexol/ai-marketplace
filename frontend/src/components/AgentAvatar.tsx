/**
 * Deterministic generated avatar — a unique gradient + initial derived from a
 * seed (agent id / token address / name). No uploads, no IPFS, no Pinata:
 * the same seed always renders the same avatar, fully offline.
 */

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

interface AgentAvatarProps {
  seed: string;
  name?: string;
  /** Tailwind size classes, e.g. 'h-12 w-12'. */
  className?: string;
  rounded?: string; // e.g. 'rounded-xl'
}

export function AgentAvatar({
  seed,
  name = '',
  className = 'h-12 w-12',
  rounded = 'rounded-xl',
}: AgentAvatarProps) {
  const h = hashString(seed || name || 'agent');
  const hue1 = h % 360;
  const hue2 = (hue1 + 40 + (h % 60)) % 360;
  const angle = h % 360;
  const initial = (name.trim()[0] || 'A').toUpperCase();

  return (
    <div
      className={`flex items-center justify-center ${rounded} ${className} font-display font-semibold text-black/80`}
      style={{
        backgroundImage: `linear-gradient(${angle}deg, hsl(${hue1} 70% 58%), hsl(${hue2} 75% 48%))`,
      }}
      aria-hidden
    >
      <span className="text-[length:55%] drop-shadow-sm">{initial}</span>
    </div>
  );
}
