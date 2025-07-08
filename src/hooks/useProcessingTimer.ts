
import { useState, useCallback, useRef } from 'react';

export const useProcessingTimer = () => {
  const [timeElapsed, setTimeElapsed] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const updateElapsedTime = useCallback(() => {
    if (startTimeRef.current) {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setTimeElapsed(elapsed);
    }
  }, []);

  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(updateElapsedTime, 1000);
  }, [updateElapsedTime]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const resetTimer = useCallback(() => {
    stopTimer();
    setTimeElapsed(0);
    startTimeRef.current = 0;
  }, [stopTimer]);

  return {
    timeElapsed,
    startTimer,
    stopTimer,
    resetTimer
  };
};
