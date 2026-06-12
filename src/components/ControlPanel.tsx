import { useState, useEffect } from 'react';
import type { DisturbanceParams, GimbalState, AxisFrictionDiagnostics, LuGreParams } from '../types/gimbal';

interface ControlPanelProps {
  state: GimbalState | null;
  isRunning: boolean;
  frictionDiagnostics: AxisFrictionDiagnostics[] | null;
  lugreEnabled: boolean;
  feedforwardEnabled: boolean;
  onSetTorque: (az: number, el: number, roll: number) => void;
  onSetDisturbance: (params: DisturbanceParams) => void;
  onReset: () => void;
  onStart: () => void;
  onStop: () => void;
  onSetLugreEnabled: (enabled: boolean) => void;
  onSetFeedforwardEnabled: (enabled: boolean) => void;
  onSetLugreParamsAz: (params: LuGreParams) => void;
  onSetLugreParamsEl: (params: LuGreParams) => void;
  onSetLugreParamsRoll: (params: LuGreParams) => void;
  onSetFeedforwardGain: (az: number, el: number, roll: number) => void;
}

const defaultDisturbance: DisturbanceParams = {
  wind_force_x: 0,
  wind_force_y: 0,
  wind_force_z: 0,
  wind_gain: 1.0,
  enable_wind: false,
  noise_amplitude: 0.02,
  enable_noise: true,
};

