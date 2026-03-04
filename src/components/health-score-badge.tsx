import * as React from "react";
import { cn } from "@/lib/utils";

interface Props {
  score: number;
  size?: "sm" | "md" | "lg";
}

function getScoreColorClasses(score: number): {
  ring: string;
  bg: string;
  text: string;
  label: string;
} {
  if (score >= 70) {
    return {
      ring: "stroke-green-500",
      bg: "bg-green-50",
      text: "text-green-700",
      label: "Healthy",
    };
  }
  if (score >= 40) {
    return {
      ring: "stroke-yellow-500",
      bg: "bg-yellow-50",
      text: "text-yellow-700",
      label: "At Risk",
    };
  }
  return {
    ring: "stroke-red-500",
    bg: "bg-red-50",
    text: "text-red-700",
    label: "Critical",
  };
}

const sizeConfig = {
  sm: {
    wrapper: "w-10 h-10",
    svg: 40,
    radius: 16,
    strokeWidth: 3,
    scoreText: "text-[10px] font-bold",
    labelText: "text-[8px]",
    showLabel: false,
    cx: 20,
    cy: 20,
  },
  md: {
    wrapper: "w-14 h-14",
    svg: 56,
    radius: 22,
    strokeWidth: 3.5,
    scoreText: "text-sm font-bold",
    labelText: "text-[9px]",
    showLabel: true,
    cx: 28,
    cy: 28,
  },
  lg: {
    wrapper: "w-20 h-20",
    svg: 80,
    radius: 32,
    strokeWidth: 4,
    scoreText: "text-xl font-bold",
    labelText: "text-[10px]",
    showLabel: true,
    cx: 40,
    cy: 40,
  },
};

export function HealthScoreBadge({ score, size = "md" }: Props) {
  const clampedScore = Math.max(0, Math.min(100, Math.round(score)));
  const colors = getScoreColorClasses(clampedScore);
  const config = sizeConfig[size];

  const { svg, radius, strokeWidth, cx, cy } = config;
  const circumference = 2 * Math.PI * radius;
  const progress = (clampedScore / 100) * circumference;
  const dashOffset = circumference - progress;

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center",
        config.wrapper
      )}
      aria-label={`Health score: ${clampedScore} — ${colors.label}`}
    >
      {/* SVG ring */}
      <svg
        width={svg}
        height={svg}
        viewBox={`0 0 ${svg} ${svg}`}
        fill="none"
        className="absolute inset-0 -rotate-90"
        aria-hidden="true"
      >
        {/* Background track */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          strokeWidth={strokeWidth}
          className="stroke-muted"
          fill="none"
        />
        {/* Progress arc */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          strokeWidth={strokeWidth}
          className={cn("transition-all duration-700 ease-out", colors.ring)}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </svg>

      {/* Inner content */}
      <div className="relative flex flex-col items-center justify-center leading-none">
        <span className={cn(colors.text, config.scoreText)}>{clampedScore}</span>
        {config.showLabel && (
          <span className={cn("mt-0.5 font-medium uppercase tracking-wide", colors.text, config.labelText)}>
            {colors.label}
          </span>
        )}
      </div>
    </div>
  );
}
