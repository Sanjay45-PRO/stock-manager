# Stock Manager

A warehouse/retail inventory management web app for small teams, with admin/staff roles.

## Stack
- React (Vite) + Tailwind CSS v4
- Supabase (Postgres + Auth + Row-Level Security)
- react-router-dom for routing, lucide-react for icons

## Features (v1)
- Email/password auth, roles: `admin` and `staff`
- Product catalog (SKU, name, category, price, reorder threshold)
- Stock movements: Stock In / Stock Out / Adjustment, each logged with who + when
- Auto-updated stock levels via a Postgres trigger on movements
- Dashboard: total products, units in stock, inventory value, low-stock alerts, recent activity
- Categories management (admin only)
- RLS: everyone signed in can read; only admins can create/edit/delete products & categories; staff can log stock movements

## Setup

### 1. Create a Supabase project
Go to https://supabase.com, create a new project, and note your Project URL and anon public key (Project Settings > API).

### 2. Run the schema
Open the SQL Editor in your Supabase project and run the contents of `supabase/schema.sql`. This creates all tables, the auto-profile trigger, the stock-quantity trigger, and RLS policies.

### 3. Configure environment variables
Copy `.env.example` to `.env` and fill in your project's URL and anon key:
```
cp .env.example .env
```

### 4. Install & run
```
npm install
npm run dev
```

### 5. Create your first user and make them admin
- Sign up in the app (this creates an `auth.users` row + a `profiles` row with role `staff`).
- In Supabase Table Editor, open `profiles`, find your row, and change `role` to `admin`.
- Sign back in — you'll now see admin-only features (adding/editing products, categories).

## Deploying
- Frontend: deploy to Vercel or Netlify (set the same env vars there).
- Backend: Supabase is already hosted — no separate deployment needed.

## Project structure
```
src/
  lib/supabase.js       Supabase client
  context/AuthContext.jsx  Session + profile/role state
  components/Layout.jsx    Sidebar nav shell
  pages/
    Login.jsx
    Dashboard.jsx
    Products.jsx
    Movements.jsx
    Categories.jsx
supabase/schema.sql     Full DB schema + RLS policies
```

## Next steps / ideas
- Barcode scanning for stock in/out
- Supplier management + purchase orders
- Multi-location/warehouse support
- CSV/Excel export for reports
