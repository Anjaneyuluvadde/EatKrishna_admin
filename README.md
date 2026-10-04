# 🍬 Mithai Mahal — Admin Panel
### Premium Sweets Store Admin Dashboard

---

## 📁 File Structure

```
sweets-admin/
├── index.html          ← Main HTML (all pages/sections)
├── css/
│   └── style.css       ← Premium sweets theme styles
├── js/
│   ├── config.js       ← ⚠️ Add your Supabase credentials here
│   └── app.js          ← All JS logic (navigation, forms, Supabase)
└── README.md
```

---

## ⚡ Quick Start

### Step 1 — Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign in (or create a free account).
2. Click **"New Project"**.
3. Fill in: Project name, Database password, Region → Click **"Create new project"**.
4. Wait ~2 minutes for your project to be ready.

---

### Step 2 — Create the Database Tables

Go to your Supabase project → **SQL Editor** → click **"New query"** and paste the SQL below:

```sql
-- Products Table
CREATE TABLE products (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  category      TEXT NOT NULL,
  price         NUMERIC NOT NULL,
  original_price NUMERIC,
  discount      NUMERIC,
  rating        NUMERIC,
  image_url     TEXT,
  tag           TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Ingredients Table
CREATE TABLE ingredients (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  category   TEXT NOT NULL,
  price      NUMERIC NOT NULL,
  image_url  TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;

-- Allow public read/write for now (tighten in production)
CREATE POLICY "Allow all" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON ingredients FOR ALL USING (true) WITH CHECK (true);
```

Click **"Run"** to execute. Both tables will be created.

---

### Step 3 — Get Your Supabase Credentials

1. In your Supabase project, go to **Settings** → **API**.
2. Copy:
   - **Project URL** (looks like `https://abcdefgh.supabase.co`)
   - **anon / public key** (a long JWT string)

---

### Step 4 — Add Credentials to the App

Open `js/config.js` and replace the placeholder values:

```js
const SUPABASE_URL = "https://YOUR_PROJECT_ID.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_ANON_PUBLIC_KEY_HERE";
```

Example:
```js
const SUPABASE_URL = "https://xyzabcdef.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
```

---

### Step 5 — Open the Admin Panel

Simply open `index.html` in your browser. No build step needed!

> ⚠️ **Important**: Because this uses the Supabase JS SDK via CDN, you need to open the file via a local server (not directly from the filesystem) if you encounter CORS issues.
>
> Easy way — use VS Code with the **Live Server** extension, or run:
> ```bash
> npx serve .
> ```

---

## 🎨 Features

| Feature | Details |
|---|---|
| **Dashboard** | Stats (product count, ingredient count), quick actions, recent products |
| **Add Product** | Full form with validation, tag selector, image preview on card |
| **Add Ingredient** | Clean form with category selection |
| **Live Previews** | Products shown as premium cards below the form |
| **Ingredients Table** | Tabular view with thumbnail, category chip, price |
| **Toast Notifications** | Success / error messages on form submit |
| **Loading States** | Button disables and shows "Saving…" while submitting |
| **Responsive** | Mobile sidebar toggle, responsive grid layout |

---

## 🗄️ Database Schema

### `products`
| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key, auto-generated |
| name | text | Product name |
| category | text | Sweets / Ladoos / Dry Fruits / Gift Box |
| price | numeric | Selling price |
| original_price | numeric | MRP (optional) |
| discount | numeric | Discount % (optional) |
| rating | numeric | 0.0 – 5.0 (optional) |
| image_url | text | Product image URL |
| tag | text | Bestseller / Popular / Premium / Gift |
| created_at | timestamptz | Auto-set on insert |

### `ingredients`
| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key, auto-generated |
| name | text | Ingredient name |
| category | text | Nuts / Sweeteners / Flavors / Extras |
| price | numeric | Price per unit |
| image_url | text | Image URL (optional) |
| created_at | timestamptz | Auto-set on insert |

---

## 🔒 Production Security Tips

1. **Never expose your service_role key** — only use the `anon` key on frontend.
2. **Tighten RLS policies** — restrict write access to authenticated admin users only.
3. **Add Supabase Auth** — protect the admin panel behind a login.
4. **Set up Storage** — use Supabase Storage for image uploads instead of external URLs.

---

## 🛠 Tech Stack

- **HTML5 + CSS3 + Vanilla JS** — no framework needed
- **Supabase JS SDK v2** — loaded via CDN
- **Google Fonts** — Cormorant Garamond (headings) + Jost (body)

---

*Built with ✦ for Mithai Mahal*
