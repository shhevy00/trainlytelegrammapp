import type { HTMLAttributes, ReactElement, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({ children, className = "", ...rest }: CardProps): ReactElement {
  return (
    <div
      className={`rounded-[1.25rem] border border-[color:var(--border-soft)] bg-[var(--bg-card)] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.18)] ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
