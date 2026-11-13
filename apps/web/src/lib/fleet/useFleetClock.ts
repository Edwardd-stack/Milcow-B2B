'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { kst, koreaDate, WORK_END_H, WORK_START_H } from './fleet-sim';

export type ClockMode = 'live' | 'timelapse';
/** Time-lapse: the whole working day (08:00–19:00) in this many real seconds */
const TIMELAPSE_SECONDS = 60;

/**
 * The simulation clock. `now()` is cheap and is read every animation frame;
 * in time-lapse mode today's working day plays in a loop.
 */
export function useFleetClock() {
  const [mode, setMode] = useState<ClockMode>('live');
  const startedRef = useRef(0);

  useEffect(() => {
    startedRef.current = Date.now();
  }, [mode]);

  const now = useCallback((): number => {
    const real = Date.now();
    if (mode === 'live') return real;
    const day = koreaDate(real);
    const span = (WORK_END_H - WORK_START_H) * 3_600_000;
    const share = ((real - startedRef.current) / (TIMELAPSE_SECONDS * 1000)) % 1;
    return kst(day, WORK_START_H) + share * span;
  }, [mode]);

  return { mode, setMode, now };
}
