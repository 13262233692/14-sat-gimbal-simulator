use std::ops::{Add, Mul};
use serde::{Serialize, Deserialize};
use nalgebra::{Matrix3, Vector3};
use super::rk4::RK4Integrator;
use rand::Rng;

#[derive(Copy, Clone, Debug, Serialize, Deserialize)]
pub struct GimbalState {
    pub theta_az: f64,
    pub theta_el: f64,
    pub theta_roll: f64,
    pub omega_az: f64,
    pub omega_el: f64,
    pub omega_roll: f64,
    pub timestamp_ns: u64,
}

impl Add for GimbalState {
    type Output = Self;
    fn add(self, rhs: Self) -> Self {
        GimbalState {
            theta_az: self.theta_az + rhs.theta_az,
            theta_el: self.theta_el + rhs.theta_el,
            theta_roll: self.theta_roll + rhs.theta_roll,
            omega_az: self.omega_az + rhs.omega_az,
            omega_el: self.omega_el + rhs.omega_el,
            omega_roll: self.omega_roll + rhs.omega_roll,
            timestamp_ns: self.timestamp_ns + rhs.timestamp_ns,
        }
    }
}

impl Mul<f64> for GimbalState {
    type Output = Self;
    fn mul(self, rhs: f64) -> Self {
        GimbalState {
            theta_az: self.theta_az * rhs,
            theta_el: self.theta_el * rhs,
            theta_roll: self.theta_roll * rhs,
            omega_az: self.omega_az * rhs,
            omega_el: self.omega_el * rhs,
            omega_roll: self.omega_roll * rhs,
            timestamp_ns: ((self.timestamp_ns as f64) * rhs) as u64,
        }
    }
}

impl super::rk4::StateVector for GimbalState {}

#[derive(Copy, Clone, Debug, Serialize, Deserialize)]
pub struct GimbalParams {
    pub i_az: f64,
    pub i_el: f64,
    pub i_roll: f64,
    pub coulomb_az: f64,
    pub coulomb_el: f64,
    pub coulomb_roll: f64,
    pub viscous_az: f64,
    pub viscous_el: f64,
    pub viscous_roll: f64,
    pub stribeck_az: f64,
    pub stribeck_el: f64,
    pub stribeck_roll: f64,
    pub max_torque_az: f64,
    pub max_torque_el: f64,
    pub max_torque_roll: f64,
}

impl Default for GimbalParams {
    fn default() -> Self {
        GimbalParams {
            i_az: 2.5,
            i_el: 1.8,
            i_roll: 0.6,
            coulomb_az: 0.35,
            coulomb_el: 0.25,
            coulomb_roll: 0.08,
            viscous_az: 0.12,
            viscous_el: 0.09,
            viscous_roll: 0.03,
            stribeck_az: 0.20,
            stribeck_el: 0.15,
            stribeck_roll: 0.05,
            max_torque_az: 120.0,
            max_torque_el: 85.0,
            max_torque_roll: 25.0,
        }
    }
}

#[derive(Copy, Clone, Debug, Serialize, Deserialize)]
pub struct DisturbanceParams {
    pub wind_force_x: f64,
    pub wind_force_y: f64,
    pub wind_force_z: f64,
    pub wind_gain: f64,
    pub enable_wind: bool,
    pub noise_amplitude: f64,
    pub enable_noise: bool,
}

impl Default for DisturbanceParams {
    fn default() -> Self {
        DisturbanceParams {
            wind_force_x: 0.0,
            wind_force_y: 0.0,
            wind_force_z: 0.0,
            wind_gain: 1.0,
            enable_wind: false,
            noise_amplitude: 0.02,
            enable_noise: true,
        }
    }
}

pub struct GimbalDynamics {
    state: GimbalState,
    params: GimbalParams,
    disturbance: DisturbanceParams,
    cmd_torque_az: f64,
    cmd_torque_el: f64,
    cmd_torque_roll: f64,
    running: bool,
    tick_counter: u64,
}

impl GimbalDynamics {
    pub fn new() -> Self {
        GimbalDynamics {
            state: GimbalState {
                theta_az: 0.0,
                theta_el: 0.0,
                theta_roll: 0.0,
                omega_az: 0.0,
                omega_el: 0.0,
                omega_roll: 0.0,
                timestamp_ns: 0,
            },
            params: GimbalParams::default(),
            disturbance: DisturbanceParams::default(),
            cmd_torque_az: 0.0,
            cmd_torque_el: 0.0,
            cmd_torque_roll: 0.0,
            running: true,
            tick_counter: 0,
        }
    }

    pub fn set_torque(&mut self, az: f64, el: f64, roll: f64) {
        self.cmd_torque_az = az.clamp(-self.params.max_torque_az, self.params.max_torque_az);
        self.cmd_torque_el = el.clamp(-self.params.max_torque_el, self.params.max_torque_el);
        self.cmd_torque_roll = roll.clamp(-self.params.max_torque_roll, self.params.max_torque_roll);
    }

    pub fn set_disturbance(&mut self, d: DisturbanceParams) {
        self.disturbance = d;
    }

