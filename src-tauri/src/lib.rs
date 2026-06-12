use std::sync::Arc;
use parking_lot::Mutex;
use tauri::Manager;

pub mod dynamics;
pub mod shared_bus;
pub mod ipc;

use dynamics::GimbalDynamics;
use shared_bus::SharedMemoryBus;

lazy_static::lazy_static! {
    pub static ref GIMBAL_STATE: Arc<Mutex<GimbalDynamics>> = Arc::new(Mutex::new(GimbalDynamics::new()));
    pub static ref SHARED_BUS: Arc<Mutex<SharedMemoryBus>> = Arc::new(Mutex::new(SharedMemoryBus::new()));
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let mut bus = SHARED_BUS.lock();
            bus.init_memory();

            let app_handle = app.handle().clone();
            std::thread::spawn(move || {
                start_simulation_loop(app_handle);
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            ipc::get_bus_metadata,
            ipc::read_bus_frame,
            ipc::set_torque,
            ipc::set_disturbance,
            ipc::reset_state,
            ipc::start_simulation,
            ipc::stop_simulation,
            ipc::set_simulation_rate,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn start_simulation_loop(app_handle: tauri::AppHandle) {
    const TICK_RATE_HZ: u64 = 1000;
    const TICK_NS: u64 = 1_000_000_000 / TICK_RATE_HZ;

    let tick_duration = std::time::Duration::from_nanos(TICK_NS);
    let mut next_tick = std::time::Instant::now();
    let dt = 1.0 / TICK_RATE_HZ as f64;

    loop {
        {
            let mut gimbal = GIMBAL_STATE.lock();
            gimbal.step_rk4(dt);

            let state = gimbal.get_state();
            let mut bus = SHARED_BUS.lock();
            bus.write_frame(&state);
        }

        let _ = app_handle.emit("gimbal_tick", 1u8);

        next_tick += tick_duration;
        let now = std::time::Instant::now();
        if now < next_tick {
            std::thread::sleep(next_tick - now);
        }
    }
}
