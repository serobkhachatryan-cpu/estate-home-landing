'use client';

import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from 'react';

/**
 * Hard navigation link — vinext/Next client transitions are unreliable on the
 * Cloudflare Workers deploy, so always force a full document load.
 */
export function AppLink({
  href,
  className,
  children,
  onClick,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  children?: ReactNode;
}) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (event.defaultPrevented) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (event.button !== 0) return;

    event.preventDefault();
    window.location.assign(href);
  }

  return (
    <a href={href} className={className} {...props} onClick={handleClick}>
      {children}
    </a>
  );
}
