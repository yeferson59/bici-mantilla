import { render, type ComponentChildren } from 'preact';
import { useLayoutEffect, useState } from 'preact/hooks';

/**
 * Renders its children at the end of <body>, outside the component's own DOM.
 * Minimal replacement for `createPortal`, which only exists in preact/compat.
 * Client-only: mount it after hydration.
 */
export default function Portal({ children }: { children: ComponentChildren }) {
  const [host] = useState(() => document.createElement('div'));

  useLayoutEffect(() => {
    document.body.appendChild(host);
    return () => {
      render(null, host);
      host.remove();
    };
  }, [host]);

  // Re-render on every update of the parent so the portal content stays in sync.
  useLayoutEffect(() => {
    render(children, host);
  });

  return null;
}
