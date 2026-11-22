import { useState } from "react";

function getInitials(user) {
  const firstName = user?.firstName?.trim() ?? "";
  const lastName = user?.lastName?.trim() ?? "";
  const firstInitial = firstName[0] ?? lastName[0] ?? "?";
  const lastInitial = firstName && lastName ? lastName[0] : "";
  return `${firstInitial}${lastInitial}`.toUpperCase();
}

function ProfileAvatar({ user, className = "" }) {
  const [imageFailed, setImageFailed] = useState(false);
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ");
  const imageUrl = user?.profilePictureUrl;

  if (imageUrl && !imageFailed) {
    return (
      <img
        src={imageUrl}
        alt={`${name || "Your"} profile`}
        referrerPolicy="no-referrer"
        className={`h-10 w-10 rounded-full object-cover ring-1 ring-midnight/15 ${className}`}
        onError={() => setImageFailed(true)}
      />
    );
  }

  return (
    <span
      aria-label={`${name || "User"} initials: ${getInitials(user)}`}
      role="img"
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-midnight via-[#2c221b] to-midnight text-xs font-extrabold text-aurora ring-1 ring-aurora/30 shadow-xs ${className}`}
    >
      {getInitials(user)}
    </span>
  );
}

export default ProfileAvatar;
