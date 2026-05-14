  import { useEffect, useRef } from 'react';

const COOLDOWN_MS = 150;

export const useGamepad = () => {
  const lastInputTime = useRef<number>(0);
  const requestRef = useRef<number>(0);

  useEffect(() => {
    const pollGamepads = () => {
      const gamepads = navigator.getGamepads();
      if (!gamepads) return;

      for (let i = 0; i < gamepads.length; i++) {
        const gp = gamepads[i];
        if (!gp) continue;

        const now = Date.now();
        if (now - lastInputTime.current < COOLDOWN_MS) continue;

        let inputDetected = false;
        let eventToDispatch: KeyboardEvent | null = null;

        // D-Pad Up / Left Stick Up
        if (gp.buttons[12]?.pressed || gp.axes[1] < -0.5) {
          eventToDispatch = new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true });
          inputDetected = true;
        }
        // D-Pad Down / Left Stick Down
        else if (gp.buttons[13]?.pressed || gp.axes[1] > 0.5) {
          eventToDispatch = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true });
          inputDetected = true;
        }
        // D-Pad Left / Left Stick Left
        else if (gp.buttons[14]?.pressed || gp.axes[0] < -0.5) {
          eventToDispatch = new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true });
          inputDetected = true;
        }
        // D-Pad Right / Left Stick Right
        else if (gp.buttons[15]?.pressed || gp.axes[0] > 0.5) {
          eventToDispatch = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true });
          inputDetected = true;
        }
        // Button 0 (A / Cross)
        else if (gp.buttons[0]?.pressed) {
          eventToDispatch = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
          inputDetected = true;
        }
        // Button 1 (B / Circle)
        else if (gp.buttons[1]?.pressed) {
          eventToDispatch = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
          inputDetected = true;
        }
        // Button 4 (L1) -> Custom event 'L1'
        else if (gp.buttons[4]?.pressed) {
          eventToDispatch = new KeyboardEvent('keydown', { key: 'GamepadL1', bubbles: true });
          inputDetected = true;
        }
        // Button 5 (R1) -> Custom event 'R1'
        else if (gp.buttons[5]?.pressed) {
          eventToDispatch = new KeyboardEvent('keydown', { key: 'GamepadR1', bubbles: true });
          inputDetected = true;
        }

        if (inputDetected && eventToDispatch) {
          // If no element is focused, focus the document body or first focusable element
          if (document.activeElement === document.body || !document.activeElement) {
            const firstFocusable = document.querySelector('[tabindex="0"]') as HTMLElement;
            if (firstFocusable) {
              firstFocusable.focus();
            } else {
              document.dispatchEvent(eventToDispatch);
            }
          } else {
            // If something is focused, try native arrow key navigation via DOM (simulated)
            // Actually, just dispatching standard KeyboardEvent often doesn't change focus automatically.
            // We need to implement spatial navigation or let custom handlers deal with it.
            // For now, we dispatch the event and let App.tsx or focused elements handle it.
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(eventToDispatch.key)) {
               handleSpatialNavigation(eventToDispatch.key);
            } else {
               document.activeElement.dispatchEvent(eventToDispatch);
            }
          }
          lastInputTime.current = now;
        }
      }

      requestRef.current = requestAnimationFrame(pollGamepads);
    };

    requestRef.current = requestAnimationFrame(pollGamepads);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);
};

// Simple spatial navigation helper
function handleSpatialNavigation(key: string) {
  const focusableEls = Array.from(document.querySelectorAll('[tabindex="0"], button, a, input, select, textarea')).filter(el => {
    const rect = (el as HTMLElement).getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && window.getComputedStyle(el).visibility !== 'hidden';
  }) as HTMLElement[];

  if (focusableEls.length === 0) return;

  const currentFocus = document.activeElement as HTMLElement;
  if (!currentFocus || !focusableEls.includes(currentFocus)) {
    focusableEls[0].focus();
    return;
  }

  const currentRect = currentFocus.getBoundingClientRect();
  let bestCandidate: HTMLElement | null = null;
  let minDistance = Infinity;

  focusableEls.forEach(el => {
    if (el === currentFocus) return;
    const rect = el.getBoundingClientRect();
    let isCandidate = false;
    let distance = Infinity;

    if (key === 'ArrowUp' && rect.bottom <= currentRect.top + 10) {
      isCandidate = true;
      distance = Math.pow(rect.left - currentRect.left, 2) + Math.pow(rect.bottom - currentRect.top, 2);
    } else if (key === 'ArrowDown' && rect.top >= currentRect.bottom - 10) {
      isCandidate = true;
      distance = Math.pow(rect.left - currentRect.left, 2) + Math.pow(rect.top - currentRect.bottom, 2);
    } else if (key === 'ArrowLeft' && rect.right <= currentRect.left + 10) {
      isCandidate = true;
      distance = Math.pow(rect.right - currentRect.left, 2) + Math.pow(rect.top - currentRect.top, 2);
    } else if (key === 'ArrowRight' && rect.left >= currentRect.right - 10) {
      isCandidate = true;
      distance = Math.pow(rect.left - currentRect.right, 2) + Math.pow(rect.top - currentRect.top, 2);
    }

    if (isCandidate && distance < minDistance) {
      minDistance = distance;
      bestCandidate = el;
    }
  });

  if (bestCandidate) {
    (bestCandidate as HTMLElement).focus();
  } else {
    // Dispatch event to active element anyway
    currentFocus.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
  }
}
