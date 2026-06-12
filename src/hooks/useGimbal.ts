import { useState, useEffect, useCallback, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import type { GimbalState, DisturbanceParams } from '../types/gimbal';

export function useGimbal() {
  const [state, setState] = useState<GimbalState | null>(null);
  const [isRunning, setIsRunning] = useState(true);
  const [fps, setFps] = useState(0);
  const frameCountRef = useRef(0);
  const lastFpsUpdateRef = useRef(performance.now());
  const animationRef = useRef<number>(0);

  const fetchState = useCallback(async () => {
    try {
      const newState = await invoke<GimbalState | null>('read_bus_frame');
      if (newState) {
        setState(newState);
      }
    } catch (err) {
      console.error('Failed to read bus frame:', err);
    }
  }, []);

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
    } catch (err) {
      console.error('Failed to reset state:', err);
    }
  }, []);

  const startSimulation = useCallback(async () => {
    try {
      await invoke('start_simulation');
      setIsRunning(true);
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
    setTorque,
    setDisturbance,
    resetState,
    startSimulation,
    stopSimulation,
  };
}
