'use client';

import { useState } from 'react';

/**
 * Deterministic agent avatar — a real illustrated image from DiceBear (free,
 * no API key, no uploads/Pinata). The same seed always yields the same avatar.
 * Falls back to a generated gradient + initial if the image fails to load.
 */

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

// "bottts-neutral" = clean robot/agent characters; fits an AI-agent marketplace.
const DICEBEAR_STYLE = 'bottts-neutral';

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
  const [failed, setFailed] = useState(false);
  const key = encodeURIComponent(seed || name || 'agent');
  const url = `https://api.dicebear.com/9.x/${DICEBEAR_STYLE}/svg?seed=${key}&radius=8&backgroundColor=23170a,30200c,1b1308`;

  if (failed) {
    // Gradient fallback (offline-safe).
    const h = hashString(seed || name || 'agent');
    const hue1 = h % 360;
    const hue2 = (hue1 + 40 + (h % 60)) % 360;
    const initial = (name.trim()[0] || 'A').toUpperCase();
    return (
      <div
        className={`flex items-center justify-center ${rounded} ${className} font-display font-bold text-white`}
        style={{ backgroundImage: `linear-gradient(135deg, hsl(${hue1} 65% 42%), hsl(${hue2} 70% 30%))` }}
        aria-hidden
      >
        <span className="text-[length:48%]">{initial}</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={name || 'agent avatar'}
      className={`${rounded} ${className} bg-[#23170a] object-cover`}
      onError={() => setFailed(true)}
      loading="lazy"
    />
  );
}
