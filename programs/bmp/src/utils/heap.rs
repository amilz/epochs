use anchor_lang::solana_program::{entrypoint::{HEAP_START_ADDRESS, HEAP_LENGTH}, msg};


/// Logs the current heap usage.
pub fn log_heap_usage() {
    const POS_PTR: *const usize = HEAP_START_ADDRESS as usize as *const usize;
    const TOP_ADDRESS: usize = HEAP_START_ADDRESS as usize + HEAP_LENGTH;

    unsafe {
        let pos = *POS_PTR; // Current position of the heap pointer
        if pos != 0 {
            let used_heap_space = TOP_ADDRESS - pos;
            msg!("Heap used: {} bytes", used_heap_space);
        } else {
            msg!("Heap has not been used yet.");
        }
    }
}
