# Shift Swap App

A web application that allows team members to swap work shifts with each other. Built for internal use with up to 400 users.

## What This App Does

- **Post Your Shifts**: Add shifts you want to swap away
- **Browse Available Swaps**: See what shifts others want to trade
- **Express Interest**: Offer your shifts in exchange for others
- **Manage Requests**: Track your swap requests and responses

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes
- **Database**: SQLite with Prisma ORM
- **Authentication**: Iron Session with passcode-based login
- **Deployment**: Ready for Vercel or similar platforms

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm, yarn, pnpm, or bun

### Installation

1. **Clone the repository**

   ```bash
   git clone <your-repo-url>
   cd shift-swap-app
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:

   ```env
   DATABASE_URL="file:./dev.db"
   SESSION_SECRET="your-super-secret-session-key-here"
   PASSCODE="your-shared-team-passcode"
   ```

4. **Set up the database**

   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**

   ```bash
   npm run dev
   ```

6. **Open the app**
   Visit [http://localhost:3000](http://localhost:3000) in your browser

## How to Use

### For Team Members

1. **Login**: Use your company email (@company.com) and the shared passcode
2. **Add Shifts**: Go to "My Shifts" tab and add shifts you want to swap
3. **Create Swap Requests**: Click "Post Swap Request" on any of your shifts
4. **Browse & Respond**: Use "Browse Swap Pool" to find and respond to others' requests
5. **Manage**: Track everything in "My Requests" tab

### For Administrators

- **Manual Cleanup**: Trigger database cleanup via browser console:
  ```javascript
  fetch("/api/cleanup", { method: "POST" });
  ```
- **Automatic Cleanup**: Happens every 6 hours when users browse the app

## Key Features

### Smart Time Management

- Shifts must be between 8:00 AM - 11:00 PM
- Only 4-hour or 9-hour shifts allowed
- 15-minute time intervals for precision

### Flexible Swap Options

- **Same Day Swaps**: Trade for the exact same date
- **Specific Dates**: List multiple acceptable dates
- **Time Rules**: Any time, exact start time, or end-by time

### Automatic Cleanup

- Past shifts are automatically deleted
- Expired swap requests are removed
- Keeps database small and fast

### Security Features

- Session-based authentication
- Input validation on all forms
- User can only modify their own data
- Protected API endpoints

## Database Schema

The app uses 4 main tables:

- **Users**: Team member information
- **Shifts**: Individual work shifts
- **SwapRequests**: Requests to swap shifts
- **SwapResponses**: Interest expressions from other users

## Production Deployment

### Environment Variables

```env
DATABASE_URL="file:./prod.db"
SESSION_SECRET="generate-a-strong-random-key"
PASSCODE="your-team-passcode"
NODE_ENV="production"
```

### Build & Deploy

```bash
npm run build
npm start
```

### Recommended Platforms

- **Vercel**: Zero-config deployment
- **Railway**: Great for full-stack apps
- **DigitalOcean**: App Platform

## Project Structure

```
src/
├── app/
│   ├── api/                 # API routes
│   │   ├── auth/           # Login/logout
│   │   ├── cleanup/        # Database cleanup
│   │   ├── swap-requests/  # Swap request management
│   │   ├── swap-responses/ # Interest management
│   │   └── user/          # User data & shifts
│   ├── dashboard/         # Main app interface
│   └── page.tsx          # Login page
├── lib/
│   ├── prisma.ts         # Database client
│   ├── session.ts        # Authentication config
│   ├── validations.ts    # Input validation schemas
│   ├── cleanup.ts        # Automatic cleanup logic
│   ├── dateUtils.ts      # Date validation
│   └── timeUtils.ts      # Time formatting & validation
└── prisma/
    └── schema.prisma     # Database schema
```

## Contributing

1. Follow the existing code style
2. Test your changes thoroughly
3. Keep commits small and focused
4. Use descriptive commit messages

## Support

For technical issues or questions, contact the development team.

---

**Note**: This app is designed for internal team use with a maximum of 400 users. The SQLite database is perfect for this scale and keeps deployment simple.
