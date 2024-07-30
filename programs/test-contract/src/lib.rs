use anchor_lang::prelude::*;
use pyth_sdk_solana::state::SolanaPriceAccount;
use pyth_solana_receiver_sdk::price_update::PriceUpdateV2;

declare_id!("8jm5jnUyUc6a55qsXFTxUSjM3doH5aCfWjwYKjuEJW53");

#[program]
pub mod test_contract {
    use pyth_solana_receiver_sdk::price_update::get_feed_id_from_hex;

    use super::*;

    pub fn read_price_push(ctx: Context<ReadPricePush>) -> Result<()> {
        let current_time = Clock::get()?.unix_timestamp;
        let price_feed = SolanaPriceAccount::account_info_to_feed(&ctx.accounts.price).unwrap();
        let price = price_feed.get_price_no_older_than(current_time, 50).unwrap();
        msg!("Price: {:?}", price);
        let ema_price = price_feed.get_ema_price_no_older_than(current_time, 50).unwrap();
        msg!("EMA Price: {:?}", ema_price);
        Ok(())
    }

    pub fn read_price_pull(ctx: Context<ReadPricePull>, feed_id: String) -> Result<()> {
        let price_update = &mut ctx.accounts.price;
        let price = price_update.get_price_no_older_than(
            &Clock::get()?,
            60,
            &get_feed_id_from_hex(&feed_id)?,
        )?;
        msg!("Price: {:?}, Conf: {:?}, Expo: {:?}", price.price, price.conf, price.exponent);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct ReadPricePush<'info> {
    /// CHECK: OK
    pub price: AccountInfo<'info>
}

#[derive(Accounts)]
pub struct ReadPricePull<'info> {
    pub price: Account<'info, PriceUpdateV2>
}
