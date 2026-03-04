# SHADOWBROKERS

AI-powered financial intelligence platform. Aggregates news from 6 RSS feeds, classifies sentiment with GPT-4o-mini, tracks predictions against real price movements, and delivers live market signals through a terminal-styled dashboard.

**Live**: [shadowbrokers-woad.vercel.app](https://shadowbrokers-woad.vercel.app)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.1.6, React 19, TypeScript 5 |
| Database & Auth | Supabase (Postgres + RLS + Auth) |
| AI | OpenAI GPT-4o-mini (structured JSON output) |
| Data Feeds | RSS via rss-parser, Yahoo Finance API |
| Charts | Recharts |
| Styling | Tailwind CSS 4, custom terminal theme |
| Validation | Zod 4 |
| Hosting | Vercel (Hobby plan) |

---

## Architecture

```
RSS Feeds (6 sources)
    |
    v
[rss-parser] --> articles table
    |
    v
[GPT-4o-mini] --> analyses table
    |                   |
    v                   v
ticker_summaries    prediction_accuracy
    |                   |
    v                   v
Dashboard           Accuracy tracking
    |
    v
Yahoo Finance --> price_cache --> Live prices
```

### Data Pipeline

Runs daily at 08:00 UTC via Vercel Cron (or manually from admin panel):

1. **RSS Fetch** — Pulls from Reuters, CNBC, Yahoo Finance, MarketWatch, Financial Times, AP Business. Deduplicates by URL. Upserts to `articles` table.
2. **AI Analysis** — Takes up to 15 unanalyzed articles, processes in batches of 8. GPT-4o-mini extracts tickers, sentiment (bullish/bearish/neutral), confidence (0.0–1.0), predicted direction (up/down/flat), predicted magnitude (low/medium/high), company name, sector, topic, and reasoning. Inserts to `analyses` table.
3. **Ticker Summaries** — Aggregates the last 7 days of analyses per ticker. Calculates overall sentiment, average confidence, article counts. Upserts to `ticker_summaries`.
4. **Accuracy Check** — For analyses 1–3 days old, fetches current price from Yahoo Finance. Compares predicted direction against actual movement (>0.5% = up, <-0.5% = down, else flat). Records to `prediction_accuracy`.
5. **Alert Check** — Evaluates all active user alerts against current ticker sentiments. Triggers notifications with 24-hour cooldown.

### AI Analysis Schema

Each article produces per-ticker results with these fields:

| Field | Type | Description |
|-------|------|-------------|
| `ticker` | string | US market symbol (NYSE/NASDAQ) |
| `name` | string | Official company/fund name |
| `description` | string | What the company does (1 sentence) |
| `sector` | string | One of 15 sectors |
| `topic` | string | News theme driving the signal (2–5 words) |
| `asset_type` | "stock" \| "etf" | Security classification |
| `sentiment` | "bullish" \| "neutral" \| "bearish" | Market impact direction |
| `confidence` | 0.0–1.0 | How directly the article impacts the ticker |
| `reasoning` | string | 1–2 sentence explanation |
| `predicted_direction` | "up" \| "flat" \| "down" | Expected price movement |
| `predicted_magnitude` | "low" \| "medium" \| "high" | <1%, 1–3%, >3% expected move |

**Sectors**: Technology, Energy, Financials, Healthcare, Consumer Discretionary, Consumer Staples, Industrials, Materials, Real Estate, Utilities, Communication Services, Broad Market, Commodities, Fixed Income, Cryptocurrency

### AI Configuration

| Setting | Value |
|---------|-------|
| Model | gpt-4o-mini |
| Temperature | 0.2 |
| Batch size | 8 articles |
| Max tokens | 8,192 |
| Response format | Structured JSON schema (strict mode) |

---

## Pages

### Landing Page (`/`)

Public homepage with waitlist signup. No login/signup links exposed.

- **Glitch title** — "SHADOWBROKERS" with CSS pseudo-element glitch animation
- **Terminal boot sequence** — Staggered line reveals showing system initialization
- **Email waitlist form** — Terminal-styled input (`$ [email] EXECUTE`). On submit, stores email in `waitlist` table and returns queue position
- **Features grid** — 6 capability cards (AI Sentiment, Live Prices, Comparison, Portfolio, Alerts, Accuracy) with IntersectionObserver fade-in animations
- **Live preview** — 6 blurred demo ticker cards behind a "CLASSIFIED — EARLY ACCESS ONLY" overlay
- **Stats bar** — 6 RSS Sources, 50+ Daily Articles, GPT-4O, Live Prices
- **Animated grid background** — Scrolling cyan gridlines via CSS

### Dashboard (`/dashboard`)

Main application hub. Force-dynamic rendering (fresh data on every page load). Protected route.

- **Header** — Logo, search bar (hidden on mobile), notification bell with unread count, user menu dropdown. `z-50` to stay above all content.
- **Index bar** — Live SPY, QQQ, DIA prices with % change
- **Watchlist section** — Horizontal scroll of user's starred tickers with live prices and sentiment signals
- **Tab navigation** — 4 tabs with keyboard shortcuts:
  - `1` OVERVIEW — Market summary, top movers, sector heatmap
  - `2` TICKERS — Grid of top 20 tickers + sortable table of all tickers
  - `3` NEWS — Articles feed with source breakdown
  - `4` CHARTS — 30-day market sentiment trend (Recharts area chart)
  - `C` — Jump to compare page

**Market Summary** (Overview tab):
- Market bias indicator (BULLISH/BEARISH/NEUTRAL) with color coding
- Stat grid: total tickers, articles, signals, bullish/bearish/neutral counts, active sectors
- Sentiment distribution bar (proportional green/orange/red)
- Trending topics (linked to topic pages)
- Active sectors list

**Ticker Grid** (Tickers tab):
Each card shows: ticker symbol, company name, asset type badge, overall sentiment with colored indicator, live price with % change, sector tag, topic tag, confidence bar, sentiment breakdown (B/N/R counts). Left border colored by sentiment.

**Articles Feed** (News tab):
Each article shows: sentiment indicator dot, title, description, source with color coding (Reuters=blue, CNBC=orange, Yahoo=green, MarketWatch=purple, FT=pink, AP=cyan), time ago, related ticker badges. Links to original article.

### Ticker Detail (`/ticker/[ticker]`)

Deep-dive view for a single stock or ETF. Protected route.

- **Header** — Ticker symbol, star/watchlist toggle, asset type badge, sector badge, company name and description
- **Live price panel** — Current price, % change (colored), market cap, day high/low, volume, previous close
- **Sentiment panel** — Overall sentiment with directional icon (triangle up/down, diamond for neutral), confidence score, sentiment breakdown bar and counts
- **Sentiment trend chart** — 30-day area chart (bullish/bearish/neutral areas)
- **Topics** — News themes affecting this ticker (clickable, link to topic pages)
- **Analysis history** — 50 most recent analyses, each showing:
  - Article title (linked to source), source name, publish date
  - Sentiment label with confidence percentage
  - Predicted direction + magnitude
  - AI reasoning text
  - Topic tag
- **Alert manager** — Set alerts for bullish, bearish, or any change conditions

### Portfolio (`/portfolio`)

Personal investment position tracker. User-scoped, protected route.

- **Summary bar** — Total portfolio value, total cost basis, P&L in dollars, P&L percentage
- **Add position form** — Ticker input, shares, average price per share
- **Positions table**:
  - Ticker (linked to detail page)
  - Shares held
  - Average cost per share
  - Current price with % change
  - Position value
  - P&L $ and % (green/red colored)
  - Current sentiment signal
  - Delete button
- **Calculations** — P&L = (current_price - avg_price) * shares. All prices fetched live from Yahoo Finance.

### Alerts (`/alerts`)

Manage sentiment-based alerts. User-scoped, protected route.

- **Alert list** — Each alert shows:
  - Ticker (linked)
  - Condition badge (Bullish / Bearish / Any Change)
  - Active/Paused status with colored indicator
  - Last triggered timestamp
  - Pause/Resume toggle button
  - Delete button
- **Empty state** — "No alerts. Go to a ticker page to set one."
- **Trigger logic** — Checked during daily pipeline. 24-hour cooldown between triggers. Creates notification when condition matches current sentiment.

### Compare (`/compare?tickers=AAPL,MSFT,GOOGL,TSLA`)

Side-by-side comparison of up to 4 tickers. Protected route.

- **Ticker selector** — Add tickers via input, remove with X button. URL updates dynamically.
- **Per-ticker card**:
  - Sentiment signal (colored)
  - Current price and % change
  - Confidence score
  - Article count
  - Bullish/bearish/neutral counts
  - Sector and topic
  - 30-day sentiment trend chart
- **Layout** — Responsive grid (1–4 columns based on ticker count)

### Topic (`/topic/[topic]`)

News topic aggregation page. Protected route.

- **Topic header** — Topic name with sentiment-colored accent
- **Stats** — Overall sentiment, confidence, total signals, affected tickers count, related articles count
- **Sentiment distribution** — Proportional bar (bullish/bearish/neutral %)
- **Affected tickers** — List of tickers impacted by this topic with signal count (linked to detail pages)
- **Related articles** — All articles tagged with this topic

### Login (`/login`)

Email/password authentication. Accessible but not linked from homepage.

- Email and password inputs
- Error display
- Redirect support (`?redirect=` query parameter from middleware)
- "ACCESS RESTRICTED — JOIN WAITLIST" link instead of signup

### Signup (`/signup`)

Account creation. **Currently blocked** — middleware redirects unauthenticated users to homepage.

### Admin Panel (`/admin`)

Full system administration. Requires admin email (`alexander.gese07@gmail.com`).

**5 tabs:**

| Tab | Features |
|-----|----------|
| **OVERVIEW** | Stats grid (articles, analyses, tickers, cache entries, users). Action buttons: Run Analysis, Full Pipeline, Clear Cache. Status output. Last 20 analyses list. |
| **USERS** | Table of all registered users: email, display name, created at, last sign in. Refresh button. Read-only. |
| **DATA** | Browse articles (paginated, 20/page, delete each row). Browse analyses (paginated, delete each row). Re-analyze ticker input. Purge old data by days threshold. |
| **SYSTEM** | RSS sources table (6 feeds: name, URL, source key). AI config display (model, temperature, batch size, max tokens). Environment variable status (SET/UNSET, values never shown). Cache entry count. |
| **ANALYTICS** | Prediction accuracy (% correct, correct/total counts). Articles by source (bar chart breakdown). Top 20 tickers by article mentions. Sentiment distribution (bullish/bearish/neutral counts + visual bar). |

---

## Components

### Dashboard

| Component | Description |
|-----------|-------------|
| `DashboardHeader` | Logo, search bar, notification bell, user menu. `z-50` positioning. |
| `DashboardShell` | Layout manager with tab bar and keyboard shortcuts. |
| `IndexBar` | SPY/QQQ/DIA live prices and % changes. |
| `SearchBar` | Real-time search with debouncing. Searches tickers (symbol/name/sector) and topics. Dropdown results. |
| `TabBar` | 4-tab navigation (Overview, Tickers, News, Charts) with keyboard shortcut labels. |
| `MarketSummary` | Market bias, stat grid, sentiment bar, trending topics, active sectors. |
| `TickerGrid` | Responsive grid of top 20 ticker cards with live prices. |
| `TickerCard` | Ticker symbol, name, sentiment indicator, price, sector/topic tags, confidence bar, sentiment breakdown. |
| `ArticlesFeed` | Scrollable article list with source color coding, sentiment dots, ticker badges. |
| `WatchlistSection` | Horizontal scrollable watchlist with live prices and sentiment. |

### Charts

| Component | Description |
|-----------|-------------|
| `SentimentTrend` | Area chart (Recharts) showing bullish/bearish/neutral over 7d/14d/30d. Gradient fills. |
| `MarketSentimentChart` | Aggregate market-wide sentiment trend. |

### Auth & Alerts

| Component | Description |
|-----------|-------------|
| `AuthProvider` | React context for user state. SSR initialization + client-side Supabase auth listener. |
| `UserMenu` | Dropdown menu: Dashboard, Portfolio, Alerts, Admin (if admin), Logout. |
| `AlertManager` | Condition selector (Bullish/Bearish/Any Change) + Set Alert button. Per-ticker. |
| `NotificationBell` | Bell icon with unread count badge. Dropdown notification list with mark-as-read. |
| `StarButton` | Watchlist add/remove toggle. Star icon (filled/outline). |

---

## API Routes

### Public

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/waitlist` | Join email waitlist. Returns queue position. |
| GET | `/api/tickers` | List ticker summaries. Params: `asset_type`, `limit` (max 100). |
| GET | `/api/ticker/[ticker]` | Ticker detail + 50 most recent analyses with articles. |
| GET | `/api/articles` | Paginated articles. Params: `limit`, `offset`. Includes related analyses. |
| GET | `/api/prices?tickers=AAPL,MSFT` | Live prices for up to 20 tickers. 15-min cache. |
| GET | `/api/prices/[ticker]` | Single ticker price. |
| GET | `/api/search?q=apple` | Search tickers and topics. 10 tickers + 5 topics max. |
| GET | `/api/indices` | SPY, QQQ, DIA prices and % changes. |
| GET | `/api/charts/sentiment` | Sentiment trend data. Params: `ticker`, `range` (7d/14d/30d). |
| GET | `/api/accuracy` | Prediction accuracy stats. Optional `ticker` filter. |

### User-Scoped (require auth)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/watchlist` | Get user's watchlist. |
| POST | `/api/watchlist` | Add ticker to watchlist. |
| DELETE | `/api/watchlist` | Remove ticker from watchlist. |
| GET | `/api/portfolio` | Get user's portfolio positions. |
| POST | `/api/portfolio` | Add/update position (upsert on user_id + ticker). |
| DELETE | `/api/portfolio` | Remove position. |
| GET | `/api/alerts` | Get user's alerts. |
| POST | `/api/alerts` | Create alert. Body: `{ ticker, condition }`. |
| PATCH | `/api/alerts` | Toggle alert active/paused. |
| DELETE | `/api/alerts` | Delete alert. |
| GET | `/api/notifications` | Get last 20 notifications + unread count. |
| PATCH | `/api/notifications` | Mark notification(s) as read. |

### Admin-Only

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/analyze` | Run AI analysis pipeline. Optional `?skipRss=true`. 60s max. |
| GET | `/api/cron/analyze` | Scheduled daily pipeline. Bearer token auth (CRON_SECRET). |
| POST | `/api/admin/cron` | Manual full pipeline trigger. |
| GET | `/api/admin/stats` | System stats + last 20 analyses. |
| GET | `/api/admin/users` | List all registered users. |
| POST | `/api/admin/data` | Data management (browse/delete articles & analyses, reanalyze ticker, purge old data). |
| DELETE | `/api/admin/cache` | Clear price cache. |
| GET | `/api/admin/analytics` | Accuracy, source breakdown, top tickers, sentiment distribution. |

---

## Database Schema

### Core Tables

**articles**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| title | text | |
| description | text | HTML-stripped, max 1000 chars |
| url | text | Unique (dedup key) |
| source | text | reuters, cnbc, yahoo, marketwatch, ft, ap |
| published_at | timestamptz | From RSS feed |
| analyzed | boolean | Default false, set true after AI processing |
| created_at | timestamptz | |

**analyses**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| article_id | uuid | FK → articles |
| ticker | text | Uppercase US market symbol |
| asset_type | text | "stock" or "etf" |
| sentiment | text | bullish, neutral, bearish |
| confidence | float | 0.0–1.0 |
| reasoning | text | AI explanation |
| predicted_direction | text | up, flat, down |
| predicted_magnitude | text | low, medium, high |
| topic | text | News theme (2–5 words) |
| created_at | timestamptz | |

**ticker_summaries**
| Column | Type | Notes |
|--------|------|-------|
| ticker | text | PK (upsert key) |
| name | text | Company/fund name |
| asset_type | text | |
| description | text | What the company does |
| sector | text | One of 15 sectors |
| topic | text | Most recent news theme |
| overall_sentiment | text | Dominant sentiment |
| avg_confidence | float | Average confidence score |
| bullish_count | int | |
| bearish_count | int | |
| neutral_count | int | |
| num_articles | int | Total analyses in 7-day window |
| last_updated | timestamptz | |

**price_cache**
| Column | Type | Notes |
|--------|------|-------|
| ticker | text | PK |
| data | jsonb | Full PriceData object |
| fetched_at | timestamptz | 15-min TTL |

### User Tables (RLS-protected)

**watchlists** — `id, user_id, ticker, created_at`

**portfolio_positions** — `id, user_id, ticker, shares, avg_price, created_at` (unique on user_id + ticker)

**alerts** — `id, user_id, ticker, condition, active, last_triggered_at, created_at`

**notifications** — `id, user_id, title, body, type, read, metadata (jsonb), created_at`

### Tracking Tables

**prediction_accuracy** — `id, analysis_id, ticker, predicted_direction, actual_direction, direction_correct, checked_at`

**waitlist** — `id, email (unique), created_at`

---

## Route Protection

| Route Pattern | Rule |
|--------------|------|
| `/dashboard`, `/portfolio`, `/alerts`, `/compare`, `/topic/*`, `/ticker/*` | Redirect to `/login` if not authenticated |
| `/admin` | Redirect to `/login` if not authenticated, redirect to `/dashboard` if not admin |
| `/signup` | Redirect to `/` (registration disabled) |
| `/login` | Redirect to `/dashboard` if already authenticated |

Admin email: `alexander.gese07@gmail.com`

---

## Theme

Dark terminal aesthetic with monospace typography (JetBrains Mono).

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `#0a0a0a` | Page background |
| `--foreground` | `#e0e0e0` | Primary text |
| `--card-bg` | `#111111` | Card/panel backgrounds |
| `--card-border` | `#1a1a1a` | Borders and dividers |
| `--muted` | `#888888` | Secondary text |
| `--bullish` | `#00ff88` | Positive sentiment (green) |
| `--bearish` | `#ff4444` | Negative sentiment (red) |
| `--neutral` | `#ffaa00` | Neutral sentiment (orange) |
| `--accent` | `#00aaff` | Interactive elements (cyan) |

**Animations**: Scanline overlay, pulse-dot, glitch text (layered clip-path), terminal line reveal, border glow pulse, fade-in-up with stagger delays, animated grid background, cursor blink.

---

## Environment Variables

| Variable | Scope | Purpose |
|----------|-------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server | Supabase admin operations (bypasses RLS) |
| `OPENAI_API_KEY` | Server | GPT-4o-mini API access |
| `CRON_SECRET` | Server | Bearer token for scheduled cron endpoint |

---

## Local Development

```bash
npm install
cp .env.example .env.local  # fill in env vars
npm run dev                  # http://localhost:3000
```

## Deployment

```bash
vercel --prod
```

Hosted on Vercel. Daily cron configured via `vercel.json`. Deploys directly via Vercel CLI.
# shadowbrokers
