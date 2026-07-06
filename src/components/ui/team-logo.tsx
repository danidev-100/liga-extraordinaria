import { cn } from "@/lib/utils"
import Image from "next/image"

interface TeamLogoProps {
  logoUrl: string | null
  color: string | null
  name: string
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
}

const sizeMap = {
  sm: "size-5",
  md: "size-7",
  lg: "size-10",
  xl: "size-16",
}

export function TeamLogo({
  logoUrl,
  color,
  name,
  size = "sm",
  className,
}: TeamLogoProps) {
  const dimension = size === "sm" ? 20 : size === "md" ? 28 : size === "lg" ? 40 : 64

  if (logoUrl) {
    return (
      <div
        className={cn(
          "relative shrink-0 overflow-hidden rounded-full ring-1 ring-black/10",
          sizeMap[size],
          className,
        )}
      >
        <Image
          src={logoUrl}
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
