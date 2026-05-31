// src/components/common/Avatar.jsx
//
// One avatar component to rule them all. Handles:
//   - Google/external image URLs with referrerPolicy="no-referrer"
//     (otherwise Chrome's Referer header makes Google reject the request)
//   - Graceful fallback to initials if URL fails or is missing
//   - Configurable size
//   - Consistent gradient background

import React, { useState, useEffect } from "react";

export default function Avatar({
  src,
  name = "?",
  size = 40,
  fontSize,
  style = {},
  className = "",
}) {
  const [broken, setBroken] = useState(false);

  // Reset error state if src changes (e.g., user picks a new photo)
  useEffect(() => {
    setBroken(false);
  }, [src]);

  const initials = String(name || "?")
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const hasAvatar = !!src && /^(https?:\/\/|data:image\/)/.test(src) && !broken;

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)",
        color: "white",
        display: "grid",
        placeItems: "center",
        fontWeight: 700,
        fontSize: fontSize || size * 0.4,
        flexShrink: 0,
        overflow: "hidden",
        ...style,
      }}
    >
      {hasAvatar ? (
        <img
          src={src}
          alt={name}
          referrerPolicy="no-referrer"
          onError={() => setBroken(true)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
      ) : (
        initials
      )}
    </div>
  );
}