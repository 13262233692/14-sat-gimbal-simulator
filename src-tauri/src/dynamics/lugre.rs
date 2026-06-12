use serde::{Serialize, Deserialize};

use super::rk4::StateVector;

#[derive(Copy, Clone, Debug, Serialize, Deserialize)]
pub struct LuGreParams {
    pub sigma0: f64,
    pub sigma1: f64,
    pub sigma2: f64,
    pub fc: f64,
    pub fs: f64,
    pub vs: f64,
    pub preload: f64,
    pub stiction_force: f64,
}

impl Default for LuGreParams {
    fn default() -> Self {
        LuGreParams {
            sigma0: 80000.0,
            sigma1: 280.0,
            sigma2: 0.45,
            fc: 0.35,
            fs: 0.65,
            vs: 0.01,
            preload: 0.0,
            stiction_force: 0.85,
        }
    }
}

#[derive(Copy, Clone, Debug, Default, Serialize, Deserialize)]
pub struct LuGreState {
    pub z: f64,
}

impl StateVector for LuGreState {}

impl std::ops::Add for LuGreState {
    type Output = Self;
    fn add(self, rhs: Self) -> Self {
        LuGreState { z: self.z + rhs.z }
    }
}

impl std::ops::Mul<f64> for LuGreState {
    type Output = Self;
    fn mul(self, rhs: f64) -> Self {
        LuGreState { z: self.z * rhs }
    }
}

impl LuGreState {
    pub fn is_valid(&self) -> bool {
        self.z.is_finite()
    }

    pub fn sanitize(&mut self) {
        if !self.z.is_finite() {
            self.z = 0.0;
        }
    }
}

pub fn lugre_g(v: f64, params: &LuGreParams) -> f64 {
    let v_ratio = (v / params.vs).abs();
    params.fc + (params.fs - params.fc) * (-v_ratio * v_ratio).exp()
}

pub fn lugre_z_dot(v: f64, z: f64, params: &LuGreParams) -> f64 {
    let g_v = lugre_g(v, params);
    if g_v.abs() < 1e-12 {
        v
    } else {
        v - (params.sigma0 * v.abs() / g_v) * z
    }
}

pub fn lugre_friction_force(v: f64, z: f64, params: &LuGreParams) -> f64 {
    let zd = lugre_z_dot(v, z, params);
    let force = params.sigma0 * z + params.sigma1 * zd + params.sigma2 * v
        + params.preload * v.signum();
    if force.is_finite() { force } else { 0.0 }
}

#[derive(Copy, Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub enum StickSlipPhase {
    Sticking,
    Preslip,
    Sliding,
    Reversing,
}

impl Default for StickSlipPhase {
    fn default() -> Self { StickSlipPhase::Sticking }
}

#[derive(Copy, Clone, Debug, Default, Serialize, Deserialize)]
pub struct AxisFrictionDiagnostics {
    pub friction_torque: f64,
    pub feedforward_torque: f64,
    pub stick_slip_phase: StickSlipPhase,
    pub zero_crossing_detected: bool,
    pub ff_active: bool,
}

pub struct ZeroCrossingDetector {
    v_prev: f64,
    crossing_hold_time: f64,
    hold_remaining: f64,
    last_crossing_dir: f64,
}

impl Default for ZeroCrossingDetector {
    fn default() -> Self {
        ZeroCrossingDetector {
            v_prev: 0.0,
            crossing_hold_time: 0.02,
            hold_remaining: 0.0,
            last_crossing_dir: 0.0,
        }
    }
}

impl ZeroCrossingDetector {
    pub fn update(&mut self, v: f64, dt: f64) -> (bool, f64) {
        let mut detected = false;
        let mut dir = 0.0;

        if self.v_prev < 0.0 && v >= 0.0 {
            detected = true;
            dir = 1.0;
            self.hold_remaining = self.crossing_hold_time;
            self.last_crossing_dir = 1.0;
        } else if self.v_prev > 0.0 && v <= 0.0 {
            detected = true;
            dir = -1.0;
            self.hold_remaining = self.crossing_hold_time;
            self.last_crossing_dir = -1.0;
        }

        if self.hold_remaining > 0.0 {
            self.hold_remaining -= dt;
            if self.hold_remaining <= 0.0 {
                self.last_crossing_dir = 0.0;
            }
        }

        self.v_prev = v;

        (detected, dir)
    }

    pub fn in_crossing_window(&self) -> bool {
        self.hold_remaining > 0.0
    }

    pub fn reset(&mut self) {
        self.v_prev = 0.0;
        self.hold_remaining = 0.0;
        self.last_crossing_dir = 0.0;
    }
}

pub struct FeedforwardCompensator {
    pub gain: f64,
    pub peak_gain: f64,
    pub decay_tau: f64,
    pub filter_tau: f64,
    pub peak_hold_time: f64,

    ff_output: f64,
    peak_value: f64,
    hold_remaining: f64,
    active: bool,
}

impl Default for FeedforwardCompensator {
    fn default() -> Self {
        FeedforwardCompensator {
            gain: 1.0,
            peak_gain: 2.5,
            decay_tau: 0.03,
            filter_tau: 0.002,
            peak_hold_time: 0.01,
            ff_output: 0.0,
            peak_value: 0.0,
            hold_remaining: 0.0,
            active: false,
        }
    }
}

impl FeedforwardCompensator {
    pub fn new(gain: f64) -> Self {
        let mut f = Self::default();
        f.gain = gain;
        f
    }

    pub fn update(
        &mut self,
        v: f64,
        friction_torque: f64,
        zero_crossing: bool,
        crossing_dir: f64,
        phase: StickSlipPhase,
        dt: f64,
    ) -> f64 {
        if zero_crossing {
            self.active = true;
            self.hold_remaining = self.peak_hold_time;
            let f_abs = friction_torque.abs().max(0.01);
            self.peak_value = crossing_dir * f_abs * self.peak_gain * self.gain;
        }

        if self.hold_remaining > 0.0 {
            self.hold_remaining -= dt;
        }

        let target = if self.active {
            if self.hold_remaining > 0.0 {
                self.peak_value
            } else {
                let base_ff = -friction_torque * self.gain;
                match phase {
                    StickSlipPhase::Preslip => base_ff * 1.2,
                    StickSlipPhase::Sticking => base_ff * 0.8,
                    _ => base_ff,
                }
            }
        } else {
            0.0
        };

        let alpha = if dt < self.filter_tau {
            dt / self.filter_tau
        } else {
            1.0
        };
        self.ff_output += alpha * (target - self.ff_output);

        if !self.active && self.ff_output.abs() < 1e-4 {
            self.ff_output = 0.0;
        }

        if v.abs() > 0.5 && self.active && self.hold_remaining <= 0.0 {
            self.active = false;
            self.ff_output = 0.0;
        }

        self.ff_output
    }

    pub fn reset(&mut self) {
        self.ff_output = 0.0;
        self.peak_value = 0.0;
        self.hold_remaining = 0.0;
        self.active = false;
    }

    pub fn is_active(&self) -> bool {
        self.active
    }

    pub fn output(&self) -> f64 {
        self.ff_output
    }
}

pub fn classify_stick_slip_phase(v: f64, params: &LuGreParams) -> StickSlipPhase {
    let v_abs = v.abs();
    if v_abs < params.vs * 0.05 {
        StickSlipPhase::Sticking
    } else if v_abs < params.vs * 0.5 {
        StickSlipPhase::Preslip
    } else {
        StickSlipPhase::Sliding
    }
}
