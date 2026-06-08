# World Cup 2026 Bracket Predictor

Predict the FIFA World Cup 2026 groups, knockout rounds, and bonus picks. Compete with friends on a live leaderboard.

## Setup

### 1. Install dependencies

```bash
cd worldcup-predictor
npm install
```

### 2. Create a Supabase project (free)

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Go to **Settings > API** and copy your **Project URL** and **anon public key**
4. Go to **SQL Editor** and run the contents of `supabase-schema.sql`

### 3. Configure environment

```bash
cp .env.local.example .env.local
```

Fill in your Supabase URL and anon key in `.env.local`.

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Deploy to Vercel (free)

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com), import the repo
3. Add the two environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
4. Deploy — share the URL with your friends!

## Scoring

| Prediction | Points |
|---|---|
| Group: all 4 positions correct | +4 |
| Group: 3 positions correct | +3 |
| Group: 2 positions correct | +2 |
| Group: 1 position correct | +1 |
| Knockout: correct match winner | +3 |
| Tournament winner | +6 |
| Top scorer | +2 |
| Top assister | +2 |
| Best player | +3 |

## Admin

Visit `/admin` to enter actual tournament results. Scores on the leaderboard update automatically.
