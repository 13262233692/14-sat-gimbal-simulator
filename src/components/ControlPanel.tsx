import { useState, useEffect } from 'react';
import type { DisturbanceParams, GimbalState } from '../types/gimbal';

interface ControlPanelProps {
  state: GimbalState | null;
  isRunning: boolean;
  onSetTorque: (az: number, el: number, roll: number) => void;
  onSetDisturbance: (params: DisturbanceParams) => void;
  onReset: () => void;
  onStart: () => void;
  onStop: () => void;
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
  onSetTorque,
  onSetDisturbance,
  onReset,
  onStart,
  onStop,
}: ControlPanelProps) {
  const [torqueAz, setTorqueAz] = useState(0);
  const [torqueEl, setTorqueEl] = useState(0);
  const [torqueRoll, setTorqueRoll] = useState(0);
  const [disturbance, setDisturbance] = useState<DisturbanceParams>(defaultDisturbance);

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
    </div>
  );
}
