# CampusConnect — College Event Management System

A full-stack college event management platform built with Next.js, TypeScript, Prisma, and Tailwind CSS. It enables students, faculty, and administrators to collaborate on event proposals, approvals, funding, volunteering, ticketing, and more — with a distinct role-based experience for each user type.

---

## Features

### Role-Based Access & Authentication
- Separate signup flows for **Students** (roll number, year, section, department) and **Faculty** (employee ID, department)
- Session-based authentication with bcryptjs password hashing
- Email verification support
- Role-aware UI with dynamic theming per role (Student / Faculty / Admin)

### Event Proposals
- Students can **create event proposals** with title, description, category, venue, date range, expected audience, budget, cover image, and attachments
- Proposals go through a **two-stage approval pipeline**: Faculty Review → Admin Review → Accepted
- Proposals can be **rejected** at either stage with a reason
- Students and admins can **delete pending proposals**
- Supported categories: Technical, Cultural, Sports, Workshop, Seminar, Hackathon, Community Service

### Upcoming Events Feed
- Browse all pending and accepted campus events in a card grid
- Filter by **status** (Faculty Review / Admin Review / Accepted) and **category**
- Search by title or venue
- Shows vote count, registration count, available spots, and cover image
- Registered events are visually marked

### Event Detail & Engagement
- Per-event page with full details, author info, and status
- **Voting** — upvote proposals in pending or accepted states
- **Threaded Comments** — nested discussion/feedback on each event
- **Volunteer Applications** — students can apply to volunteer for accepted events, providing their skill and reason

### Faculty Portal
- View all proposals **assigned to you as mentor** that are pending faculty approval
- **Approve or reject** proposals directly from the list or detail view
- View **funding contributions** per event with a progress bar against budget
- **Contribute funding** to any mentored event
- **Manage volunteer applications** — select or reject applicants within a quota
- **Rate completed events** on a 1–10 scale after the event end date (triggers campus point awards)

### Admin Control Panel
- Full platform overview: total users (students, faculty), total events, and counts by status
- **Pending events queue** — review and approve/reject events submitted for admin approval
- **Upcoming events** management with registration counts
- **Completed events** with admin rating capability (1–10 scale)
- **User management** — view all users, their roles, and registration dates
- **Create new user** accounts directly from the admin panel
- Admin analytics dashboard with charts (see Analytics section)

### Analytics Dashboard
- Platform-wide KPIs: total proposals, total users, total funds raised, total votes
- **Category distribution** pie/bar chart
- **Funding by category** bar chart
- **Status breakdown** chart (pending, accepted, rejected, completed)
- Recent proposals table with author, category, votes, and status
- Role-specific engagement analytics for Students, Faculty, and Admins (`/engagement/analytics/*`)

### Calendar
- Personal calendar view powered by **FullCalendar** (month / week / day views)
- Events are color-coded by the user's role in each event: Participant, Proposer, Volunteer, Mentor

### Event Registration & E-Pass
- Students can **register** for accepted events directly from the events list
- Seat capacity tracking with a live progress bar
- Upon registration, a **digital E-Pass** is generated with a unique pass code and **QR code** (via Cloudinary upload)
- E-Pass page supports **download (print-to-PDF)** and **print** actions

### Ticketing & Bookings
- Events can have **ticket tiers** with name, price, capacity, and booking window
- Students can book tickets; each booking gets a unique ticket code
- Booking status tracked (CONFIRMED by default)

### Funding & Resource Pledges
- Anyone can **contribute funding** to an event proposal
- Track total raised vs. budget with a visual progress bar
- **Resource pledges** — pledge physical resources (type, description, quantity, availability) to an event

### Campus Points System
- Users earn points for actions (proposal creation, volunteering, event completion, ratings)
- Point transactions are logged per user
- Points balance displayed on the user profile

### Notifications
- In-app notification bell with unread count
- Notifications are linked to specific proposals and marked read/unread

### Profile Management
- View profile with role-specific fields (roll number / employee ID, department, section, year)
- Campus points balance and activity stats (events created, events registered, events mentored)
- Email verification status badge
- Edit profile page

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| UI | React 19, Tailwind CSS, Lucide React, Recharts |
| Calendar | FullCalendar (daygrid, timegrid, interaction) |
| Forms | React Hook Form + Zod |
| ORM | Prisma 5 |
| Database | PostgreSQL |
| Auth | Custom session auth + bcryptjs |
| File Upload | Cloudinary |
| QR Code | qrcode |
| Notifications | Sonner (toast) |
| State / Fetching | TanStack React Query |

---

## Prerequisites

- Node.js 18 or newer
- npm
- PostgreSQL database
- Cloudinary account (for image/QR uploads)

