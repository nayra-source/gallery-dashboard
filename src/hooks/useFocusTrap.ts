import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook that traps keyboard focus within a container element when active.
 * Cycles Tab/Shift+Tab through focusable elements and prevents focus from
 * escaping the container — essential for accessible modal dialogs.
 *
 * @param isActive  Whether the focus trap is currently active
 * @param onEscape  Optional callback when Escape key is pressed
 * @returns         Ref to attach to the container element
 *
 * Usage:
 *   const trapRef = useFocusTrap(isOpen, () => onClose());
 *   return <div ref={trapRef}>...</div>;
 */
export function useFocusTrap<T extends HTMLElement = HTMLDivElement>(
  isActive: boolean,
  onEscape?: () => void,
) {
  const containerRef = useRef<T>(null);
  const previousActiveElementRef = useRef<Element | null>(null);

  const getFocusableElements = useCallback((): HTMLElement[] => {
    if (!containerRef.current) return [];
    const selectors = [
      'a[href]:not([disabled]):not([tabindex="-1"])',
      'button:not([disabled]):not([tabindex="-1"])',
      'input:not([disabled]):not([tabindex="-1"])',
      'textarea:not([disabled]):not([tabindex="-1"])',
      'select:not([disabled]):not([tabindex="-1"])',
      '[tabindex]:not([tabindex="-1"]):not([disabled])',
    ].join(', ');
    return Array.from(containerRef.current.querySelectorAll<HTMLElement>(selectors));
  }, []);

  useEffect(() => {
    if (!isActive) return;

    // Store the previously focused element to restore on close
    previousActiveElementRef.current = document.activeElement;

    // Focus the first focusable element after a micro-task
    const timer = setTimeout(() => {
      const focusable = getFocusableElements();
      if (focusable.length > 0) {
        focusable[0].focus();
      } else {
        containerRef.current?.focus();
      }
    }, 50);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && onEscape) {
        event.preventDefault();
        onEscape();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusable = getFocusableElements();
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const firstElement = focusable[0];
      const lastElement = focusable[focusable.length - 1];

      if (event.shiftKey) {
        // Shift+Tab: if at first element, wrap to last
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab: if at last element, wrap to first
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', handleKeyDown, true);
      // Restore focus to the previously active element
      if (previousActiveElementRef.current instanceof HTMLElement) {
        previousActiveElementRef.current.focus();
      }
    };
  }, [isActive, onEscape, getFocusableElements]);

  return containerRef;
}
