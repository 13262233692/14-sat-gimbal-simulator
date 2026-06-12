use std::ops::{Add, Mul};
use serde::{Serialize, Deserialize};
use nalgebra::{Matrix3, UnitQuaternion, Quaternion, Vector3};
use super::rk4::RK4Integrator;
use rand::Rng;

const SINGULARITY_THRESHOLD: f64 = 0.087;
const SINGULARITY_DAMPING: f64 = 1500.0;
const MAX_OMEGA_AZ: f64 = 25.0;
const MAX_OMEGA_EL: f64 = 15.0;
const MAX_OMEGA_ROLL: f64 = 30.0;
const MAX_ALPHA_AZ: f64 = 80.0;
const MAX_ALPHA_EL: f64 = 60.0;
const MAX_ALPHA_ROLL: f64 = 100.0;
const REGULARIZATION_EPSILON: f64 = 1e-4;

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

impl GimbalState {
    pub fn is_valid(&self) -> bool {
        self.theta_az.is_finite()
            && self.theta_el.is_finite()
            && self.theta_roll.is_finite()
            && self.omega_az.is_finite()
            && self.omega_el.is_finite()
            && self.omega_roll.is_finite()
    }

    pub fn clamp_velocities(&mut self) {
        self.omega_az = self.omega_az.clamp(-MAX_OMEGA_AZ, MAX_OMEGA_AZ);
        self.omega_el = self.omega_el.clamp(-MAX_OMEGA_EL, MAX_OMEGA_EL);
        self.omega_roll = self.omega_roll.clamp(-MAX_OMEGA_ROLL, MAX_OMEGA_ROLL);
    }

    pub fn to_quaternion(&self) -> UnitQuaternion<f64> {
        let q_az = UnitQuaternion::from_axis_angle(&Vector3::y_axis(), self.theta_az);
        let q_el = UnitQuaternion::from_axis_angle(&Vector3::x_axis(), self.theta_el);
        let q_roll = UnitQuaternion::from_axis_angle(&Vector3::z_axis(), self.theta_roll);
        q_az * q_el * q_roll
    }
}

