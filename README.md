# Brickwise 磚研

Hong Kong first-hand property price list analysis web app.

## Setup

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in Supabase URL + anon key.
3. Create a Supabase project and run `supabase/migrations/0001_init.sql` then `supabase/seed.sql`.
4. For the seed to be readable by anon RLS, create an auth user whose id matches the demo profile
   (`00000000-0000-0000-0000-000000000001`) or insert the profile row with your own user id and
   update the seed's `user_id` / `project_id` accordingly.
5. `npm run dev` and open http://localhost:3000

## Demo results page

Visit `/projects/00000000-0000-0000-0000-000000000100/results` to see the seeded compare page.

## Deploy to Netlify

1. Push to GitHub.
2. Connect repo to Netlify; build command `npm run build`, publish `.next`.
3. Set env vars `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Disclaimer

本平台提供之分析及資料僅供參考，並非投資意見 / 法律意見 / 按揭建議。