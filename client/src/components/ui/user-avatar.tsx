import { cn } from "@/lib/utils";

interface UserAvatarProps {
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  email?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-14 h-14 text-lg",
};

export function UserAvatar({
  firstName,
  lastName,
  name,
  email,
  size = "md",
  className,
}: UserAvatarProps) {
  const initials = getInitials(firstName, lastName, name, email);

  return (
    <div
      className={cn(
        "rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold shadow-[0_0_16px_rgba(var(--primary-rgb,159,188,164),0.4)]",
        sizeClasses[size],
        className
      )}
    >
      {initials}
    </div>
  );
}

function getInitials(
  firstName?: string | null,
  lastName?: string | null,
  name?: string | null,
  email?: string | null
): string {
  if (firstName && lastName) {
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
  }
  if (firstName) {
    return firstName.charAt(0).toUpperCase();
  }
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  }
  if (email) {
    return email.charAt(0).toUpperCase();
  }
  return "U";
}
