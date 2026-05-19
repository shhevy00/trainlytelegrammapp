import type { ReactElement, SVGProps } from "react";

/** Декоративная иконка: скрыта от screen readers, не в tab order. */
export function DecorativeSvg(props: SVGProps<SVGSVGElement>): ReactElement {
  const { children, ...rest } = props;
  return (
    <svg
      role="presentation"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}
