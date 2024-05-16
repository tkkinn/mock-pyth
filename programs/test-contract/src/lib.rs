use anchor_lang::prelude::*;
use pyth_sdk_solana::state::SolanaPriceAccount;

declare_id!("8jm5jnUyUc6a55qsXFTxUSjM3doH5aCfWjwYKjuEJW53");

#[program]
pub mod test_contract {
    use super::*;

    pub fn read_price(ctx: Context<ReadPrice>) -> Result<()> {
        let current_time = Clock::get()?.unix_timestamp;
        let price_feed = SolanaPriceAccount::account_info_to_feed(&ctx.accounts.price).unwrap();
        let price = price_feed.get_price_no_older_than(current_time, 50).unwrap();
        msg!("Price: {:?}", price);
        let ema_price = price_feed.get_ema_price_no_older_than(current_time, 50).unwrap();
        msg!("EMA Price: {:?}", ema_price);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct ReadPrice<'info> {
    /// CHECK: OK
    pub price: AccountInfo<'info>
}
