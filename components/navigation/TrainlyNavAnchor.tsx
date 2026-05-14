import type { AnchorHTMLAttributes, ReactElement, ReactNode } from "react";

/**
 * Внутренняя навигация без `next/link`: полный переход по `href` (устойчиво при сбое клиентского роутера).
 */
export function TrainlyNavAnchor({
  href,
  className = "",
  children,
  ...rest
}: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
  children: ReactNode;
}): ReactElement {
  return (
    <a href={href} className={className} {...rest}>
      {children}
    </a>
  );
}
