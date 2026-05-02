use anchor_lang::prelude::*;

declare_id!("LUMApBfHYJyS8cykrVKxCZgkTeHkS8t1TDiHwynT96C");

// Admin pubkey — program authority, only admin can write data
const ADMIN: Pubkey = pubkey!("8RHmWcDDUpP6vLcmtiAdfHmqvvfwS3NaafrcX4rmptAk");

#[program]
pub mod luma {
    use super::*;

    /// Create a new feed PDA account
    /// Seed = [b"feed", creator.key, name]
    pub fn create_feed(ctx: Context<CreateFeed>, name: String, max_data_size: u32) -> Result<()> {
        let feed = &mut ctx.accounts.feed;
        feed.creator = ctx.accounts.creator.key();
        feed.name = name;
        feed.data = Vec::new();
        feed.bump = ctx.bumps.feed;

        Ok(())
    }

    /// Write data to feed — admin only
    pub fn write_data(ctx: Context<WriteData>, data: Vec<u8>) -> Result<()> {
        let feed = &mut ctx.accounts.feed;
        feed.data = data;

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(name: String, max_data_size: u32)]
pub struct CreateFeed<'info> {
    #[account(
        init,
        payer = creator,
        space = Feed::base_size(&name) + max_data_size as usize,
        seeds = [b"feed", creator.key().as_ref(), name.as_bytes()],
        bump
    )]
    pub feed: Account<'info, Feed>,

    #[account(mut)]
    pub creator: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct WriteData<'info> {
    #[account(mut)]
    pub feed: Account<'info, Feed>,

    /// Admin — must sign, but does NOT pay fees
    #[account(
        constraint = admin.key() == ADMIN @ LumaError::Unauthorized
    )]
    pub admin: Signer<'info>,

    /// Separate fee payer
    #[account(mut)]
    pub payer: Signer<'info>,
}

#[account]
pub struct Feed {
    pub creator: Pubkey,   // 32 bytes — feed creator
    pub name: String,      // 4 + N bytes — feed name, part of seed
    pub data: Vec<u8>,     // 4 + N bytes — API response data
    pub bump: u8,          // 1 byte — PDA bump
}

impl Feed {
    // 8 (discriminator) + 32 (creator) + 4 (name len) + 4 (data vec len) + 1 (bump)
    pub const FIXED_SIZE: usize = 8 + 32 + 4 + 4 + 1;

    pub fn base_size(name: &str) -> usize {
        Self::FIXED_SIZE + name.len()
    }
}

#[error_code]
pub enum LumaError {
    #[msg("Only admin can write data")]
    Unauthorized,
}
