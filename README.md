# ✍️ Signature Studio

A polished web app for designing **customizable email signatures** and exporting
them straight to **Gmail** — copy/paste *or* one-click push via the Gmail API.

Built with **Next.js 16 (App Router) · TypeScript · Tailwind v4 · Firebase**.

---

## ✨ Features

**Core builder**
- Name, title, company, department, phone, mobile, email, website, address
- Photo / logo upload (avatar or logo, circle / rounded / square, sizable)
- Accent, text & muted colors · 9 email-safe font stacks · base font size
- Live preview with **desktop / mobile** + **light / dark inbox** toggles

**Social + extras**
- 13 social platforms (LinkedIn, X, Instagram, GitHub, YouTube, TikTok, …) with
  reorderable links and **color / mono / text** icon styles
- Call-to-action button (text, link, colors, rounded)
- Promo banner image with link

**Templates** — Horizontal · Vertical · Card · Minimal · Modern

**Advanced**
- Legal disclaimer / small print
- **vCard QR code** (scannable, saves your contact)
- **Custom HTML mode** (bring your own markup)
- **Multiple saved signatures** — switch, rename, duplicate, delete
- Dark-mode-safe, table-based email HTML (fully inline styles)

**Export**
- 📋 **Copy signature** — rich formatted paste into Gmail
- `</>` **Copy HTML** source · ⬇️ **Download .html**
- 📨 **Push to Gmail** — writes the signature into your account via the Gmail API

**Backend**
- Google sign-in + Firestore sync across devices (optional)
- Works **100% locally** (browser localStorage) with zero config

---

## 🚀 Getting started

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. It works immediately in **local mode** — no Firebase
needed. Signatures save to your browser.

---

## 🔧 Firebase setup (optional — for cloud sync + Gmail push)

1. Create a project at <https://console.firebase.google.com>.
2. Add a **Web app**, copy the config into `.env.local` (see `.env.example`).
3. Enable **Authentication → Google** sign-in.
4. Enable **Firestore** and deploy the rules in `firestore.rules`.
5. Enable **Storage** (for image hosting) and deploy `storage.rules`.

```bash
cp .env.example .env.local   # then fill in the values
```

### Gmail push (direct API)

To use **Push to Gmail** you must, in **Google Cloud Console** for the same project:

1. Enable the **Gmail API**.
2. Configure the **OAuth consent screen** and add the scope
   `https://www.googleapis.com/auth/gmail.settings.basic`.
3. Add your domain to **Authorized domains** (and `localhost` for dev).

> While the consent screen is unverified, add testers under
> *OAuth consent screen → Test users*. The OAuth token stays in the browser and
> is only used to PATCH your `sendAs` signature — nothing is stored server-side.

If you skip this, **Copy signature** still works perfectly — paste into
*Gmail → ⚙️ → See all settings → Signature*.

---

## 🖼️ A note on images & icons

Email clients (especially Gmail) **block SVGs and data-URI images**. So:

- **Social icons** use hosted PNGs from [icons8](https://icons8.com) — they render
  reliably in Gmail/Outlook/Apple Mail. The **Text** icon style is the bulletproof
  fallback if an inbox blocks remote images.
- **vCard QR** is a hosted PNG via `api.qrserver.com`.
- **Photo / logo / banner** uploads go to Firebase Storage to get a public URL. If
  you're in local mode, paste a **public image URL** instead (a local data-URL
  previews fine but won't show in Gmail).

---

## 🗂️ Project structure

```
src/
├─ app/                     # Next.js App Router (layout, page, globals)
├─ components/
│  ├─ ui/                   # shadcn-style primitives (button, tabs, select…)
│  ├─ builder/              # Editor, Preview, ExportBar, TemplateGallery, …
│  ├─ AuthButton, AppInit, ImageField, SignatureMenu, fields
├─ lib/
│  ├─ types.ts              # Signature data model
│  ├─ defaults.ts           # default signature factory
│  ├─ templates/
│  │  ├─ render.ts          # ← the email HTML engine (table-based, inline)
│  │  ├─ icons.ts           # social icon URLs
│  │  └─ vcard.ts           # vCard + QR
│  ├─ firebase.ts, firestore.ts, storage.ts, gmail.ts, clipboard.ts, utils.ts
└─ store/useStore.ts        # Zustand store (local-first, Firestore sync)
```

The renderer in `lib/templates/render.ts` is the heart: it converts a `Signature`
into email-safe HTML. Everything else feeds it.

---

## 📦 Build & deploy

```bash
npm run build      # production build
```

Deploys to Vercel out of the box — add the `NEXT_PUBLIC_FIREBASE_*` env vars in the
Vercel dashboard and make sure your Vercel domain is in Firebase Auth's authorized
domains and the Google OAuth authorized domains.
