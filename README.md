# College Event Management System

A modern college event management platform built with Next.js, TypeScript, Prisma, and Tailwind CSS. It helps students, faculty, and administrators collaborate on event proposals, voting, funding, bookings, and planning.

## Features

- Create and manage event proposals with status tracking
- Vote, comment, and discuss submitted events
- Track funding and resource pledges
- Manage tickets and event bookings
- View events on a calendar and dashboard overview
- Role-based access for students, faculty, and admins

## Tech Stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Prisma ORM
- PostgreSQL
- bcryptjs for password

## Prerequisites

- Node.js 18 or newer
- npm
- PostgreSQL database

## Getting Started

1. Clone the repository
   ```bash
   git clone <your-repo-url>
   cd College_Event_Magement_System
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Configure environment variables
   Create a `.env.local` file in the project root and add your database connection string:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/college_events"
   ```

4. Generate Prisma client and run migrations
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

5. Start the development server
   ```bash
   npm run dev
   ```

6. Open http://localhost:3000 in your browser

## Project Structure

- `src/app` - pages and route handlers
- `src/components` - reusable UI components
- `src/lib` - shared utilities and database helpers
- `prisma` - Prisma schema and migrations

## Useful Scripts

- `npm run dev` - start the development server
- `npm run build` - create a production build
- `npm run start` - run the production server
- `npm run lint` - run lint checks
- `npm run prisma:generate` - generate the Prisma client
- `npm run prisma:migrate` - run Prisma migrations

## Notes

- This project uses Prisma with PostgreSQL, so make sure your database is running before starting the app.
- Keep sensitive values such as database credentials and secrets out of source control.
- Started to work as a team using git branch