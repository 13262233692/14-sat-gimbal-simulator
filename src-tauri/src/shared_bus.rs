use std::fs::OpenOptions;
use std::mem;
use std::path::PathBuf;
use std::sync::atomic::{AtomicU64, Ordering};

use memmap2::MmapMut;
use serde::{Deserialize, Serialize};

use crate::dynamics::GimbalState;

pub const FRAME_COUNT: usize = 256;

#[repr(C)]
#[derive(Copy, Clone, Debug)]
pub struct BusFrame {
    pub timestamp_ns: u64,
    pub theta_az: f64,
    pub theta_el: f64,
    pub theta_roll: f64,
    pub omega_az: f64,
    pub omega_el: f64,
    pub omega_roll: f64,
    pub frame_seq: u64,
}

impl Default for BusFrame {
    fn default() -> Self {
        BusFrame {
            timestamp_ns: 0,
            theta_az: 0.0,
            theta_el: 0.0,
            theta_roll: 0.0,
            omega_az: 0.0,
            omega_el: 0.0,
            omega_roll: 0.0,
            frame_seq: 0,
        }
    }
}

#[repr(C)]
pub struct BusHeader {
    pub write_index: AtomicU64,
    pub frame_size: u64,
    pub frame_count: u64,
    pub total_size: u64,
}

pub struct SharedMemoryBus {
    mmap: Option<MmapMut>,
    file_path: PathBuf,
    frame_size: usize,
    frame_count: usize,
    header_size: usize,
    seq_counter: u64,
}

#[derive(Serialize, Deserialize)]
pub struct BusMetadata {
    pub file_path: String,
    pub header_size: usize,
    pub frame_size: usize,
    pub frame_count: usize,
    pub total_size: usize,
}

impl SharedMemoryBus {
    pub fn new() -> Self {
        let frame_size = mem::size_of::<BusFrame>();
        let header_size = mem::size_of::<BusHeader>();
        let file_path = std::env::temp_dir().join("sat_gimbal_shared_bus.bin");

        SharedMemoryBus {
            mmap: None,
            file_path,
            frame_size,
            frame_count: FRAME_COUNT,
            header_size,
            seq_counter: 0,
        }
    }

    pub fn init_memory(&mut self) {
        let total_size = self.header_size + self.frame_size * self.frame_count;

        let file = OpenOptions::new()
            .read(true)
            .write(true)
            .create(true)
            .open(&self.file_path)
            .expect("Failed to open shared memory file");

        file.set_len(total_size as u64)
            .expect("Failed to set shared memory file size");

        let mut mmap = unsafe { MmapMut::map_mut(&file).expect("Failed to create memory mapping") };

        mmap.fill(0);

        let header_ptr = mmap.as_mut_ptr() as *mut BusHeader;
        unsafe {
            let header = &mut *header_ptr;
            header.write_index = AtomicU64::new(0);
            header.frame_size = self.frame_size as u64;
            header.frame_count = self.frame_count as u64;
            header.total_size = total_size as u64;
        }

        self.mmap = Some(mmap);
    }

    pub fn write_frame(&mut self, state: &GimbalState) {
        if self.mmap.is_none() {
            self.ensure_mmap();
        }

        if let Some(mmap) = self.mmap.as_mut() {
            let header_ptr = mmap.as_mut_ptr() as *mut BusHeader;
            let header = unsafe { &*header_ptr };
            let write_idx = header.write_index.load(Ordering::Relaxed) as usize;

            let frame_offset = self.header_size + write_idx * self.frame_size;
            let frame_ptr = unsafe { mmap.as_mut_ptr().add(frame_offset) as *mut BusFrame };

            self.seq_counter = self.seq_counter.wrapping_add(1);

            unsafe {
                let frame = &mut *frame_ptr;
                frame.timestamp_ns = state.timestamp_ns;
                frame.theta_az = state.theta_az;
                frame.theta_el = state.theta_el;
                frame.theta_roll = state.theta_roll;
                frame.omega_az = state.omega_az;
                frame.omega_el = state.omega_el;
                frame.omega_roll = state.omega_roll;
                frame.frame_seq = self.seq_counter;
            }

            let next_idx = (write_idx + 1) % self.frame_count;
            header.write_index.store(next_idx as u64, Ordering::Release);
        }
    }

    pub fn read_latest_frame(&self) -> Option<BusFrame> {
        if self.mmap.is_none() {
            return None;
        }

        if let Some(mmap) = &self.mmap {
            let header_ptr = mmap.as_ptr() as *const BusHeader;
            let header = unsafe { &*header_ptr };
            let write_idx = header.write_index.load(Ordering::Acquire) as usize;

            let read_idx = if write_idx == 0 {
                self.frame_count - 1
            } else {
                write_idx - 1
            };

            let frame_offset = self.header_size + read_idx * self.frame_size;
            let frame_ptr = unsafe { mmap.as_ptr().add(frame_offset) as *const BusFrame };

            Some(unsafe { *frame_ptr })
        } else {
            None
        }
    }

    pub fn get_metadata(&self) -> BusMetadata {
        let total_size = self.header_size + self.frame_size * self.frame_count;
        BusMetadata {
            file_path: self.file_path.to_string_lossy().to_string(),
            header_size: self.header_size,
            frame_size: self.frame_size,
            frame_count: self.frame_count,
            total_size,
        }
    }

    fn ensure_mmap(&mut self) {
        if self.mmap.is_some() {
            return;
        }

        let file = OpenOptions::new()
            .read(true)
            .write(true)
            .open(&self.file_path)
            .expect("Failed to open shared memory file");

        let mmap = unsafe { MmapMut::map_mut(&file).expect("Failed to create memory mapping") };
        self.mmap = Some(mmap);
    }
}

impl Default for SharedMemoryBus {
    fn default() -> Self {
        Self::new()
    }
}

unsafe impl Send for SharedMemoryBus {}
unsafe impl Sync for SharedMemoryBus {}
