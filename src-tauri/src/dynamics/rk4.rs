use std::ops::Add;
use std::ops::Mul;

pub trait StateVector:
    Copy + Clone + Add<Output = Self> + Mul<f64, Output = Self> + Sized
{
}

pub struct RK4Integrator;

impl RK4Integrator {
    pub fn step<S, F>(state: S, dt: f64, derivatives: F) -> S
    where
        S: StateVector,
        F: Fn(S) -> S,
    {
        let k1 = derivatives(state);
        let k2 = derivatives(state + k1 * (dt * 0.5));
        let k3 = derivatives(state + k2 * (dt * 0.5));
        let k4 = derivatives(state + k3 * dt);
        state + (k1 + k2 * 2.0 + k3 * 2.0 + k4) * (dt / 6.0)
    }
}
