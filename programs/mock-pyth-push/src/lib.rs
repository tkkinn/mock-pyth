use anchor_lang::prelude::*;
pub mod pc;
use pc::Price;

declare_id!("FsJ3A3u2vn5cTVofAjvy6y5kwABJAqYWpe4975bi2epH");

#[program]
pub mod mock_pyth_push {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, price: i64, expo: i32, conf: u64) -> Result<()> {
        let clock = Clock::get()?;
        let oracle = &ctx.accounts.price;

        let mut price_oracle = Price::load(oracle).unwrap();

        price_oracle.magic = 2712847316;
        price_oracle.ver = 2;
        price_oracle.atype = 3;
        price_oracle.size = 3312;
        price_oracle.ptype = pc::PriceType::Price;
        price_oracle.expo = expo;
        price_oracle.valid_slot = clock.slot;
        price_oracle.timestamp = clock.unix_timestamp;

        price_oracle.agg.price = price;
        price_oracle.agg.conf = conf;
        price_oracle.agg.status = pc::PriceStatus::Trading;
        price_oracle.agg.corp_act = pc::CorpAction::NoCorpAct;
        price_oracle.agg.pub_slot = clock.slot;

        price_oracle.ema_price.val = price;
        price_oracle.ema_price.numer = price;
        price_oracle.ema_price.denom = 1;

        price_oracle.ema_conf.val = conf as i64;
        price_oracle.ema_conf.numer = conf as i64;
        price_oracle.ema_conf.denom = 1;
        Ok(())
    }

    pub fn set_price(ctx: Context<SetPrice>, price: i64, conf: u64) -> Result<()> {
        let clock = Clock::get()?;
        let oracle = &ctx.accounts.price;
        let mut price_oracle = Price::load(oracle).unwrap();

        price_oracle.ema_price.val = price;
        price_oracle.ema_price.numer = price;
        price_oracle.ema_price.denom = 1;

        price_oracle.ema_conf.val = conf as i64;
        price_oracle.ema_conf.numer = conf as i64;
        price_oracle.ema_conf.denom = 1;

        price_oracle.agg.price = price as i64;
        price_oracle.agg.conf = conf;

        price_oracle.agg.pub_slot = clock.slot;
        price_oracle.timestamp = clock.unix_timestamp;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct SetPrice<'info> {
    /// CHECK: this program is just for testing
    #[account(mut)]
    pub price: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    /// CHECK: this program is just for testing
    #[account(mut)]
    pub price: AccountInfo<'info>,
}