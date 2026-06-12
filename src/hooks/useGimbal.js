import { useState, useEffect, useCallback, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
const MAX_CONSECUTIVE_NAN = 5;
function isStateValid(state) {
    if (!state)
        return false;
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
function sanitizeState(state, fallback) {
    if (!state)
        return fallback;
    if (isStateValid(state))
        return state;
    const clamp = (v, min, max) => Number.isFinite(v) ? Math.min(Math.max(v, min), max) : 0;
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
    const [state, setState] = useState(null);
    const [isRunning, setIsRunning] = useState(true);
    const [fps, setFps] = useState(0);
    const [recoveryMode, setRecoveryMode] = useState(false);
    const [frictionDiagnostics, setFrictionDiagnostics] = useState(null);
    const [lugreEnabled, setLugreEnabledState] = useState(true);
    const [feedforwardEnabled, setFeedforwardEnabledState] = useState(true);
    const frameCountRef = useRef(0);
    const lastFpsUpdateRef = useRef(performance.now());
    const animationRef = useRef(0);
    const consecutiveNanRef = useRef(0);
    const lastValidStateRef = useRef(null);
    const recoveryTriggeredRef = useRef(false);
    const diagFetchCounterRef = useRef(0);
    const requestRecoveryReset = useCallback(async () => {
        if (recoveryTriggeredRef.current)
            return;
        recoveryTriggeredRef.current = true;
        setRecoveryMode(true);
        try {
            await invoke('reset_state');
            consecutiveNanRef.current = 0;
            recoveryTriggeredRef.current = false;
            setTimeout(() => setRecoveryMode(false), 500);
        }
        catch (err) {
            console.error('Recovery reset failed:', err);
            recoveryTriggeredRef.current = false;
        }
    }, []);
    const fetchState = useCallback(async () => {
        try {
            const newState = await invoke('read_bus_frame');
            const sanitized = sanitizeState(newState, lastValidStateRef.current);
            if (sanitized && isStateValid(sanitized)) {
                lastValidStateRef.current = sanitized;
                consecutiveNanRef.current = 0;
                setState(sanitized);
            }
            else {
                consecutiveNanRef.current++;
                if (consecutiveNanRef.current >= MAX_CONSECUTIVE_NAN) {
                    console.warn(`Detected ${consecutiveNanRef.current} consecutive invalid frames, triggering recovery`);
                    requestRecoveryReset();
                }
                if (lastValidStateRef.current) {
                    setState(lastValidStateRef.current);
                }
            }
            diagFetchCounterRef.current++;
            if (diagFetchCounterRef.current >= 5) {
                diagFetchCounterRef.current = 0;
                try {
                    const diag = await invoke('get_friction_diagnostics');
                    if (Array.isArray(diag) && diag.length === 3) {
                        setFrictionDiagnostics(diag);
                    }
                }
                catch (e) {
                    // 静默忽略诊断获取失败
                }
            }
        }
        catch (err) {
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
            consecutiveNanRef.current = 0;
            lastValidStateRef.current = null;
        }
        catch (err) {
            console.error('Failed to reset state:', err);
        }
    }, []);
    const startSimulation = useCallback(async () => {
        try {
            await invoke('start_simulation');
            setIsRunning(true);
            consecutiveNanRef.current = 0;
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
    const setLugreEnabled = useCallback(async (enabled) => {
        try {
            await invoke('set_lugre_enabled', { enabled });
            setLugreEnabledState(enabled);
        }
        catch (err) {
            console.error('Failed to set lugre enabled:', err);
        }
    }, []);
    const setFeedforwardEnabled = useCallback(async (enabled) => {
        try {
            await invoke('set_feedforward_enabled', { enabled });
            setFeedforwardEnabledState(enabled);
        }
        catch (err) {
            console.error('Failed to set feedforward enabled:', err);
        }
    }, []);
    const setLugreParamsAz = useCallback(async (params) => {
        try {
            await invoke('set_lugre_params_az', { params });
        }
        catch (err) {
            console.error('Failed to set lugre params az:', err);
        }
    }, []);
    const setLugreParamsEl = useCallback(async (params) => {
        try {
            await invoke('set_lugre_params_el', { params });
        }
        catch (err) {
            console.error('Failed to set lugre params el:', err);
        }
    }, []);
    const setLugreParamsRoll = useCallback(async (params) => {
        try {
            await invoke('set_lugre_params_roll', { params });
        }
        catch (err) {
            console.error('Failed to set lugre params roll:', err);
        }
    }, []);
    const setFeedforwardGain = useCallback(async (az, el, roll) => {
        try {
            await invoke('set_feedforward_gain', { az, el, roll });
        }
        catch (err) {
            console.error('Failed to set feedforward gain:', err);
        }
    }, []);
    return {
        state,
        isRunning,
        fps,
        recoveryMode,
        frictionDiagnostics,
        lugreEnabled,
        feedforwardEnabled,
        setTorque,
        setDisturbance,
        resetState,
        startSimulation,
        stopSimulation,
        setLugreEnabled,
        setFeedforwardEnabled,
        setLugreParamsAz,
        setLugreParamsEl,
        setLugreParamsRoll,
        setFeedforwardGain,
    };
}
