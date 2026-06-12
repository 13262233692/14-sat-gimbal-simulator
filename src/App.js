import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import GimbalViewer from './components/GimbalViewer';
import ControlPanel from './components/ControlPanel';
import { useGimbal } from './hooks/useGimbal';
function App() {
    const { state, isRunning, fps, setTorque, setDisturbance, resetState, startSimulation, stopSimulation, } = useGimbal();
    return (_jsxs("div", { className: "app-container", children: [_jsxs("div", { className: "viewer-container", children: [_jsxs("div", { className: "status-indicator", children: [_jsx("div", { className: `status-dot ${isRunning ? '' : 'stopped'}` }), _jsx("span", { children: isRunning ? '运行中' : '已停止' })] }), _jsxs("div", { className: "fps-counter", children: [fps, " FPS"] }), _jsx(GimbalViewer, { state: state })] }), _jsx(ControlPanel, { state: state, isRunning: isRunning, onSetTorque: setTorque, onSetDisturbance: setDisturbance, onReset: resetState, onStart: startSimulation, onStop: stopSimulation })] }));
}
export default App;
