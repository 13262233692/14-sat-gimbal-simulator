import GimbalViewer from './components/GimbalViewer';
import ControlPanel from './components/ControlPanel';
import { useGimbal } from './hooks/useGimbal';

function App() {
  const {
    state,
    isRunning,
    fps,
    recoveryMode,
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
          <span>
            {recoveryMode ? '保护恢复中...' : isRunning ? '运行中' : '已停止'}
          </span>
        </div>
        <div className="fps-counter">
          {fps} FPS
        </div>
        {recoveryMode && (
          <div style={{
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
          }}>
            ⚠️ 奇异点保护：自动恢复中
          </div>
        )}
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
