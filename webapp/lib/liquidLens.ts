/**
 * Liquid Glass Lens — pointer-tracked radial highlight for `.glass-lens` elements.
 * Adapted from the liquid-glass reference implementation for RIVA.
 *
 * Usage:
 * 1. Add `glass-lens` class to interactive elements
 * 2. Call `installLiquidLens()` once at app initialization
 * 3. The lens tracks mouse position and creates a radial gradient highlight
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
      const next = (event.target as Element | null)?.closest?.('.glass-lens') as HTMLElement | null;

      if (active && active !== next) {
        clear(active);
      }

      active = next;
      if (!next) return;

      const rect = next.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;

      next.style.setProperty('--lens-x', `${Math.min(100, Math.max(0, x)).toFixed(2)}%`);
      next.style.setProperty('--lens-y', `${Math.min(100, Math.max(0, y)).toFixed(2)}%`);
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
