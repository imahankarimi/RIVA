/**
 * RIVA DESIGN SYSTEM — Liquid Lens pointer tracker
 * ===========================================================================
 * Tracks pointer position on `.glass-lens` elements and updates CSS custom
 * properties (--lens-x, --lens-y) to drive the radial gradient highlight.
 *
 * Adapted from the liquid-glass reference repository but integrated into
 * RIVA's architecture:
 *   - Uses requestAnimationFrame for performance
 *   - Cleans up on pointer leave and window blur
 *   - Returns cleanup function for proper unmounting
 *   - Restrained effect tuned for RIVA's aesthetic
 *
 * USAGE
 * -----
 * Call once on app mount (e.g., in root layout useEffect):
 *
 *   import { installLiquidLens } from '@/lib/motion/liquidLens';
 *
 *   useEffect(() => {
 *     const cleanup = installLiquidLens();
 *     return cleanup;
 *   }, []);
 *
 * Then add `glass-lens` class to interactive glass elements (navigation items,
 * glass buttons). The utility automatically tracks pointer position and updates
 * the element's CSS custom properties.
 */

export function installLiquidLens(): () => void {
  let active: HTMLElement | null = null;
  let frame = 0;

  const clear = (el: HTMLElement | null): void => {
    if (!el) return;
    el.classList.remove('is-lens-active');
    el.style.removeProperty('--lens-x');
    el.style.removeProperty('--lens-y');
  };

  const onPointerMove = (event: PointerEvent): void => {
    if (frame) return;
    frame = window.requestAnimationFrame(() => {
      frame = 0;
      const next = (event.target as Element | null)?.closest?.(
        '.glass-lens'
      ) as HTMLElement | null;

      if (active && active !== next) {
        clear(active);
      }
      active = next;
      if (!next) return;

      const rect = next.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;

      next.style.setProperty(
        '--lens-x',
        `${Math.min(100, Math.max(0, x)).toFixed(2)}%`
      );
      next.style.setProperty(
        '--lens-y',
        `${Math.min(100, Math.max(0, y)).toFixed(2)}%`
      );
      next.classList.add('is-lens-active');
    });
  };

  const onPointerLeave = (): void => {
    clear(active);
    active = null;
  };

  document.addEventListener('pointermove', onPointerMove, { passive: true });
  document.addEventListener('pointerleave', onPointerLeave);
  window.addEventListener('blur', onPointerLeave);

  return () => {
    if (frame) window.cancelAnimationFrame(frame);
    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerleave', onPointerLeave);
    window.removeEventListener('blur', onPointerLeave);
    clear(active);
    active = null;
  };
}