export default function ControlPanel({
  state,
  isRunning,
  frictionDiagnostics,
  lugreEnabled,
  feedforwardEnabled,
  onSetTorque,
  onSetDisturbance,
  onReset,
  onStart,
  onStop,
  onSetLugreEnabled,
  onSetFeedforwardEnabled,
  onSetLugreParamsAz,
  onSetLugreParamsEl,
  onSetLugreParamsRoll,
  onSetFeedforwardGain,
}: ControlPanelProps) {
  const [torqueAz, setTorqueAz] = useState(0);
  const [torqueEl, setTorqueEl] = useState(0);
  const [torqueRoll, setTorqueRoll] = useState(0);
  const [disturbance, setDisturbance] = useState<DisturbanceParams>(defaultDisturbance);
  const [selectedAxis, setSelectedAxis] = useState<0 | 1 | 2>(0);
  const [ffGainAz, setFfGainAz] = useState(1.8);
  const [ffGainEl, setFfGainEl] = useState(1.8);
  const [ffGainRoll, setFfGainRoll] = useState(1.5);

  const axisNames = ['方位轴', '俯仰轴', '滚转轴'];

  const defaultLuGreAz: LuGreParams = {
    sigma0: 80000, sigma1: 280, sigma2: 0.45,
    fc: 0.35, fs: 0.65, vs: 0.01,
    preload: 0, stiction_force: 0.85,
  };
  const defaultLuGreEl: LuGreParams = {
    sigma0: 90000, sigma1: 310, sigma2: 0.32,
    fc: 0.25, fs: 0.48, vs: 0.008,
    preload: 0, stiction_force: 0.6,
  };
  const defaultLuGreRoll: LuGreParams = {
    sigma0: 100000, sigma1: 200, sigma2: 0.12,
    fc: 0.08, fs: 0.15, vs: 0.005,
    preload: 0, stiction_force: 0.2,
  };

  const [lugreParams, setLugreParams] = useState<[LuGreParams, LuGreParams, LuGreParams]>([
    defaultLuGreAz, defaultLuGreEl, defaultLuGreRoll,
  ]);

  useEffect(() => {
    onSetTorque(torqueAz, torqueEl, torqueRoll);
  }, [torqueAz, torqueEl, torqueRoll, onSetTorque]);

  useEffect(() => {
    onSetDisturbance(disturbance);
  }, [disturbance, onSetDisturbance]);

  const radToDeg = (rad: number) => (rad * 180 / Math.PI).toFixed(1);

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

  const updateLugreParam = (key: keyof LuGreParams, value: number) => {
    setLugreParams(prev => {
      const newParams = [...prev] as [LuGreParams, LuGreParams, LuGreParams];
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

  const phaseLabel = (phase: string) => {
    switch (phase) {
      case 'Sticking': return '粘附';
      case 'Preslip': return '预滑';
      case 'Sliding': return '滑动';
      case 'Reversing': return '换向';
      default: return phase;
    }
  };

  return (
    <div className="control-panel">
      <div className="panel-section">
        <h3>系统状态</h3>
        <div className="state-display">
          <div className="state-item">
            <div className="label">方位角</div>
            <div className="value">{state ? radToDeg(state.theta_az) : '0.0'}°</div>
          </div>
          <div className="state-item">
            <div className="label">俯仰角</div>
            <div className="value">{state ? radToDeg(state.theta_el) : '0.0'}°</div>
          </div>
          <div className="state-item">
            <div className="label">滚转角</div>
            <div className="value">{state ? radToDeg(state.theta_roll) : '0.0'}°</div>
          </div>
          <div className="state-item">
            <div className="label">时间戳</div>
            <div className="value">{state ? (state.timestamp_ns / 1e9).toFixed(3) : '0.000'}s</div>
          </div>
        </div>
      </div>

      <div className="panel-section">
        <h3>运行控制</h3>
        <div className="button-row">
          <button
            className={`btn ${isRunning ? 'btn-danger' : 'btn-primary'}`}
            onClick={isRunning ? onStop : onStart}
          >
            {isRunning ? '停止仿真' : '启动仿真'}
          </button>
          <button className="btn btn-secondary" onClick={onReset}>
            复位
          </button>
        </div>
      </div>

      <div className="panel-section">
        <h3>转矩控制</h3>

        <div className="control-group">
          <div className="control-label">
            <span>方位轴转矩</span>
            <span className="control-value">{torqueAz.toFixed(1)} N·m</span>
          </div>
          <input
            type="range"
            className="slider"
            min="-120"
            max="120"
            step="1"
            value={torqueAz}
            onChange={(e) => setTorqueAz(parseFloat(e.target.value))}
          />
        </div>

        <div className="control-group">
          <div className="control-label">
            <span>俯仰轴转矩</span>
            <span className="control-value">{torqueEl.toFixed(1)} N·m</span>
          </div>
          <input
            type="range"
            className="slider"
            min="-85"
            max="85"
            step="1"
            value={torqueEl}
            onChange={(e) => setTorqueEl(parseFloat(e.target.value))}
          />
        </div>

        <div className="control-group">
          <div className="control-label">
            <span>滚转轴转矩</span>
            <span className="control-value">{torqueRoll.toFixed(1)} N·m</span>
          </div>
          <input
            type="range"
            className="slider"
            min="-25"
            max="25"
            step="0.5"
            value={torqueRoll}
            onChange={(e) => setTorqueRoll(parseFloat(e.target.value))}
          />
        </div>
      </div>

      <div className="panel-section">
        <h3>扰动参数</h3>

        <div className="toggle-row">
          <span className="toggle-label">风载干扰</span>
          <div
            className={`toggle-switch ${disturbance.enable_wind ? 'active' : ''}`}
            onClick={toggleWind}
          />
        </div>

        {disturbance.enable_wind && (
          <>
            <div className="control-group">
              <div className="control-label">
                <span>风力 X</span>
                <span className="control-value">{disturbance.wind_force_x.toFixed(1)} N</span>
              </div>
              <input
                type="range"
                className="slider"
                min="-50"
                max="50"
                step="1"
                value={disturbance.wind_force_x}
                onChange={(e) => setDisturbance(prev => ({
                  ...prev,
                  wind_force_x: parseFloat(e.target.value)
                }))}
              />
            </div>

            <div className="control-group">
              <div className="control-label">
                <span>风力 Y</span>
                <span className="control-value">{disturbance.wind_force_y.toFixed(1)} N</span>
              </div>
              <input
                type="range"
                className="slider"
                min="-50"
                max="50"
                step="1"
                value={disturbance.wind_force_y}
                onChange={(e) => setDisturbance(prev => ({
                  ...prev,
                  wind_force_y: parseFloat(e.target.value)
                }))}
              />
            </div>

            <div className="control-group">
              <div className="control-label">
                <span>风力 Z</span>
                <span className="control-value">{disturbance.wind_force_z.toFixed(1)} N</span>
              </div>
              <input
                type="range"
                className="slider"
                min="-50"
                max="50"
                step="1"
                value={disturbance.wind_force_z}
                onChange={(e) => setDisturbance(prev => ({
                  ...prev,
                  wind_force_z: parseFloat(e.target.value)
                }))}
              />
            </div>

            <div className="control-group">
              <div className="control-label">
                <span>风载增益</span>
                <span className="control-value">{disturbance.wind_gain.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                className="slider"
                min="0"
                max="5"
                step="0.1"
                value={disturbance.wind_gain}
                onChange={(e) => setDisturbance(prev => ({
                  ...prev,
                  wind_gain: parseFloat(e.target.value)
                }))}
              />
            </div>
          </>
        )}

        <div className="toggle-row">
          <span className="toggle-label">测量噪声</span>
          <div
            className={`toggle-switch ${disturbance.enable_noise ? 'active' : ''}`}
            onClick={toggleNoise}
          />
        </div>

        {disturbance.enable_noise && (
          <div className="control-group">
            <div className="control-label">
              <span>噪声幅值</span>
              <span className="control-value">{disturbance.noise_amplitude.toFixed(3)}</span>
            </div>
            <input
              type="range"
              className="slider"
              min="0"
              max="0.5"
              step="0.01"
              value={disturbance.noise_amplitude}
              onChange={(e) => setDisturbance(prev => ({
                ...prev,
                noise_amplitude: parseFloat(e.target.value)
              }))}
            />
          </div>
        )}
      </div>

      <div className="panel-section">
        <h3>快捷转矩</h3>
        <div className="button-row">
          <button
            className="btn btn-secondary"
            onClick={() => {
              setTorqueAz(50);
              setTorqueEl(0);
              setTorqueRoll(0);
            }}
          >
            方位 +
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setTorqueAz(-50);
              setTorqueEl(0);
              setTorqueRoll(0);
            }}
          >
            方位 -
          </button>
        </div>
        <div className="button-row" style={{ marginTop: '8px' }}>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setTorqueAz(0);
              setTorqueEl(0);
              setTorqueRoll(0);
            }}
          >
            全部归零
          </button>
        </div>
      </div>

      <div className="panel-section">
        <h3>摩擦诊断</h3>
        {axisNames.map((name, i) => (
          <div key={name} className="state-display" style={{ marginBottom: '8px' }}>
            <div className="state-item" style={{ flex: 1 }}>
              <div className="label">{name}摩擦</div>
              <div className="value">
                {frictionDiagnostics ? frictionDiagnostics[i].friction_torque.toFixed(4) : '0.0000'} N·m
              </div>
            </div>
            <div className="state-item" style={{ flex: 1 }}>
              <div className="label">前馈</div>
              <div className="value" style={{ color: frictionDiagnostics?.[i]?.ff_active ? '#5b9dff' : '#666' }}>
                {frictionDiagnostics ? frictionDiagnostics[i].feedforward_torque.toFixed(4) : '0.0000'} N·m
              </div>
            </div>
            <div className="state-item" style={{ flex: 1 }}>
              <div className="label">状态</div>
              <div className="value" style={{ fontSize: '11px' }}>
                {frictionDiagnostics ? phaseLabel(frictionDiagnostics[i].stick_slip_phase) : '-'}
                {frictionDiagnostics?.[i]?.zero_crossing_detected && <span style={{ color: '#ff6b9d' }}> ⚡</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="panel-section">
        <h3>LuGre 摩擦模型</h3>

        <div className="toggle-row">
          <span className="toggle-label">启用 LuGre 摩擦</span>
          <div
            className={`toggle-switch ${lugreEnabled ? 'active' : ''}`}
            onClick={toggleLugre}
          />
        </div>

        <div className="toggle-row">
          <span className="toggle-label">前馈补偿</span>
          <div
            className={`toggle-switch ${feedforwardEnabled ? 'active' : ''}`}
            onClick={toggleFeedforward}
          />
        </div>

        <div className="axis-tabs" style={{ display: 'flex', margin: '12px 0', gap: '4px' }}>
          {axisNames.map((name, i) => (
            <button
              key={name}
              className={`btn ${selectedAxis === i ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1, fontSize: '12px', padding: '6px 8px' }}
              onClick={() => setSelectedAxis(i as 0 | 1 | 2)}
            >
              {name}
            </button>
          ))}
        </div>

        {lugreEnabled && (
          <>
            <div className="control-group">
              <div className="control-label">
                <span>刚毛刚度 σ₀</span>
                <span className="control-value">{lugreParams[selectedAxis].sigma0.toFixed(0)}</span>
              </div>
              <input
                type="range"
                className="slider"
                min="1000"
                max="200000"
                step="1000"
                value={lugreParams[selectedAxis].sigma0}
                onChange={(e) => updateLugreParam('sigma0', parseFloat(e.target.value))}
              />
            </div>

            <div className="control-group">
              <div className="control-label">
                <span>刚毛阻尼 σ₁</span>
                <span className="control-value">{lugreParams[selectedAxis].sigma1.toFixed(1)}</span>
              </div>
              <input
                type="range"
                className="slider"
                min="10"
                max="800"
                step="5"
                value={lugreParams[selectedAxis].sigma1}
                onChange={(e) => updateLugreParam('sigma1', parseFloat(e.target.value))}
              />
            </div>

            <div className="control-group">
              <div className="control-label">
                <span>粘性摩擦 σ₂</span>
                <span className="control-value">{lugreParams[selectedAxis].sigma2.toFixed(3)}</span>
              </div>
              <input
                type="range"
                className="slider"
                min="0"
                max="2"
                step="0.01"
                value={lugreParams[selectedAxis].sigma2}
                onChange={(e) => updateLugreParam('sigma2', parseFloat(e.target.value))}
              />
            </div>

            <div className="control-group">
              <div className="control-label">
                <span>库仑摩擦 Fc</span>
                <span className="control-value">{lugreParams[selectedAxis].fc.toFixed(3)} N·m</span>
              </div>
              <input
                type="range"
                className="slider"
                min="0"
                max="2"
                step="0.01"
                value={lugreParams[selectedAxis].fc}
                onChange={(e) => updateLugreParam('fc', parseFloat(e.target.value))}
              />
            </div>

            <div className="control-group">
              <div className="control-label">
                <span>静摩擦 Fs</span>
                <span className="control-value">{lugreParams[selectedAxis].fs.toFixed(3)} N·m</span>
              </div>
              <input
                type="range"
                className="slider"
                min="0"
                max="3"
                step="0.01"
                value={lugreParams[selectedAxis].fs}
                onChange={(e) => updateLugreParam('fs', parseFloat(e.target.value))}
              />
            </div>

            <div className="control-group">
              <div className="control-label">
                <span>Stribeck 速度 vs</span>
                <span className="control-value">{lugreParams[selectedAxis].vs.toFixed(4)} rad/s</span>
              </div>
              <input
                type="range"
                className="slider"
                min="0.001"
                max="0.1"
                step="0.001"
                value={lugreParams[selectedAxis].vs}
                onChange={(e) => updateLugreParam('vs', parseFloat(e.target.value))}
              />
            </div>
          </>
        )}

        {feedforwardEnabled && (
          <div style={{ marginTop: '12px', borderTop: '1px solid #2a3a5a', paddingTop: '12px' }}>
            <div className="control-group">
              <div className="control-label">
                <span>方位前馈增益</span>
                <span className="control-value">{ffGainAz.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                className="slider"
                min="0"
                max="5"
                step="0.1"
                value={ffGainAz}
                onChange={(e) => setFfGainAz(parseFloat(e.target.value))}
              />
            </div>

            <div className="control-group">
              <div className="control-label">
                <span>俯仰前馈增益</span>
                <span className="control-value">{ffGainEl.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                className="slider"
                min="0"
                max="5"
                step="0.1"
                value={ffGainEl}
                onChange={(e) => setFfGainEl(parseFloat(e.target.value))}
              />
            </div>

            <div className="control-group">
              <div className="control-label">
                <span>滚转前馈增益</span>
                <span className="control-value">{ffGainRoll.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                className="slider"
                min="0"
                max="5"
                step="0.1"
                value={ffGainRoll}
                onChange={(e) => setFfGainRoll(parseFloat(e.target.value))}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
