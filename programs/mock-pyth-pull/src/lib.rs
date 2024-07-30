use anchor_lang::prelude::*;
use pyth_solana_receiver_sdk::price_update::{
    get_feed_id_from_hex, PriceFeedMessage, PriceUpdateV2, VerificationLevel,
};

declare_id!("rec5EKMGg6MxZYaMdyBfgwp4d5rB9T1VQH5pJv5LtFJ");

#[program]
pub mod mock_pyth_pull {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        feed_id: String,
        price: i64,
        conf: u64,
        expo: i32,
    ) -> Result<()> {
        let clock = Clock::get()?;

        *ctx.accounts.price = PriceUpdateV2 {
            write_authority: Pubkey::default(),
            verification_level: VerificationLevel::Full,
            price_message: PriceFeedMessage {
                feed_id: get_feed_id_from_hex(&feed_id)?,
                price: price,
                conf: conf,
                exponent: expo,
                publish_time: clock.unix_timestamp,
                prev_publish_time: 0,
                ema_price: price,
                ema_conf: conf,
            },
            posted_slot: clock.slot,
        };

        Ok(())
    }

    pub fn set_price(ctx: Context<SetPrice>, price: i64, conf: u64) -> Result<()> {
        let clock = Clock::get()?;

        ctx.accounts.price.price_message.prev_publish_time =
            ctx.accounts.price.price_message.publish_time;
        ctx.accounts.price.price_message.publish_time = clock.unix_timestamp;
        ctx.accounts.price.price_message.price = price;
        ctx.accounts.price.price_message.conf = conf;
        ctx.accounts.price.price_message.ema_price = price;
        ctx.accounts.price.price_message.ema_conf = conf;
        ctx.accounts.price.posted_slot = clock.slot;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        init,
        payer = payer,
        space = PriceUpdateV2::LEN
    )]
    pub price: Account<'info, PriceUpdateV2>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SetPrice<'info> {
    #[account(mut)]
    pub price: Account<'info, PriceUpdateV2>,
}
