import { useState, useEffect, useCallback, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
export function useGimbal() {
    const [state, setState] = useState(null);
    const [isRunning, setIsRunning] = useState(true);
    const [fps, setFps] = useState(0);
    const frameCountRef = useRef(0);
    const lastFpsUpdateRef = useRef(performance.now());
    const animationRef = useRef(0);
    const fetchState = useCallback(async () => {
        try {
            const newState = await invoke('read_bus_frame');
            if (newState) {
                setState(newState);
            }
        }
        catch (err) {
            console.error('Failed to read bus frame:', err);
        }
    }, []);
    useEffect(() => {
        let running = true;
        const tick = () => {
            if (!running)
                return;
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
    const setTorque = useCallback(async (az, el, roll) => {
        try {
            await invoke('set_torque', { az, el, roll });
        }
        catch (err) {
            console.error('Failed to set torque:', err);
        }
    }, []);
    const setDisturbance = useCallback(async (params) => {
        try {
            await invoke('set_disturbance', { disturbance: params });
        }
        catch (err) {
            console.error('Failed to set disturbance:', err);
        }
    }, []);
    const resetState = useCallback(async () => {
        try {
            await invoke('reset_state');
        }
        catch (err) {
            console.error('Failed to reset state:', err);
        }
    }, []);
    const startSimulation = useCallback(async () => {
        try {
            await invoke('start_simulation');
            setIsRunning(true);
        }
        catch (err) {
            console.error('Failed to start simulation:', err);
        }
    }, []);
    const stopSimulation = useCallback(async () => {
        try {
            await invoke('stop_simulation');
            setIsRunning(false);
        }
        catch (err) {
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
