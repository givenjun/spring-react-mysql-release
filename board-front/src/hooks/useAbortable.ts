// src/hooks/useAbortable.ts
import { useRef, useCallback } from 'react';

// AbortSignal이 직접 먹히지 않는 API(카카오 Places)용으로 "버전 토큰"을 제공합니다.
export function useAbortable() {
  const verRef = useRef(0);
  const nextVersion = useCallback(() => ++verRef.current, []);
  const isStale = useCallback((v: number) => v !== verRef.current, []);
  return { nextVersion, isStale };
}