---

## Getting Started

1. Clone the repository
   ```bash
   git clone <your-repo-url>
   cd full-stack-project-mesh-minds
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Configure environment variables — create a `.env` file in the project root:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/college_events"
   NEXTAUTH_SECRET="your-secret"
   CLOUDINARY_CLOUD_NAME="your-cloud-name"
   CLOUDINARY_API_KEY="your-api-key"
   CLOUDINARY_API_SECRET="your-api-secret"
   ```

4. Generate Prisma client and run migrations
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

5. (Optional) Seed an admin user
   ```bash
   npx ts-node prisma/seed-admin.ts
   ```

6. Start the development server
   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000) in your browser

---

## Project Structure

```
src/
├── app/
│   ├── admin/              # Admin-only pages (pending, upcoming, users, calendar, analytics)
│   ├── analytics/          # Platform-wide analytics page
│   ├── api/                # All API route handlers
│   │   ├── admin/          # Admin stats, events, users, calendar
│   │   ├── auth/           # Login, logout, session, verify
│   │   ├── bookings/       # Ticket bookings
│   │   ├── calendar/       # Personal calendar events
│   │   ├── comments/       # Event comments
│   │   ├── engagement/     # Votes, comments, volunteers, notifications, analytics
│   │   ├── epass/          # E-Pass generation and retrieval
│   │   ├── events/         # Proposals CRUD, register, participants, volunteers
│   │   ├── faculty/        # Faculty pending/completed events, volunteer management
│   │   ├── funding/        # Funding contributions
│   │   ├── profile/        # User profile
│   │   ├── upcoming-events/# Upcoming events feed + registration
│   │   ├── upload/         # Cloudinary file upload
│   │   ├── users/          # Faculty user listing
│   │   └── votes/          # Vote toggle
│   ├── calendar/           # Calendar page
│   ├── dashboard/          # Role-aware dashboard (Student / Faculty / Admin)
│   ├── engagement/         # Event engagement, volunteer management, analytics
│   ├── epass/[id]/         # Digital E-Pass viewer
│   ├── events/             # Events list + create proposal
│   ├── faculty/            # Faculty review portal
│   ├── login/ signup/      # Auth pages
│   ├── profile/            # Profile + edit
│   ├── proposals/[id]/     # Proposal detail
│   └── upcoming-events/    # Upcoming events feed + detail
├── components/
│   ├── auth/               # LoginForm, SignupForm, RoleSelector
│   ├── engagement/         # VoteButton, CommentsSection, VolunteerApplyForm,
│   │                       #   VolunteerManagementTable, EngagementCharts, NotificationBell
│   ├── ui/                 # button, card, input, select, textarea
│   ├── AppShell.tsx        # Main layout shell with sidebar navigation
│   ├── Topbar.tsx          # Top navigation bar with notifications
│   └── analytics-charts.tsx# Recharts-based analytics visualizations
├── lib/
│   ├── engagement/         # notification.service, penalty.service, points.service
│   ├── auth-client.ts      # Client-side session hook
│   ├── prisma.ts           # Prisma client singleton
│   ├── qrcode.ts           # QR code generation helper
│   └── utils.ts            # Shared utilities
└── types/                  # Shared TypeScript types
prisma/
├── schema.prisma           # Full data model
├── migrations/             # Database migration history
└── seed-admin.ts           # Admin user seeder
```

---

## Data Model Overview

| Model | Purpose |
|---|---|
| User | Students, Faculty, and Admins with role-specific fields |
| EventProposal | Core event entity with status, dates, budget, ratings |
| Vote | One vote per user per proposal |
| Comment | Threaded comments (replies via parentId) |
| Registration | Student registrations for accepted events |
| Ticket | Ticket tiers per event (price, capacity) |
| Booking | Individual ticket bookings with unique codes |
| FundingContribution | Monetary contributions to an event |
| ResourcePledge | Physical resource pledges for an event |
| VolunteerApplication | Student volunteer applications with skill/reason |
| CalendarEvent | Links users to events by role (Participant, Proposer, Volunteer, Mentor) |
| EPass | QR-code-based digital entry passes |
| Notification | Per-user in-app notifications linked to proposals |
| CampusPointTransaction | Points ledger for gamification |

---

## Useful Scripts

```bash
npm run dev              # Start development server
npm run build            # Create production build
npm run start            # Run production server
npm run lint             # Run ESLint checks
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run Prisma migrations
```

---

## Notes

- Ensure your PostgreSQL database is running before starting the app.
- Cloudinary credentials are required for cover image uploads and QR code storage.
- Keep all secrets and credentials out of source control — use `.env` (already in `.gitignore`).
- The project uses git branches for team collaboration.
