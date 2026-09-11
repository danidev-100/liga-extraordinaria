import { cn } from "@/lib/utils"
import { resolveTeamShield } from "@/lib/team-shields"
import Image from "next/image"

interface TeamLogoProps {
  logoUrl: string | null
  color: string | null
  name: string
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
}

const sizeMap = {
  sm: "size-[25px]",
  md: "size-[35px]",
  lg: "size-[51px]",
  xl: "size-[81px]",
}

export function TeamLogo({
  logoUrl,
  color,
  name,
  size = "sm",
  className,
}: TeamLogoProps) {
  const dimension = size === "sm" ? 25 : size === "md" ? 35 : size === "lg" ? 51 : 81
  const resolvedLogo = logoUrl || resolveTeamShield(name)

  if (resolvedLogo) {
    return (
      <div
        className={cn(
          "relative shrink-0 overflow-hidden rounded-full ring-1 ring-black/10",
          sizeMap[size],
          className,
        )}
      >
        <Image
          src={resolvedLogo}
          alt={`${name} escudo`}
          fill
          className="object-cover"
          sizes={`${dimension}px`}
        />
      </div>
    )
  }

  if (color) {
    return (
      <span
        className={cn(
          "inline-block shrink-0 rounded-full ring-1 ring-black/10",
          sizeMap[size],
          className,
        )}
        style={{ backgroundColor: color }}
      />
    )
  }

  return null
}