impl Add for GimbalState {
    type Output = Self;
    fn add(self, rhs: Self) -> Self {
        let mut result = GimbalState {
            theta_az: self.theta_az + rhs.theta_az,
            theta_el: self.theta_el + rhs.theta_el,
            theta_roll: self.theta_roll + rhs.theta_roll,
            omega_az: self.omega_az + rhs.omega_az,
            omega_el: self.omega_el + rhs.omega_el,
            omega_roll: self.omega_roll + rhs.omega_roll,
            timestamp_ns: self.timestamp_ns + rhs.timestamp_ns,
        };
        result.normalize_angles();
        result
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
    last_valid_state: GimbalState,
    params: GimbalParams,
    disturbance: DisturbanceParams,
    cmd_torque_az: f64,
    cmd_torque_el: f64,
    cmd_torque_roll: f64,
    running: bool,
    tick_counter: u64,
    singularity_crossed: bool,
    q_transition_start: Option<UnitQuaternion<f64>>,
    q_transition_end: Option<UnitQuaternion<f64>>,
    transition_progress: f64,
}

impl GimbalDynamics {
    pub fn new() -> Self {
        let initial = GimbalState {
            theta_az: 0.0,
            theta_el: 0.0,
            theta_roll: 0.0,
            omega_az: 0.0,
            omega_el: 0.0,
            omega_roll: 0.0,
            timestamp_ns: 0,
        };
        GimbalDynamics {
            state: initial,
            last_valid_state: initial,
            params: GimbalParams::default(),
            disturbance: DisturbanceParams::default(),
            cmd_torque_az: 0.0,
            cmd_torque_el: 0.0,
            cmd_torque_roll: 0.0,
            running: true,
            tick_counter: 0,
            singularity_crossed: false,
            q_transition_start: None,
            q_transition_end: None,
            transition_progress: 1.0,
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
        let initial = GimbalState {
            theta_az: 0.0,
            theta_el: 0.0,
            theta_roll: 0.0,
            omega_az: 0.0,
            omega_el: 0.0,
            omega_roll: 0.0,
            timestamp_ns: 0,
        };
        self.state = initial;
        self.last_valid_state = initial;
        self.cmd_torque_az = 0.0;
        self.cmd_torque_el = 0.0;
        self.cmd_torque_roll = 0.0;
        self.tick_counter = 0;
        self.singularity_crossed = false;
        self.q_transition_start = None;
        self.q_transition_end = None;
        self.transition_progress = 1.0;
    }

    pub fn set_running(&mut self, r: bool) { self.running = r; }

    pub fn get_state(&self) -> GimbalState { self.state }

    pub fn step_rk4(&mut self, dt: f64) {
        if !self.running { return; }
        self.tick_counter += 1;

        let ca = cos(self.state.theta_el);
        let in_singular_zone = ca.abs() < SINGULARITY_THRESHOLD;

        if in_singular_zone && !self.singularity_crossed {
            self.singularity_crossed = true;
            self.q_transition_start = Some(self.state.to_quaternion());
        } else if !in_singular_zone && self.singularity_crossed {
            self.singularity_crossed = false;
            self.q_transition_end = Some(self.state.to_quaternion());
            self.transition_progress = 0.0;
        }

        if self.transition_progress < 1.0 {
            self.transition_progress = (self.transition_progress + dt * 2.0).min(1.0);
            if let (Some(q_start), Some(q_end)) = (self.q_transition_start, self.q_transition_end) {
                let q_slerp = q_start.slerp(&q_end, self.transition_progress);
                self.apply_quaternion_correction(q_slerp);
            }
        }

        let params = self.params;
        let dist = self.disturbance;
        let cmd_torque = (self.cmd_torque_az, self.cmd_torque_el, self.cmd_torque_roll);
        let tick = self.tick_counter;
        let prev_state = self.state;

        let derivative = move |s: GimbalState| -> GimbalState {
            let (alpha_az, alpha_el, alpha_roll) = Self::compute_derivatives(
                s, params, dist, cmd_torque, tick
            );

            let mut d_state = GimbalState {
                theta_az: s.omega_az,
                theta_el: s.omega_el,
                theta_roll: s.omega_roll,
                omega_az: alpha_az,
                omega_el: alpha_el,
                omega_roll: alpha_roll,
                timestamp_ns: (dt * 1e9) as u64,
            };

            d_state.clamp_velocities();
            d_state
        };

        let mut new_state = RK4Integrator::step(prev_state, dt, derivative);
        new_state.normalize_angles();
        new_state.clamp_velocities();

        if new_state.is_valid() {
            self.state = new_state;
            self.last_valid_state = new_state;
        } else {
            self.state = self.last_valid_state;
            self.state.omega_az *= 0.5;
            self.state.omega_el *= 0.5;
            self.state.omega_roll *= 0.5;
        }

        self.state.timestamp_ns = (self.tick_counter as f64 * dt * 1e9) as u64;
    }

    fn apply_quaternion_correction(&mut self, q: UnitQuaternion<f64>) {
        let (roll, pitch, yaw) = q.euler_angles();
        self.state.theta_az = yaw;
        self.state.theta_el = pitch;
        self.state.theta_roll = roll;
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

        let ca_abs = ca.abs();
        let singularity_factor = if ca_abs < SINGULARITY_THRESHOLD {
            (SINGULARITY_THRESHOLD - ca_abs) / SINGULARITY_THRESHOLD
        } else {
            0.0
        };

        let damping_torque_az = -s.omega_az * SINGULARITY_DAMPING * singularity_factor;
        let damping_torque_roll = -s.omega_roll * SINGULARITY_DAMPING * singularity_factor * 0.5;

        let i_az_eff = params.i_az + singularity_factor * 10.0;

        let inertia_matrix = Matrix3::new(
            i_az_eff + (params.i_el - i_az_eff) * sa * sa + params.i_roll * ca * ca,
            0.0,
            -params.i_roll * ca,
            0.0,
            params.i_el * cb * cb + params.i_roll * sb * sb,
            0.0,
            -params.i_roll * ca,
            0.0,
            params.i_roll + REGULARIZATION_EPSILON,
        );

        let regularized_inertia = inertia_matrix
            + Matrix3::from_diagonal(&Vector3::new(
                REGULARIZATION_EPSILON,
                REGULARIZATION_EPSILON,
                REGULARIZATION_EPSILON,
            ));

        let coriolis = Vector3::new(
            (i_az_eff - params.i_el) * s.omega_az * s.omega_el * sa * ca
                - params.i_roll * s.omega_el * s.omega_roll * sa
                + params.i_roll * s.omega_az * s.omega_el * sa * ca
                + params.i_roll * s.omega_az * s.omega_el * sa * ca,
            -0.5 * (i_az_eff - params.i_el) * s.omega_az * s.omega_az * sa * ca
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

        let singular_damping = Vector3::new(damping_torque_az, 0.0, damping_torque_roll);

        let mut torque = Vector3::new(cmd.0, cmd.1, cmd.2)
            - coriolis
            - friction
            + wind_torque
            + singular_damping;

        torque.x = torque.x.clamp(-params.max_torque_az, params.max_torque_az);
        torque.y = torque.y.clamp(-params.max_torque_el, params.max_torque_el);
        torque.z = torque.z.clamp(-params.max_torque_roll, params.max_torque_roll);

        if dist.enable_noise {
            let mut rng = rand::thread_rng();
            let n = dist.noise_amplitude;
            torque.x += rng.gen_range(-n..=n);
            torque.y += rng.gen_range(-n..=n);
            torque.z += rng.gen_range(-n..=n);
            let _ = tick;
        }

        let cond = regularized_inertia.try_inverse();
        let inertia_inv = match cond {
            Some(inv) => {
                let det = regularized_inertia.determinant();
                if det.abs() < 1e-6 {
                    Matrix3::identity() * (1.0 / params.i_az)
                } else {
                    inv
                }
            }
            None => Matrix3::identity() * (1.0 / params.i_az),
        };

        let alpha = inertia_inv * torque;

        let alpha_x = alpha.x.clamp(-MAX_ALPHA_AZ, MAX_ALPHA_AZ);
        let alpha_y = alpha.y.clamp(-MAX_ALPHA_EL, MAX_ALPHA_EL);
        let alpha_z = alpha.z.clamp(-MAX_ALPHA_ROLL, MAX_ALPHA_ROLL);

        (
            if alpha_x.is_finite() { alpha_x } else { 0.0 },
            if alpha_y.is_finite() { alpha_y } else { 0.0 },
            if alpha_z.is_finite() { alpha_z } else { 0.0 },
        )
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

trait NormalizeAngles {
    fn normalize_angles(&mut self);
}

impl NormalizeAngles for GimbalState {
    fn normalize_angles(&mut self) {
        self.theta_az = normalize_angle(self.theta_az);
        self.theta_el = self.theta_el.clamp(
            -std::f64::consts::FRAC_PI_2 + 0.001,
            std::f64::consts::FRAC_PI_2 - 0.001,
        );
        self.theta_roll = normalize_angle(self.theta_roll);
    }
}

fn normalize_angle(angle: f64) -> f64 {
    let two_pi = std::f64::consts::PI * 2.0;
    let mut result = angle % two_pi;
    if result > std::f64::consts::PI {
        result -= two_pi;
    } else if result < -std::f64::consts::PI {
        result += two_pi;
    }
    result
}

fn cos(x: f64) -> f64 { x.cos() }
fn sin(x: f64) -> f64 { x.sin() }

impl super::rk4::StateVector for UnitQuaternion<f64> {}
