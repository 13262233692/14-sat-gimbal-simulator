import GimbalViewer from './components/GimbalViewer';
import ControlPanel from './components/ControlPanel';
import { useGimbal } from './hooks/useGimbal';

function App() {
  const {
    state,
    isRunning,
    fps,
    setTorque,
    setDisturbance,
    resetState,
    startSimulation,
    stopSimulation,
  } = useGimbal();

  return (
    <div className="app-container">
      <div className="viewer-container">
        <div className="status-indicator">
          <div className={`status-dot ${isRunning ? '' : 'stopped'}`} />
          <span>{isRunning ? '运行中' : '已停止'}</span>
        </div>
        <div className="fps-counter">
          {fps} FPS
        </div>
        <GimbalViewer state={state} />
      </div>
      <ControlPanel
        state={state}
        isRunning={isRunning}
        onSetTorque={setTorque}
        onSetDisturbance={setDisturbance}
        onReset={resetState}
        onStart={startSimulation}
        onStop={stopSimulation}
      />
    </div>
  );
}

export default App;
