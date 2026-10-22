# Doctors Academy Bhakkar — Management Portal

A modular starter portal using HTML, CSS, Tailwind-ready frontend structure, Vanilla JavaScript, Node.js, Express, Supabase Auth, and PostgreSQL. This first version prioritizes students, classes/sections, fee transactions, expenses, and summary reports.

## Features

- Supabase email/password login and server-side admin authorization
- Dashboard figures read from Supabase records
- Class and section CRUD
- Student create, list, search, edit, and delete
- Fee payment transaction history and printable receipts
- Expense create, list, edit, and delete
- Financial summary and printable report
- Responsive desktop/mobile layout
- Input validation, unique constraints, RLS, `.env.example`, and `.gitignore`

## Important notes about the first version

- The app uses the Supabase public anon/publishable key with the signed-in user's JWT. **Never put a service-role key in the browser or this project.**
- `public/js/config.js` must be filled with your project's URL and public anon/publishable key. These values are public project configuration; database access is protected by Auth, server authorization, and RLS.
- The pending-fee figure is an **estimate for the current month**: sum of active students' monthly fees minus all payments recorded in that calendar month. The app does not yet create individual monthly invoices or carry forward arrears. Add a `fee_invoices` module before using it as a formal accounts ledger.
- Payments are stored as separate transactions and are not silently merged. Do not enter the same real payment twice. A unique payment reference is not enforced because many cash payments may not have a reference.
- The fee screen prints a receipt for a saved transaction; it is not a pre-payment challan. Invoice/challan generation is a suitable next module.
- Tailwind CSS is included as a requested technology option in the project brief; this initial UI uses custom CSS for a stable no-build setup. No React or frontend bundler is required.
- This ZIP has not been connected to your live Supabase project, so live database/auth integration cannot be verified until you add your own project credentials and run the SQL.

## Requirements

- Node.js 20+ (LTS recommended)
- A Supabase project
- VS Code (recommended)

## Windows setup

### 1. Extract and open

1. Extract `doctors-academy-bhakkar.zip`.
2. Open the extracted `doctors-academy-bhakkar` folder in VS Code.
3. Open **Terminal → New Terminal**.

### 2. Configure Supabase

1. Create a project in the Supabase dashboard.
2. Open **Project Settings → API** (or **Data API / API Keys**, depending on the dashboard version).
3. Copy the project URL and the public anon/publishable key.
4. Open `public/js/config.js` and paste them into `ACADEMY_SUPABASE_URL` and `ACADEMY_SUPABASE_ANON_KEY`.
5. Copy `.env.example` to a new file named `.env`.
6. Paste the same project URL and public anon/publishable key into `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `.env`. Do not use the service-role/secret key.

Example `.env`:
```env
PORT=3000
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-public-anon-or-publishable-key
```

### 3. Create database tables

In Supabase, open **SQL Editor → New query**. Run scripts in this exact order:

1. `sql/001_schema.sql`
2. `sql/002_security.sql`

For the admin profile, first create an admin user:
1. Open **Authentication → Users → Add user**.
2. Create the email/password account you want to use. Use a strong password.
3. Copy that user's UUID from the Users page.
4. Open `sql/003_admin_setup.sql`, replace `REPLACE-WITH-AUTH-USER-UUID` with the copied UUID and optionally edit the admin display name.
5. Run the edited script in SQL Editor. Do not run it with the placeholder unchanged.

### 4. Install and run

In the VS Code terminal, from the project root:

```powershell
npm install
npm run dev
```

Or use `npm start` for normal startup. Open **http://localhost:3000** in Chrome. If port 3000 is already occupied, change `PORT` in `.env` and restart.

### 5. Sign in

Visit `http://localhost:3000/login.html` and sign in using the admin user created in Supabase Authentication. There is no public registration page.

## Troubleshooting

- **Setup required**: check both keys in `public/js/config.js`.
- **Supabase is not configured**: check `.env`, ensure the names are exactly `SUPABASE_URL` and `SUPABASE_ANON_KEY`, then restart Node.
- **Admin access is required**: ensure the user's UUID has a row in `public.profiles` with role `admin`; run the edited `003_admin_setup.sql`.
- **Failed to fetch**: confirm `npm run dev` is running, open `http://localhost:3000` (not by double-clicking HTML), and verify the Supabase URL and network connection.
- **Database permission error**: confirm both SQL files were run and that the account has an admin profile.
- **Cannot delete student**: a student with payment history is intentionally protected from deletion to preserve financial records. Consider marking the student inactive instead.
- **Duplicate student ID/class/section**: each student ID is unique; class names and section names within a class must be unique.

## Security notes

- Server checks Supabase Auth and `profiles.role` for each API request.
- Database tables have RLS enabled and admin-only policies.
- `.env` is ignored by Git.
- Never commit real passwords, access tokens, or service-role/secret keys.
- This is a practical starter, not a substitute for a production security review, backups, audit logs, and a formal fee-invoice ledger.

## Future expansion

Use the existing modular pattern to add separate routes and frontend modules for attendance, teachers, payroll, exams/results, announcements, and parent/student access. Keep each feature in its own route/module and add its SQL migration and RLS policy.

## Health check

After starting the server, open `http://localhost:3000/api/health`. It should return:
```json
{"status":"ok"}
```
