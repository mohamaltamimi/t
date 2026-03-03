# Wooqer - Operations Platform Clone

A full-stack operations management platform built with Next.js, replicating the core features of [Wooqer](https://wooqer.com) - the operating system for frontline teams.

## Features

- **Dashboard** - Real-time overview of tasks, audits, compliance, and KPIs
- **Task Management** - Create, assign, and track tasks across locations with priority levels and due dates
- **Checklists** - Digital checklists with multiple item types (checkbox, text, number, photo) and frequency scheduling
- **Audits** - Compliance audits with weighted questions, scoring, and response tracking
- **SOP Management** - Create, publish, and version standard operating procedures
- **Training & Onboarding** - Training courses with modules (lessons, quizzes, videos) and progress tracking
- **Location Management** - Multi-location support with store/restaurant/office/warehouse types
- **User Management** - Role-based access control (admin, manager, frontline)
- **Analytics & Reporting** - Visual dashboards with task completion, audit scores, training rates, and location performance

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: SQLite via Prisma ORM
- **Authentication**: JWT-based with httpOnly cookies

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
npm install
```

### Database Setup

```bash
npx prisma generate
npx prisma db push
```

### Seed Demo Data

Start the dev server, then call the seed API:

```bash
npm run dev
# In another terminal:
curl -X POST http://localhost:3000/api/seed
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Demo Accounts

| Role      | Email               | Password    |
|-----------|---------------------|-------------|
| Admin     | admin@wooqer.com    | admin123    |
| Manager   | manager@wooqer.com  | manager123  |
| Frontline | staff@wooqer.com    | staff123    |

## Project Structure

```
src/
├── app/
│   ├── (dashboard)/          # Authenticated dashboard layout
│   │   ├── page.tsx          # Dashboard home
│   │   ├── tasks/            # Task management
│   │   ├── checklists/       # Checklists module
│   │   ├── audits/           # Audits module
│   │   ├── sops/             # SOP management
│   │   ├── training/         # Training & onboarding
│   │   ├── locations/        # Location management
│   │   ├── users/            # User management
│   │   └── analytics/        # Analytics & reporting
│   ├── api/                  # API routes
│   ├── login/                # Login page
│   └── layout.tsx            # Root layout
├── components/               # Shared UI components
├── lib/                      # Utilities (db, auth)
└── middleware.ts              # Auth middleware
```
