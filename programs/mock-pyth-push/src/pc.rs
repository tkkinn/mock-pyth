use crate::*;
use anchor_lang::prelude::AccountInfo;
use bytemuck::{cast_slice_mut, from_bytes_mut, try_cast_slice_mut, Pod, Zeroable};
use std::cell::RefMut;

#[derive(Default, Copy, Clone)]
#[repr(C)]
pub struct AccKey {
    pub val: [u8; 32],
}

#[derive(Copy, Clone)]
#[repr(C)]
#[allow(dead_code)]
pub enum PriceStatus {
    Unknown,
    Trading,
    Halted,
    Auction,
}

impl Default for PriceStatus {
    fn default() -> Self {
        PriceStatus::Trading
    }
}

#[derive(Copy, Clone)]
#[repr(C)]
pub enum CorpAction {
    NoCorpAct,
}

impl Default for CorpAction {
    fn default() -> Self {
        CorpAction::NoCorpAct
    }
}

#[derive(Default, Copy, Clone)]
#[repr(C)]
pub struct PriceInfo {
    pub price: i64,
    pub conf: u64,
    pub status: PriceStatus,
    pub corp_act: CorpAction,
    pub pub_slot: u64,
}
#[derive(Default, Copy, Clone)]
#[repr(C)]
pub struct PriceComp {
    publisher: AccKey,
    agg: PriceInfo,
    latest: PriceInfo,
}

#[derive(Copy, Clone)]
#[repr(C)]
#[allow(dead_code, clippy::upper_case_acronyms)]
pub enum PriceType {
    Unknown,
    Price,
}

impl Default for PriceType {
    fn default() -> Self {
        PriceType::Price
    }
}

#[derive(Copy, Clone)]
#[repr(C)]
pub struct Rational {
    pub val: i64,
    pub numer: i64,
    pub denom: i64,
}

impl Default for Rational {
    fn default() -> Self {
        Rational {
            val: 0,
            numer: 0,
            denom: 0,
        }
    }
}

#[derive(Default, Copy, Clone)]
#[repr(C)]
pub struct Price {
    pub magic: u32,       // Pyth magic number.
    pub ver: u32,         // Program version.
    pub atype: u32,       // Account type.
    pub size: u32,        // Price account size.
    pub ptype: PriceType, // Price or calculation type.
    pub expo: i32,        // Price exponent.
    pub num: u32,         // Number of component prices.
    pub num_qt: u32,      // Number of quoters that make up aggregate
    pub last_slot: u64,        // slot of last valid (not unknown) aggregate price
    pub valid_slot: u64,       // valid slot-time of agg. price
    pub ema_price: Rational,   // exponentially moving average price
    pub ema_conf: Rational,    // exponentially moving average confidence interval
    pub timestamp: i64,        // unix timestamp of aggregate price
    pub min_pub: u8,           // min publishers for valid price
    pub drv2: u8,              // Space for future derived values.
    pub drv3: u16,             // Space for future derived values.
    pub drv4: u32,             // Space for future derived values.
    pub prod: AccKey,          // Product account key.
    pub next: AccKey,          // Next Price account in linked list.
    pub prev_slot: u64,        // valid slot of previous update
    pub prev_price: i64,       // aggregate price of previous update with TRADING status
    pub prev_conf: u64,        // confidence interval of previous update with TRADING status
    pub prev_timestamp: i64,   // unix timestamp of previous aggregate with TRADING status
    pub agg: PriceInfo,        // Aggregate price info.
    pub comp: [PriceComp; 32], // Price components one per quoter.
}

impl Price {
    #[inline]
    pub fn load<'a>(
        price_feed: &'a AccountInfo,
    ) -> std::result::Result<RefMut<'a, Price>, ProgramError> {
        let account_data: RefMut<'a, [u8]> =
            RefMut::map(price_feed.try_borrow_mut_data().unwrap(), |data| *data);

        let state: RefMut<'a, Self> = RefMut::map(account_data, |data| {
            from_bytes_mut(cast_slice_mut::<u8, u8>(try_cast_slice_mut(data).unwrap()))
        });
        Ok(state)
    }
}

#[cfg(target_endian = "little")]
unsafe impl Zeroable for Price {}

#[cfg(target_endian = "little")]
unsafe impl Pod for Price {}