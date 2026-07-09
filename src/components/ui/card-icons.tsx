import { cn } from "@/lib/utils"

interface CardIconProps {
  type: "YELLOW" | "RED"
  isSecondYellow?: boolean
  className?: string
}

export function CardIcon({ type, isSecondYellow, className }: CardIconProps) {
  if (isSecondYellow) {
    return (
      <span className={cn("inline-flex items-center -space-x-0.5", className)}>
        <svg width="10" height="14" viewBox="0 0 10 14" fill="none" className="drop-shadow-[0_1px_1px_rgba(0,0,0,0.2)]">
          <rect x="0.5" y="0.5" width="9" height="13" rx="1.5" fill="#EAB308" stroke="#CA8A04" strokeWidth="0.5" />
        </svg>
        <svg width="10" height="14" viewBox="0 0 10 14" fill="none" className="drop-shadow-[0_1px_1px_rgba(0,0,0,0.2)]">
          <rect x="0.5" y="0.5" width="9" height="13" rx="1.5" fill="#EF4444" stroke="#DC2626" strokeWidth="0.5" />
        </svg>
      </span>
    )
  }

  return (
    <svg
      width="10" height="14" viewBox="0 0 10 14" fill="none"
      className={cn("drop-shadow-[0_1px_1px_rgba(0,0,0,0.2)]", className)}
    >
      <rect x="0.5" y="0.5" width="9" height="13" rx="1.5"
        fill={type === "YELLOW" ? "#EAB308" : "#EF4444"}
        stroke={type === "YELLOW" ? "#CA8A04" : "#DC2626"}
        strokeWidth="0.5"
      />
    </svg>
  )
}

export function GoalBall({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center justify-center text-sm leading-none", className)}>
      ⚽
    </span>
  )
}
