"use client";
import React from "react";
import { cn } from "../../utils/cn";

export const BackgroundGradient = ({
  children,
  className,
  containerClassName,
  animate = true,
}) => {
  return (
    <div className={cn("relative group", containerClassName)}>
      <div
        className={cn(
          "absolute -inset-px rounded-xl blur-xl group-hover:blur-2xl transition duration-500",
          animate && "animate-gradient",
          className
        )}
        style={{
          background:
            "linear-gradient(to right, rgb(var(--gradient-from)), rgb(var(--gradient-to)))",
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}; 