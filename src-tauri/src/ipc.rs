use crate::dynamics::{DisturbanceParams, GimbalState, LuGreParams, AxisFrictionDiagnostics};
use crate::shared_bus::BusMetadata;
use crate::{GIMBAL_STATE, SHARED_BUS};

fn sanitize_state(state: GimbalState) -> GimbalState {
    let clamp_f = |v: f64, min: f64, max: f64| {
        if v.is_finite() { v.clamp(min, max) } else { 0.0 }
    };

    GimbalState {
        theta_az: clamp_f(state.theta_az, -1000.0, 1000.0),
        theta_el: clamp_f(state.theta_el, -1.57, 1.57),
        theta_roll: clamp_f(state.theta_roll, -1000.0, 1000.0),
        omega_az: clamp_f(state.omega_az, -100.0, 100.0),
        omega_el: clamp_f(state.omega_el, -100.0, 100.0),
        omega_roll: clamp_f(state.omega_roll, -100.0, 100.0),
        timestamp_ns: state.timestamp_ns,
    }
}

#[tauri::command]
pub fn get_bus_metadata() -> BusMetadata {
    let bus = SHARED_BUS.lock();
    bus.get_metadata()
}

#[tauri::command]
pub fn read_bus_frame() -> Option<GimbalState> {
    let gimbal = GIMBAL_STATE.lock();
    let state = gimbal.get_state();
    if state.is_valid() {
        Some(sanitize_state(state))
    } else {
        Some(sanitize_state(GimbalState {
            theta_az: 0.0,
            theta_el: 0.0,
            theta_roll: 0.0,
            omega_az: 0.0,
            omega_el: 0.0,
            omega_roll: 0.0,
            timestamp_ns: state.timestamp_ns,
        }))
    }
}

#[tauri::command]
pub fn set_torque(az: f64, el: f64, roll: f64) -> Result<(), String> {
    let clamp_f = |v: f64, min: f64, max: f64| {
        if v.is_finite() { v.clamp(min, max) } else { 0.0 }
    };

    let mut gimbal = GIMBAL_STATE.lock();
    gimbal.set_torque(
        clamp_f(az, -1000.0, 1000.0),
        clamp_f(el, -1000.0, 1000.0),
        clamp_f(roll, -1000.0, 1000.0),
    );
    Ok(())
}

#[tauri::command]
pub fn set_disturbance(disturbance: DisturbanceParams) -> Result<(), String> {
    let clamp_f = |v: f64, min: f64, max: f64| {
        if v.is_finite() { v.clamp(min, max) } else { 0.0 }
    };

    let sanitized = DisturbanceParams {
        wind_force_x: clamp_f(disturbance.wind_force_x, -1000.0, 1000.0),
        wind_force_y: clamp_f(disturbance.wind_force_y, -1000.0, 1000.0),
        wind_force_z: clamp_f(disturbance.wind_force_z, -1000.0, 1000.0),
        wind_gain: clamp_f(disturbance.wind_gain, 0.0, 100.0),
        enable_wind: disturbance.enable_wind,
        noise_amplitude: clamp_f(disturbance.noise_amplitude, 0.0, 10.0),
        enable_noise: disturbance.enable_noise,
    };

    let mut gimbal = GIMBAL_STATE.lock();
    gimbal.set_disturbance(sanitized);
    Ok(())
}

#[tauri::command]
pub fn reset_state() -> Result<(), String> {
    let mut gimbal = GIMBAL_STATE.lock();
    gimbal.reset();
    Ok(())
}

#[tauri::command]
pub fn start_simulation() -> Result<(), String> {
    let mut gimbal = GIMBAL_STATE.lock();
    gimbal.set_running(true);
    Ok(())
}

#[tauri::command]
pub fn stop_simulation() -> Result<(), String> {
    let mut gimbal = GIMBAL_STATE.lock();
    gimbal.set_running(false);
    Ok(())
}

#[tauri::command]
pub fn set_simulation_rate(hz: u64) -> Result<(), String> {
    Ok(())
}

#[tauri::command]
pub fn set_lugre_enabled(enabled: bool) -> Result<(), String> {
    let mut gimbal = GIMBAL_STATE.lock();
    gimbal.set_lugre_enabled(enabled);
    Ok(())
}

#[tauri::command]
pub fn set_feedforward_enabled(enabled: bool) -> Result<(), String> {
    let mut gimbal = GIMBAL_STATE.lock();
    gimbal.set_feedforward_enabled(enabled);
    Ok(())
}

#[tauri::command]
pub fn set_lugre_params_az(params: LuGreParams) -> Result<(), String> {
    let mut gimbal = GIMBAL_STATE.lock();
    gimbal.set_lugre_params_az(sanitize_lugre_params(params));
    Ok(())
}

#[tauri::command]
pub fn set_lugre_params_el(params: LuGreParams) -> Result<(), String> {
    let mut gimbal = GIMBAL_STATE.lock();
    gimbal.set_lugre_params_el(sanitize_lugre_params(params));
    Ok(())
}

#[tauri::command]
pub fn set_lugre_params_roll(params: LuGreParams) -> Result<(), String> {
    let mut gimbal = GIMBAL_STATE.lock();
    gimbal.set_lugre_params_roll(sanitize_lugre_params(params));
    Ok(())
}

#[tauri::command]
pub fn set_feedforward_gain(az: f64, el: f64, roll: f64) -> Result<(), String> {
    let clamp = |v: f64| if v.is_finite() { v.clamp(0.0, 10.0) } else { 0.0 };
    let mut gimbal = GIMBAL_STATE.lock();
    gimbal.set_feedforward_gain(clamp(az), clamp(el), clamp(roll));
    Ok(())
}

#[tauri::command]
pub fn get_friction_diagnostics() -> [AxisFrictionDiagnostics; 3] {
    let gimbal = GIMBAL_STATE.lock();
    gimbal.get_friction_diagnostics()
}

fn sanitize_lugre_params(p: LuGreParams) -> LuGreParams {
    let clamp = |v: f64, min: f64, max: f64| {
        if v.is_finite() { v.clamp(min, max) } else { min }
    };
    LuGreParams {
        sigma0: clamp(p.sigma0, 100.0, 1e6),
        sigma1: clamp(p.sigma1, 0.1, 1000.0),
        sigma2: clamp(p.sigma2, 0.0, 10.0),
        fc: clamp(p.fc, 0.0, 10.0),
        fs: clamp(p.fs, 0.0, 20.0),
        vs: clamp(p.vs, 0.001, 1.0),
        preload: clamp(p.preload, -10.0, 10.0),
        stiction_force: clamp(p.stiction_force, 0.0, 20.0),
    }
}
