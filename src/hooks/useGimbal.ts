import { useState, useEffect, useCallback, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { GimbalState, DisturbanceParams } from '../types/gimbal';

const MAX_CONSECUTIVE_NAN = 5;

function isStateValid(state: GimbalState | null): boolean {
  if (!state) return false;
  const vals = [
    state.theta_az,
    state.theta_el,
    state.theta_roll,
    state.omega_az,
    state.omega_el,
    state.omega_roll,
  ];
  return vals.every((v) => Number.isFinite(v));
}

function sanitizeState(state: GimbalState | null, fallback: GimbalState | null): GimbalState | null {
  if (!state) return fallback;
  if (isStateValid(state)) return state;

  const clamp = (v: number, min: number, max: number) =>
    Number.isFinite(v) ? Math.min(Math.max(v, min), max) : 0;

  return {
    theta_az: clamp(state.theta_az, -1000, 1000),
    theta_el: clamp(state.theta_el, -1.57, 1.57),
    theta_roll: clamp(state.theta_roll, -1000, 1000),
    omega_az: clamp(state.omega_az, -100, 100),
    omega_el: clamp(state.omega_el, -100, 100),
    omega_roll: clamp(state.omega_roll, -100, 100),
    timestamp_ns: state.timestamp_ns,
  };
}

export function useGimbal() {
  const [state, setState] = useState<GimbalState | null>(null);
  const [isRunning, setIsRunning] = useState(true);
  const [fps, setFps] = useState(0);
  const [recoveryMode, setRecoveryMode] = useState(false);

  const frameCountRef = useRef(0);
  const lastFpsUpdateRef = useRef(performance.now());
  const animationRef = useRef<number>(0);
  const consecutiveNanRef = useRef(0);
  const lastValidStateRef = useRef<GimbalState | null>(null);
  const recoveryTriggeredRef = useRef(false);

  const requestRecoveryReset = useCallback(async () => {
    if (recoveryTriggeredRef.current) return;
    recoveryTriggeredRef.current = true;
    setRecoveryMode(true);

    try {
      await invoke('reset_state');
      consecutiveNanRef.current = 0;
      recoveryTriggeredRef.current = false;
      setTimeout(() => setRecoveryMode(false), 500);
    } catch (err) {
      console.error('Recovery reset failed:', err);
      recoveryTriggeredRef.current = false;
    }
  }, []);

  const fetchState = useCallback(async () => {
    try {
      const newState = await invoke<GimbalState | null>('read_bus_frame');
      const sanitized = sanitizeState(newState, lastValidStateRef.current);

      if (sanitized && isStateValid(sanitized)) {
        lastValidStateRef.current = sanitized;
        consecutiveNanRef.current = 0;
        setState(sanitized);
      } else {
        consecutiveNanRef.current++;
        if (consecutiveNanRef.current >= MAX_CONSECUTIVE_NAN) {
          console.warn(
            `Detected ${consecutiveNanRef.current} consecutive invalid frames, triggering recovery`
          );
          requestRecoveryReset();
        }
        if (lastValidStateRef.current) {
          setState(lastValidStateRef.current);
        }
      }
    } catch (err) {
      console.error('Failed to read bus frame:', err);
      consecutiveNanRef.current++;
      if (consecutiveNanRef.current >= MAX_CONSECUTIVE_NAN * 2) {
        requestRecoveryReset();
      }
    }
  }, [requestRecoveryReset]);

  useEffect(() => {
    let running = true;

    const tick = () => {
      if (!running) return;

      frameCountRef.current++;
      const now = performance.now();
      if (now - lastFpsUpdateRef.current >= 1000) {
        setFps(frameCountRef.current);
        frameCountRef.current = 0;
        lastFpsUpdateRef.current = now;
      }

      fetchState();
      animationRef.current = requestAnimationFrame(tick);
    };

    animationRef.current = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(animationRef.current);
    };
  }, [fetchState]);

  const setTorque = useCallback(async (az: number, el: number, roll: number) => {
    try {
      await invoke('set_torque', { az, el, roll });
    } catch (err) {
      console.error('Failed to set torque:', err);
    }
  }, []);

  const setDisturbance = useCallback(async (params: DisturbanceParams) => {
    try {
      await invoke('set_disturbance', { disturbance: params });
    } catch (err) {
      console.error('Failed to set disturbance:', err);
    }
  }, []);

  const resetState = useCallback(async () => {
    try {
      await invoke('reset_state');
      consecutiveNanRef.current = 0;
      lastValidStateRef.current = null;
    } catch (err) {
      console.error('Failed to reset state:', err);
    }
  }, []);

  const startSimulation = useCallback(async () => {
    try {
      await invoke('start_simulation');
      setIsRunning(true);
      consecutiveNanRef.current = 0;
    } catch (err) {
      console.error('Failed to start simulation:', err);
    }
  }, []);

  const stopSimulation = useCallback(async () => {
    try {
      await invoke('stop_simulation');
      setIsRunning(false);
    } catch (err) {
      console.error('Failed to stop simulation:', err);
    }
  }, []);

  return {
    state,
    isRunning,
    fps,
    recoveryMode,
    setTorque,
    setDisturbance,
    resetState,
    startSimulation,
    stopSimulation,
  };
}
