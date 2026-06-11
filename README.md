# 🌿 Mint — Minimalist Task & Habit Tracker

Mint is a self-hostable, modern, and minimalist daily dashboard designed to track tasks, log recurring habits ("protocols"), and visualize your daily consistency. It is built as a lightweight, private alternative to bloated productivity suites—putting you in full control of your data.

---

## ✨ Features

- **🎯 Daily Objectives**: A focused daily checklist for tasks. Easily add, toggle, and manage items.
- **🔄 Smart Rollover**: Uncompleted tasks automatically roll over to the next day, ensuring nothing slips through the cracks.
- **🔁 Protocols**: Define recurring habits or non-negotiable routines (e.g., "Drink 3L Water", "Code 2 hours"). Protocols reset automatically on your schedule.
- **📊 Interactive Analytics**: Built-in interactive heatmaps and progress charts powered by Recharts to track your completion trends over time.
- **🔒 Secure Credentials Auth**: Localized session authentication powered by NextAuth.js (no dependency on external services like Clerk/Auth0).
- **🐳 Docker Ready & Self-Hostable**: Can be spun up in a single command using Docker and Docker Compose.
- **☁️ Cloud Deployable**: Standard Next.js architecture ready to deploy on Vercel, Netlify, or any VPS.

---

## 🛠️ Technology Stack

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/) & [React 19](https://react.dev/)
- **Database ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Database Client**: [Postgres.js](https://github.com/porsager/postgres)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **State & Animation**: [Framer Motion](https://www.framer.com/motion/) & [SWR](https://swr.vercel.app/)
- **Authentication**: [NextAuth.js (Credentials Provider)](https://next-auth.js.org/)

---

## 🚀 Getting Started

### Option A: Local Development (Non-Docker)

Follow these steps to run Mint directly on your system with a local or remote PostgreSQL instance.

#### 1. Prerequisites

- **Node.js**: `v20+`
- **Package Manager**: `pnpm` (version `10+` recommended)
- **Database**: A running PostgreSQL instance

#### 2. Setup & Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/your-username/mint.git
cd mint
pnpm install
```

#### 3. Environment Configuration

Create a `.env.local` file by copying the example:

```bash
cp .env.example .env.local
```

Update the following settings in `.env.local`:

- `DATABASE_URL`: Your PostgreSQL connection string.
- `NEXTAUTH_SECRET`: A secure key for sessions. You can generate one via:
  ```bash
  openssl rand -hex 32
  ```

#### 4. Prepare the Database Schema

Push the database schemas and run migrations directly to your database:

```bash
pnpm db:push
```

#### 5. Start Development Server

Run the local dev server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view your app.

---

### Option B: Quickstart with Docker 🐳

The easiest way to run the entire stack (Next.js app + PostgreSQL database) containerized.

1. **Copy the Environment Configuration:**

   ```bash
   cp .env.example .env
   ```

2. **Build and Start Container Services:**

   ```bash
   docker compose up --build -d
   ```

3. **Access the App:**
   Open [http://localhost:3000](http://localhost:3000). You'll need to create an account first.

---

### Option C: Deploying to Vercel & Cloud Databases ☁️

Mint is standard-compliant and is optimized to run on serverless platforms.

1. **Database Setup**: Set up a PostgreSQL instance on a cloud provider (e.g., [Supabase](https://supabase.com/), [Neon](https://neon.tech/), [Render](https://render.com/), or [Aiven](https://aiven.io/)).
2. **Schema Push**: Push the tables to your cloud database before deploying:
   ```bash
   # Temporarily set DATABASE_URL in your terminal or use .env.local
   DATABASE_URL="your-cloud-database-url" pnpm db:push
   ```
3. **Deploy on Vercel**:
   - Push your code to GitHub/GitLab.
   - Import your repository into the [Vercel Dashboard](https://vercel.com).
   - Add the required environment variables in the Vercel dashboard settings:
     - `DATABASE_URL`
     - `NEXTAUTH_SECRET`
     - `NEXTAUTH_URL` (Set this to your custom domain or Vercel deployment domain)

   - Click **Deploy**.

---

## ⚙️ Environment Variables

| Variable               | Requirement  | Description                                     | Default / Example                                             |
| :--------------------- | :----------- | :---------------------------------------------- | :------------------------------------------------------------ |
| `DATABASE_URL`         | **Required** | PostgreSQL connection URI                       | `postgresql://mint_user:mint_password@localhost:5432/mint_db` |
| `NEXTAUTH_SECRET`      | **Required** | Secret key for signing NextAuth.js tokens       | Generate using `openssl rand -hex 32`                         |
| `NEXTAUTH_URL`         | **Required** | Public URL of the application                   | `http://localhost:3000`                                       |

| `DISABLE_AUTO_MIGRATE` | Optional     | Disables auto-running migration script on start | `false`                                                       |
| `DISCORD_WEBHOOK_URL`  | Optional     | Forwards bug reports/feedback to Discord        | `""`                                                          |

---

## 📁 Project Structure

```
├── app/                  # Next.js App Router (pages, layouts, and API routes)
├── components/           # Reusable UI components (Analytics, Objectives, Protocols)
├── lib/
│   ├── db/               # Drizzle connection, schemas, and migrations
│   └── utils.ts          # Utility functions (Tailwind merge, etc.)
├── public/               # Static assets
├── Dockerfile            # Multi-stage Docker build config
├── docker-compose.yml    # Dev/Prod multi-container runner
├── drizzle.config.ts     # Drizzle Kit migration tool config
└── package.json          # Dependency and script management
```

---

## 🤝 Contributing & Customization

1. Fork the project.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

## 📄 License

Mint is open-source software licensed under the [MIT License](LICENSE).
