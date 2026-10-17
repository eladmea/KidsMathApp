import { useCallback, useEffect, useRef, useState } from 'react';

export const IDLE_HINT_MS = 5000;

// Shows a reminder when a child hasn't made progress for a while.
// `key` names the current task (changing it restarts the wait);
// call poke() whenever the child does something useful. After `delay` ms
// without a poke, `showing` becomes true and onIdle() runs once (e.g. to say
// the instruction again). A poke hides the reminder and restarts the wait.
export function useIdleHint(key, { delay = IDLE_HINT_MS, onIdle, enabled = true } = {}) {
  const [showing, setShowing] = useState(false);
  const [round, setRound] = useState(0);
  const onIdleRef = useRef(onIdle);
  onIdleRef.current = onIdle;

  useEffect(() => {
    setShowing(false);
    if (!enabled) return undefined;
    const timer = setTimeout(() => {
      setShowing(true);
      if (onIdleRef.current) onIdleRef.current();
    }, delay);
    return () => clearTimeout(timer);
  }, [key, round, delay, enabled]);

  const poke = useCallback(() => {
    setShowing(false);
    setRound((r) => r + 1);
  }, []);

  return { showing, poke };
}
