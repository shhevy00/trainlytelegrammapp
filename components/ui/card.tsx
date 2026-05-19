import type { HTMLAttributes, ReactElement, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({ children, className = "", ...rest }: CardProps): ReactElement {
  return (
    <div className={`app-surface-card p-4 ${className}`} {...rest}>
      {children}
    </div>
  );
}
