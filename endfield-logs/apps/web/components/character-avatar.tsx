"use client";

import { useState } from "react";

type CharacterAvatarProps = {
  name: string;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg";
};

export function CharacterAvatar({ name, avatarUrl, size = "md" }: CharacterAvatarProps) {
  const [failed, setFailed] = useState(false);
  const initial = name.slice(0, 1);
  const showImage = Boolean(avatarUrl) && !failed;

  return (
    <span className={`character-avatar character-avatar-${size}`} title={name}>
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt={name}
          className="character-avatar-image"
          decoding="async"
          loading="lazy"
          onError={() => setFailed(true)}
          src={avatarUrl ?? undefined}
        />
      ) : (
        <span className="character-avatar-fallback">{initial}</span>
      )}
    </span>
  );
}
