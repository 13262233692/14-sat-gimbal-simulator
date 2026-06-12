import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
const defaultDisturbance = {
    wind_force_x: 0,
    wind_force_y: 0,
    wind_force_z: 0,
    wind_gain: 1.0,
    enable_wind: false,
    noise_amplitude: 0.02,
    enable_noise: true,
};
export default function ControlPanel({ state, isRunning, frictionDiagnostics, lugreEnabled, feedforwardEnabled, onSetTorque, onSetDisturbance, onReset, onStart, onStop, onSetLugreEnabled, onSetFeedforwardEnabled, onSetLugreParamsAz, onSetLugreParamsEl, onSetLugreParamsRoll, onSetFeedforwardGain, }) {
    const [torqueAz, setTorqueAz] = useState(0);
    const [torqueEl, setTorqueEl] = useState(0);
    const [torqueRoll, setTorqueRoll] = useState(0);
    const [disturbance, setDisturbance] = useState(defaultDisturbance);
    const [selectedAxis, setSelectedAxis] = useState(0);
    const [ffGainAz, setFfGainAz] = useState(1.8);
    const [ffGainEl, setFfGainEl] = useState(1.8);
    const [ffGainRoll, setFfGainRoll] = useState(1.5);
    const axisNames = ['方位轴', '俯仰轴', '滚转轴'];
    const defaultLuGreAz = {
        sigma0: 80000, sigma1: 280, sigma2: 0.45,
        fc: 0.35, fs: 0.65, vs: 0.01,
        preload: 0, stiction_force: 0.85,
    };
    const defaultLuGreEl = {
        sigma0: 90000, sigma1: 310, sigma2: 0.32,
        fc: 0.25, fs: 0.48, vs: 0.008,
        preload: 0, stiction_force: 0.6,
    };
    const defaultLuGreRoll = {
        sigma0: 100000, sigma1: 200, sigma2: 0.12,
        fc: 0.08, fs: 0.15, vs: 0.005,
        preload: 0, stiction_force: 0.2,
    };
    const [lugreParams, setLugreParams] = useState([
        defaultLuGreAz, defaultLuGreEl, defaultLuGreRoll,
    ]);
    useEffect(() => {
        onSetTorque(torqueAz, torqueEl, torqueRoll);
    }, [torqueAz, torqueEl, torqueRoll, onSetTorque]);
    useEffect(() => {
        onSetDisturbance(disturbance);
    }, [disturbance, onSetDisturbance]);
    const radToDeg = (rad) => (rad * 180 / Math.PI).toFixed(1);
    const toggleWind = () => {
        setDisturbance(prev => ({ ...prev, enable_wind: !prev.enable_wind }));
    };
    const toggleNoise = () => {
        setDisturbance(prev => ({ ...prev, enable_noise: !prev.enable_noise }));
    };
    const toggleLugre = () => {
        onSetLugreEnabled(!lugreEnabled);
    };
    const toggleFeedforward = () => {
        onSetFeedforwardEnabled(!feedforwardEnabled);
    };
    const updateLugreParam = (key, value) => {
        setLugreParams(prev => {
            const newParams = [...prev];
            newParams[selectedAxis] = { ...newParams[selectedAxis], [key]: value };
            return newParams;
        });
    };
    useEffect(() => {
        const handlers = [onSetLugreParamsAz, onSetLugreParamsEl, onSetLugreParamsRoll];
        handlers[selectedAxis](lugreParams[selectedAxis]);
    }, [lugreParams, selectedAxis, onSetLugreParamsAz, onSetLugreParamsEl, onSetLugreParamsRoll]);
    useEffect(() => {
        onSetFeedforwardGain(ffGainAz, ffGainEl, ffGainRoll);
    }, [ffGainAz, ffGainEl, ffGainRoll, onSetFeedforwardGain]);
    const phaseLabel = (phase) => {
        switch (phase) {
            case 'Sticking': return '粘附';
            case 'Preslip': return '预滑';
            case 'Sliding': return '滑动';
            case 'Reversing': return '换向';
            default: return phase;
        }
    };
    return (_jsxs("div", { className: "control-panel", children: [_jsxs("div", { className: "panel-section", children: [_jsx("h3", { children: "\u7CFB\u7EDF\u72B6\u6001" }), _jsxs("div", { className: "state-display", children: [_jsxs("div", { className: "state-item", children: [_jsx("div", { className: "label", children: "\u65B9\u4F4D\u89D2" }), _jsxs("div", { className: "value", children: [state ? radToDeg(state.theta_az) : '0.0', "\u00B0"] })] }), _jsxs("div", { className: "state-item", children: [_jsx("div", { className: "label", children: "\u4FEF\u4EF0\u89D2" }), _jsxs("div", { className: "value", children: [state ? radToDeg(state.theta_el) : '0.0', "\u00B0"] })] }), _jsxs("div", { className: "state-item", children: [_jsx("div", { className: "label", children: "\u6EDA\u8F6C\u89D2" }), _jsxs("div", { className: "value", children: [state ? radToDeg(state.theta_roll) : '0.0', "\u00B0"] })] }), _jsxs("div", { className: "state-item", children: [_jsx("div", { className: "label", children: "\u65F6\u95F4\u6233" }), _jsxs("div", { className: "value", children: [state ? (state.timestamp_ns / 1e9).toFixed(3) : '0.000', "s"] })] })] })] }), _jsxs("div", { className: "panel-section", children: [_jsx("h3", { children: "\u8FD0\u884C\u63A7\u5236" }), _jsxs("div", { className: "button-row", children: [_jsx("button", { className: `btn ${isRunning ? 'btn-danger' : 'btn-primary'}`, onClick: isRunning ? onStop : onStart, children: isRunning ? '停止仿真' : '启动仿真' }), _jsx("button", { className: "btn btn-secondary", onClick: onReset, children: "\u590D\u4F4D" })] })] }), _jsxs("div", { className: "panel-section", children: [_jsx("h3", { children: "\u8F6C\u77E9\u63A7\u5236" }), _jsxs("div", { className: "control-group", children: [_jsxs("div", { className: "control-label", children: [_jsx("span", { children: "\u65B9\u4F4D\u8F74\u8F6C\u77E9" }), _jsxs("span", { className: "control-value", children: [torqueAz.toFixed(1), " N\u00B7m"] })] }), _jsx("input", { type: "range", className: "slider", min: "-120", max: "120", step: "1", value: torqueAz, onChange: (e) => setTorqueAz(parseFloat(e.target.value)) })] }), _jsxs("div", { className: "control-group", children: [_jsxs("div", { className: "control-label", children: [_jsx("span", { children: "\u4FEF\u4EF0\u8F74\u8F6C\u77E9" }), _jsxs("span", { className: "control-value", children: [torqueEl.toFixed(1), " N\u00B7m"] })] }), _jsx("input", { type: "range", className: "slider", min: "-85", max: "85", step: "1", value: torqueEl, onChange: (e) => setTorqueEl(parseFloat(e.target.value)) })] }), _jsxs("div", { className: "control-group", children: [_jsxs("div", { className: "control-label", children: [_jsx("span", { children: "\u6EDA\u8F6C\u8F74\u8F6C\u77E9" }), _jsxs("span", { className: "control-value", children: [torqueRoll.toFixed(1), " N\u00B7m"] })] }), _jsx("input", { type: "range", className: "slider", min: "-25", max: "25", step: "0.5", value: torqueRoll, onChange: (e) => setTorqueRoll(parseFloat(e.target.value)) })] })] }), _jsxs("div", { className: "panel-section", children: [_jsx("h3", { children: "\u6270\u52A8\u53C2\u6570" }), _jsxs("div", { className: "toggle-row", children: [_jsx("span", { className: "toggle-label", children: "\u98CE\u8F7D\u5E72\u6270" }), _jsx("div", { className: `toggle-switch ${disturbance.enable_wind ? 'active' : ''}`, onClick: toggleWind })] }), disturbance.enable_wind && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "control-group", children: [_jsxs("div", { className: "control-label", children: [_jsx("span", { children: "\u98CE\u529B X" }), _jsxs("span", { className: "control-value", children: [disturbance.wind_force_x.toFixed(1), " N"] })] }), _jsx("input", { type: "range", className: "slider", min: "-50", max: "50", step: "1", value: disturbance.wind_force_x, onChange: (e) => setDisturbance(prev => ({
                                            ...prev,
                                            wind_force_x: parseFloat(e.target.value)
                                        })) })] }), _jsxs("div", { className: "control-group", children: [_jsxs("div", { className: "control-label", children: [_jsx("span", { children: "\u98CE\u529B Y" }), _jsxs("span", { className: "control-value", children: [disturbance.wind_force_y.toFixed(1), " N"] })] }), _jsx("input", { type: "range", className: "slider", min: "-50", max: "50", step: "1", value: disturbance.wind_force_y, onChange: (e) => setDisturbance(prev => ({
                                            ...prev,
                                            wind_force_y: parseFloat(e.target.value)
                                        })) })] }), _jsxs("div", { className: "control-group", children: [_jsxs("div", { className: "control-label", children: [_jsx("span", { children: "\u98CE\u529B Z" }), _jsxs("span", { className: "control-value", children: [disturbance.wind_force_z.toFixed(1), " N"] })] }), _jsx("input", { type: "range", className: "slider", min: "-50", max: "50", step: "1", value: disturbance.wind_force_z, onChange: (e) => setDisturbance(prev => ({
                                            ...prev,
                                            wind_force_z: parseFloat(e.target.value)
                                        })) })] }), _jsxs("div", { className: "control-group", children: [_jsxs("div", { className: "control-label", children: [_jsx("span", { children: "\u98CE\u8F7D\u589E\u76CA" }), _jsxs("span", { className: "control-value", children: [disturbance.wind_gain.toFixed(2), "x"] })] }), _jsx("input", { type: "range", className: "slider", min: "0", max: "5", step: "0.1", value: disturbance.wind_gain, onChange: (e) => setDisturbance(prev => ({
                                            ...prev,
                                            wind_gain: parseFloat(e.target.value)
                                        })) })] })] })), _jsxs("div", { className: "toggle-row", children: [_jsx("span", { className: "toggle-label", children: "\u6D4B\u91CF\u566A\u58F0" }), _jsx("div", { className: `toggle-switch ${disturbance.enable_noise ? 'active' : ''}`, onClick: toggleNoise })] }), disturbance.enable_noise && (_jsxs("div", { className: "control-group", children: [_jsxs("div", { className: "control-label", children: [_jsx("span", { children: "\u566A\u58F0\u5E45\u503C" }), _jsx("span", { className: "control-value", children: disturbance.noise_amplitude.toFixed(3) })] }), _jsx("input", { type: "range", className: "slider", min: "0", max: "0.5", step: "0.01", value: disturbance.noise_amplitude, onChange: (e) => setDisturbance(prev => ({
                                    ...prev,
                                    noise_amplitude: parseFloat(e.target.value)
                                })) })] }))] }), _jsxs("div", { className: "panel-section", children: [_jsx("h3", { children: "\u5FEB\u6377\u8F6C\u77E9" }), _jsxs("div", { className: "button-row", children: [_jsx("button", { className: "btn btn-secondary", onClick: () => {
                                    setTorqueAz(50);
                                    setTorqueEl(0);
                                    setTorqueRoll(0);
                                }, children: "\u65B9\u4F4D +" }), _jsx("button", { className: "btn btn-secondary", onClick: () => {
                                    setTorqueAz(-50);
                                    setTorqueEl(0);
                                    setTorqueRoll(0);
                                }, children: "\u65B9\u4F4D -" })] }), _jsx("div", { className: "button-row", style: { marginTop: '8px' }, children: _jsx("button", { className: "btn btn-secondary", onClick: () => {
                                setTorqueAz(0);
                                setTorqueEl(0);
                                setTorqueRoll(0);
                            }, children: "\u5168\u90E8\u5F52\u96F6" }) })] }), _jsxs("div", { className: "panel-section", children: [_jsx("h3", { children: "\u6469\u64E6\u8BCA\u65AD" }), axisNames.map((name, i) => (_jsxs("div", { className: "state-display", style: { marginBottom: '8px' }, children: [_jsxs("div", { className: "state-item", style: { flex: 1 }, children: [_jsxs("div", { className: "label", children: [name, "\u6469\u64E6"] }), _jsxs("div", { className: "value", children: [frictionDiagnostics ? frictionDiagnostics[i].friction_torque.toFixed(4) : '0.0000', " N\u00B7m"] })] }), _jsxs("div", { className: "state-item", style: { flex: 1 }, children: [_jsx("div", { className: "label", children: "\u524D\u9988" }), _jsxs("div", { className: "value", style: { color: frictionDiagnostics?.[i]?.ff_active ? '#5b9dff' : '#666' }, children: [frictionDiagnostics ? frictionDiagnostics[i].feedforward_torque.toFixed(4) : '0.0000', " N\u00B7m"] })] }), _jsxs("div", { className: "state-item", style: { flex: 1 }, children: [_jsx("div", { className: "label", children: "\u72B6\u6001" }), _jsxs("div", { className: "value", style: { fontSize: '11px' }, children: [frictionDiagnostics ? phaseLabel(frictionDiagnostics[i].stick_slip_phase) : '-', frictionDiagnostics?.[i]?.zero_crossing_detected && _jsx("span", { style: { color: '#ff6b9d' }, children: " \u26A1" })] })] })] }, name)))] }), _jsxs("div", { className: "panel-section", children: [_jsx("h3", { children: "LuGre \u6469\u64E6\u6A21\u578B" }), _jsxs("div", { className: "toggle-row", children: [_jsx("span", { className: "toggle-label", children: "\u542F\u7528 LuGre \u6469\u64E6" }), _jsx("div", { className: `toggle-switch ${lugreEnabled ? 'active' : ''}`, onClick: toggleLugre })] }), _jsxs("div", { className: "toggle-row", children: [_jsx("span", { className: "toggle-label", children: "\u524D\u9988\u8865\u507F" }), _jsx("div", { className: `toggle-switch ${feedforwardEnabled ? 'active' : ''}`, onClick: toggleFeedforward })] }), _jsx("div", { className: "axis-tabs", style: { display: 'flex', margin: '12px 0', gap: '4px' }, children: axisNames.map((name, i) => (_jsx("button", { className: `btn ${selectedAxis === i ? 'btn-primary' : 'btn-secondary'}`, style: { flex: 1, fontSize: '12px', padding: '6px 8px' }, onClick: () => setSelectedAxis(i), children: name }, name))) }), lugreEnabled && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "control-group", children: [_jsxs("div", { className: "control-label", children: [_jsx("span", { children: "\u521A\u6BDB\u521A\u5EA6 \u03C3\u2080" }), _jsx("span", { className: "control-value", children: lugreParams[selectedAxis].sigma0.toFixed(0) })] }), _jsx("input", { type: "range", className: "slider", min: "1000", max: "200000", step: "1000", value: lugreParams[selectedAxis].sigma0, onChange: (e) => updateLugreParam('sigma0', parseFloat(e.target.value)) })] }), _jsxs("div", { className: "control-group", children: [_jsxs("div", { className: "control-label", children: [_jsx("span", { children: "\u521A\u6BDB\u963B\u5C3C \u03C3\u2081" }), _jsx("span", { className: "control-value", children: lugreParams[selectedAxis].sigma1.toFixed(1) })] }), _jsx("input", { type: "range", className: "slider", min: "10", max: "800", step: "5", value: lugreParams[selectedAxis].sigma1, onChange: (e) => updateLugreParam('sigma1', parseFloat(e.target.value)) })] }), _jsxs("div", { className: "control-group", children: [_jsxs("div", { className: "control-label", children: [_jsx("span", { children: "\u7C98\u6027\u6469\u64E6 \u03C3\u2082" }), _jsx("span", { className: "control-value", children: lugreParams[selectedAxis].sigma2.toFixed(3) })] }), _jsx("input", { type: "range", className: "slider", min: "0", max: "2", step: "0.01", value: lugreParams[selectedAxis].sigma2, onChange: (e) => updateLugreParam('sigma2', parseFloat(e.target.value)) })] }), _jsxs("div", { className: "control-group", children: [_jsxs("div", { className: "control-label", children: [_jsx("span", { children: "\u5E93\u4ED1\u6469\u64E6 Fc" }), _jsxs("span", { className: "control-value", children: [lugreParams[selectedAxis].fc.toFixed(3), " N\u00B7m"] })] }), _jsx("input", { type: "range", className: "slider", min: "0", max: "2", step: "0.01", value: lugreParams[selectedAxis].fc, onChange: (e) => updateLugreParam('fc', parseFloat(e.target.value)) })] }), _jsxs("div", { className: "control-group", children: [_jsxs("div", { className: "control-label", children: [_jsx("span", { children: "\u9759\u6469\u64E6 Fs" }), _jsxs("span", { className: "control-value", children: [lugreParams[selectedAxis].fs.toFixed(3), " N\u00B7m"] })] }), _jsx("input", { type: "range", className: "slider", min: "0", max: "3", step: "0.01", value: lugreParams[selectedAxis].fs, onChange: (e) => updateLugreParam('fs', parseFloat(e.target.value)) })] }), _jsxs("div", { className: "control-group", children: [_jsxs("div", { className: "control-label", children: [_jsx("span", { children: "Stribeck \u901F\u5EA6 vs" }), _jsxs("span", { className: "control-value", children: [lugreParams[selectedAxis].vs.toFixed(4), " rad/s"] })] }), _jsx("input", { type: "range", className: "slider", min: "0.001", max: "0.1", step: "0.001", value: lugreParams[selectedAxis].vs, onChange: (e) => updateLugreParam('vs', parseFloat(e.target.value)) })] })] })), feedforwardEnabled && (_jsxs("div", { style: { marginTop: '12px', borderTop: '1px solid #2a3a5a', paddingTop: '12px' }, children: [_jsxs("div", { className: "control-group", children: [_jsxs("div", { className: "control-label", children: [_jsx("span", { children: "\u65B9\u4F4D\u524D\u9988\u589E\u76CA" }), _jsxs("span", { className: "control-value", children: [ffGainAz.toFixed(2), "x"] })] }), _jsx("input", { type: "range", className: "slider", min: "0", max: "5", step: "0.1", value: ffGainAz, onChange: (e) => setFfGainAz(parseFloat(e.target.value)) })] }), _jsxs("div", { className: "control-group", children: [_jsxs("div", { className: "control-label", children: [_jsx("span", { children: "\u4FEF\u4EF0\u524D\u9988\u589E\u76CA" }), _jsxs("span", { className: "control-value", children: [ffGainEl.toFixed(2), "x"] })] }), _jsx("input", { type: "range", className: "slider", min: "0", max: "5", step: "0.1", value: ffGainEl, onChange: (e) => setFfGainEl(parseFloat(e.target.value)) })] }), _jsxs("div", { className: "control-group", children: [_jsxs("div", { className: "control-label", children: [_jsx("span", { children: "\u6EDA\u8F6C\u524D\u9988\u589E\u76CA" }), _jsxs("span", { className: "control-value", children: [ffGainRoll.toFixed(2), "x"] })] }), _jsx("input", { type: "range", className: "slider", min: "0", max: "5", step: "0.1", value: ffGainRoll, onChange: (e) => setFfGainRoll(parseFloat(e.target.value)) })] })] }))] })] }));
}
