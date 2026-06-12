import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import GimbalViewer from './components/GimbalViewer';
import ControlPanel from './components/ControlPanel';
import { useGimbal } from './hooks/useGimbal';
function App() {
    const { state, isRunning, fps, recoveryMode, frictionDiagnostics, lugreEnabled, feedforwardEnabled, setTorque, setDisturbance, resetState, startSimulation, stopSimulation, setLugreEnabled, setFeedforwardEnabled, setLugreParamsAz, setLugreParamsEl, setLugreParamsRoll, setFeedforwardGain, } = useGimbal();
    return (_jsxs("div", { className: "app-container", children: [_jsxs("div", { className: "viewer-container", children: [_jsxs("div", { className: "status-indicator", children: [_jsx("div", { className: `status-dot ${isRunning ? '' : 'stopped'}` }), _jsx("span", { children: recoveryMode ? '保护恢复中...' : isRunning ? '运行中' : '已停止' })] }), _jsxs("div", { className: "fps-counter", children: [fps, " FPS"] }), recoveryMode && (_jsx("div", { style: {
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            background: 'rgba(255, 107, 107, 0.9)',
                            color: 'white',
                            padding: '20px 40px',
                            borderRadius: '12px',
                            fontSize: '18px',
                            fontWeight: 'bold',
                            zIndex: 100,
                            boxShadow: '0 0 30px rgba(255, 107, 107, 0.5)',
                            animation: 'pulse 0.5s infinite',
                        }, children: "\u26A0\uFE0F \u5947\u5F02\u70B9\u4FDD\u62A4\uFF1A\u81EA\u52A8\u6062\u590D\u4E2D" })), _jsx(GimbalViewer, { state: state })] }), _jsx(ControlPanel, { state: state, isRunning: isRunning, frictionDiagnostics: frictionDiagnostics, lugreEnabled: lugreEnabled, feedforwardEnabled: feedforwardEnabled, onSetTorque: setTorque, onSetDisturbance: setDisturbance, onReset: resetState, onStart: startSimulation, onStop: stopSimulation, onSetLugreEnabled: setLugreEnabled, onSetFeedforwardEnabled: setFeedforwardEnabled, onSetLugreParamsAz: setLugreParamsAz, onSetLugreParamsEl: setLugreParamsEl, onSetLugreParamsRoll: setLugreParamsRoll, onSetFeedforwardGain: setFeedforwardGain })] }));
}
export default App;
