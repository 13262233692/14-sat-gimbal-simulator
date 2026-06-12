export interface GimbalState {
  theta_az: number;
  theta_el: number;
  theta_roll: number;
  omega_az: number;
  omega_el: number;
  omega_roll: number;
  timestamp_ns: number;
}

export interface GimbalParams {
  i_az: number;
  i_el: number;
  i_roll: number;
  coulomb_az: number;
  coulomb_el: number;
  coulomb_roll: number;
  viscous_az: number;
  viscous_el: number;
  viscous_roll: number;
  stribeck_az: number;
  stribeck_el: number;
  stribeck_roll: number;
  max_torque_az: number;
  max_torque_el: number;
  max_torque_roll: number;
}

export interface DisturbanceParams {
  wind_force_x: number;
  wind_force_y: number;
  wind_force_z: number;
  wind_gain: number;
  enable_wind: boolean;
  noise_amplitude: number;
  enable_noise: boolean;
}

export interface BusMetadata {
  file_path: string;
  header_size: number;
  frame_size: number;
  frame_count: number;
  total_size: number;
}

export interface LuGreParams {
  sigma0: number;
  sigma1: number;
  sigma2: number;
  fc: number;
  fs: number;
  vs: number;
  preload: number;
  stiction_force: number;
}

export type StickSlipPhase = 'Sticking' | 'Preslip' | 'Sliding' | 'Reversing';

export interface AxisFrictionDiagnostics {
  friction_torque: number;
  feedforward_torque: number;
  stick_slip_phase: StickSlipPhase;
  zero_crossing_detected: boolean;
  ff_active: boolean;
}
