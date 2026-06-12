use crate::dynamics::{DisturbanceParams, GimbalState};
use crate::shared_bus::BusMetadata;
use crate::{GIMBAL_STATE, SHARED_BUS};

#[tauri::command]
pub fn get_bus_metadata() -> BusMetadata {
    let bus = SHARED_BUS.lock();
    bus.get_metadata()
}

#[tauri::command]
pub fn read_bus_frame() -> Option<GimbalState> {
    let gimbal = GIMBAL_STATE.lock();
    Some(gimbal.get_state())
}

#[tauri::command]
pub fn set_torque(az: f64, el: f64, roll: f64) -> Result<(), String> {
    let mut gimbal = GIMBAL_STATE.lock();
    gimbal.set_torque(az, el, roll);
    Ok(())
}

#[tauri::command]
pub fn set_disturbance(disturbance: DisturbanceParams) -> Result<(), String> {
    let mut gimbal = GIMBAL_STATE.lock();
    gimbal.set_disturbance(disturbance);
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
