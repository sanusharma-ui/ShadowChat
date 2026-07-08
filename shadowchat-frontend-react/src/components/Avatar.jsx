// src/components/Avatar.jsx
import { useMemo, useState } from "react";
import { UserRound } from "lucide-react";
import { initialsFromName } from "../utils/chat";
import { resolveAssetUrl } from "../utils/assets";


export default function Avatar({ name, src, size = "md", online = false }) {
  const [broken, setBroken] = useState(false);

  const resolved = useMemo(() => {
    if (!src || broken) return "";
    return resolveAssetUrl(src);
  }, [src, broken]);

  return (
    <div className={`avatar avatar-${size}`}>
      {resolved ? (
        <img
          src={resolved}
          alt={name || "avatar"}
          onError={() => setBroken(true)}
          loading="lazy"
        />
      ) : name ? (
        <span>{initialsFromName(name)}</span>
      ) : (
        <UserRound size={18} />
      )}
      {online ? <i className="avatar-online-dot" /> : null}
    </div>
  );
}
