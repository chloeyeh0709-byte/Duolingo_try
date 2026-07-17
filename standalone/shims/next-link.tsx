import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from "react";
import { navigate } from "../nav";

interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  href: string;
  children?: ReactNode;
}

/** Drop-in replacement for next/link's <Link> in the standalone (non-Next) build. */
export default function Link({ href, onClick, children, ...rest }: LinkProps) {
  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented) return;
    e.preventDefault();
    navigate(href);
  };

  return (
    <a href={`#${href}`} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}