    pub fn reset(&mut self) {
        self.state = GimbalState {
            theta_az: 0.0,
            theta_el: 0.0,
            theta_roll: 0.0,
            omega_az: 0.0,
            omega_el: 0.0,
            omega_roll: 0.0,
            timestamp_ns: 0,
        };
        self.cmd_torque_az = 0.0;
        self.cmd_torque_el = 0.0;
        self.cmd_torque_roll = 0.0;
        self.tick_counter = 0;
    }

    pub fn set_running(&mut self, r: bool) { self.running = r; }

    pub fn get_state(&self) -> GimbalState { self.state }

    pub fn step_rk4(&mut self, dt: f64) {
        if !self.running { return; }
        self.tick_counter += 1;
        let params = self.params;
        let dist = self.disturbance;
        let cmd_torque = (self.cmd_torque_az, self.cmd_torque_el, self.cmd_torque_roll);
        let tick = self.tick_counter;

        let derivative = move |s: GimbalState| -> GimbalState {
            let (alpha_az, alpha_el, alpha_roll) = Self::compute_derivatives(
                s, params, dist, cmd_torque, tick
            );
            GimbalState {
                theta_az: s.omega_az,
                theta_el: s.omega_el,
                theta_roll: s.omega_roll,
                omega_az: alpha_az,
                omega_el: alpha_el,
                omega_roll: alpha_roll,
                timestamp_ns: (dt * 1e9) as u64,
            }
        };

        self.state = RK4Integrator::step(self.state, dt, derivative);
        self.state.timestamp_ns = (self.tick_counter as f64 * dt * 1e9) as u64;
    }

    fn compute_derivatives(
        s: GimbalState,
        params: GimbalParams,
        dist: DisturbanceParams,
        cmd: (f64, f64, f64),
        tick: u64,
    ) -> (f64, f64, f64) {
        let ca = cos(s.theta_el);
        let sa = sin(s.theta_el);
        let cb = cos(s.theta_roll);
        let sb = sin(s.theta_roll);

        let inertia_matrix = Matrix3::new(
            params.i_az + (params.i_el - params.i_az) * sa * sa + params.i_roll * ca * ca,
            0.0,
            -params.i_roll * ca,
            0.0,
            params.i_el * cb * cb + params.i_roll * sb * sb,
            0.0,
            -params.i_roll * ca,
            0.0,
            params.i_roll,
        );

        let coriolis = Vector3::new(
            (params.i_az - params.i_el) * s.omega_az * s.omega_el * sa * ca
                - params.i_roll * s.omega_el * s.omega_roll * sa
                + params.i_roll * s.omega_az * s.omega_el * sa * ca
                + (params.i_roll) * s.omega_az * s.omega_el * sa * ca,
            -0.5 * (params.i_az - params.i_el) * s.omega_az * s.omega_az * sa * ca
                + params.i_roll * s.omega_az * s.omega_roll * sa
                - (params.i_el - params.i_roll) * s.omega_el * s.omega_roll * sb * cb,
            (params.i_el - params.i_roll) * s.omega_el * s.omega_el * sb * cb
                - params.i_roll * s.omega_az * s.omega_el * sa * ca,
        );

        let friction = Vector3::new(
            Self::stribeck_friction(s.omega_az, params.coulomb_az, params.viscous_az, params.stribeck_az),
            Self::stribeck_friction(s.omega_el, params.coulomb_el, params.viscous_el, params.stribeck_el),
            Self::stribeck_friction(s.omega_roll, params.coulomb_roll, params.viscous_roll, params.stribeck_roll),
        );

        let r_cp = 0.85;
        let wind_torque = if dist.enable_wind {
            let wf = Vector3::new(dist.wind_force_x, dist.wind_force_y, dist.wind_force_z) * dist.wind_gain;
            let r_vec = Vector3::new(r_cp * ca, r_cp * sa, 0.0);
            r_vec.cross(&wf)
        } else {
            Vector3::zeros()
        };

        let mut torque = Vector3::new(cmd.0, cmd.1, cmd.2) - coriolis - friction + wind_torque;

        if dist.enable_noise {
            let mut rng = rand::thread_rng();
            let n = dist.noise_amplitude;
            torque.x += rng.gen_range(-n..=n);
            torque.y += rng.gen_range(-n..=n);
            torque.z += rng.gen_range(-n..=n);
            let _ = tick;
        }

        let inertia_inv = inertia_matrix.try_inverse().unwrap_or_else(|| Matrix3::identity());
        let alpha = inertia_inv * torque;

        (alpha.x, alpha.y, alpha.z)
    }

    fn stribeck_friction(omega: f64, coulomb: f64, viscous: f64, stribeck: f64) -> f64 {
        const STATIC_THRESHOLD: f64 = 0.001;
        let omega_abs = omega.abs();
        if omega_abs < STATIC_THRESHOLD {
            return coulomb * (omega / STATIC_THRESHOLD) + viscous * omega;
        }
        let stribeck_term = (coulomb + stribeck * (-omega_abs / 0.1).exp()) * omega.signum();
        stribeck_term + viscous * omega
    }
}

fn cos(x: f64) -> f64 { x.cos() }
fn sin(x: f64) -> f64 { x.sin() }
