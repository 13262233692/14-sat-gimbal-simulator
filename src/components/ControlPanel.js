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
export default function ControlPanel({ state, isRunning, onSetTorque, onSetDisturbance, onReset, onStart, onStop, }) {
    const [torqueAz, setTorqueAz] = useState(0);
    const [torqueEl, setTorqueEl] = useState(0);
    const [torqueRoll, setTorqueRoll] = useState(0);
    const [disturbance, setDisturbance] = useState(defaultDisturbance);
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
                            }, children: "\u5168\u90E8\u5F52\u96F6" }) })] })] }));
}
