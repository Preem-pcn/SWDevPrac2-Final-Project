# Saengdao Night Market

A vendor spot booking application developed for **Software Development Practice II — Project 5: Night Market Vendor Spot Booking**.

Visitors can explore the market layout and spot details. Members can book spots for a selected night, manage their bookings, and download QR entry passes. Administrators manage spots and bookings and monitor market activity through a dashboard.

This repository contains the **Next.js frontend and its server-side API proxy**. The REST API and database logic are maintained in a separate backend repository.

## Project Links

| Resource | Link |
| --- | --- |
| Live frontend | [Saengdao Night Market](https://sw-dev-prac2-final-project-ten.vercel.app/) |
| Live backend | [Backend service](https://sw-dev-prac2-final-backend.vercel.app/) |
| Frontend repository | [Preem-pcn/SWDevPrac2-Final-Project](https://github.com/Preem-pcn/SWDevPrac2-Final-Project) |
| Backend repository | [Preem-pcn/SWDevPrac2-Final-Backend](https://github.com/Preem-pcn/SWDevPrac2-Final-Backend) |

## How It Works

1. Browse spots on the market map and review their zone, size, location, and rental fee.
2. Register or log in as a member, choose a spot and booking date, and enter the product type.
3. Review bookings in List or Calendar view. Edit, cancel, or drag a booking to another night while changes are permitted.
4. Open a booking pass, scan its QR code, or download the ticket as a PNG or PDF.
5. Administrators use the dashboard and management pages to oversee bookings and maintain the spot catalog.

## User Roles

| Role | Access |
| --- | --- |
| Visitor | Browse public market information and spot details; register and log in. |
| Member | Create bookings, view their own bookings and passes, and change or cancel eligible bookings. |
| Admin | Manage spots, view and manage all bookings, and access the dashboard. |

Registration collects a name, email, telephone number, role, and password. Login uses email and password. The backend determines authorization for protected operations.

## Features

### Public Pages

- Home page with a market overview, zone information, and an explanation of the booking process.
- Spot map and list grouped by zone.
- Spot details including spot number, zone, size, location description, and rental fee.
- Registration form validation and login/logout flows.

### Member Booking Management

- Book an active spot for a selected date and product type.
- Review personal bookings in List and monthly Calendar views.
- Edit the spot, booking date, or product type, and cancel bookings when permitted.
- Drag bookings to another date, with destination feedback and rule validation.
- Cancel a drag with **Esc**; rejected moves keep the original booking unchanged.
- Review upcoming booking counts and the three-spots-per-day allowance.

### Booking Passes

- Ticket-style pass showing the spot, zone, size, booking date, opening time, vendor, and product type.
- Scannable QR code containing the booking details.
- Download the ticket as **PNG** or a single-page **PDF**.
- Countdown to market opening for current or upcoming member bookings.
- Links to the member's other upcoming passes for active spots.
- Separate administrator details panel with vendor contact information and a **Back to All bookings** link.
- Removed or missing spots cannot generate a pass, QR code, or ticket download.

The QR code encodes booking information. It does not implement check-in verification or record market attendance.

### Admin Dashboard and Management

- Dashboard as the default destination after an admin login without a specific return URL.
- Date selection and four statistics: booking count, remaining active spots, distinct vendors, and total rental fees.
- Interactive booking chart for seven market nights, zone occupancy bars, and latest bookings.
- All bookings page with date, zone, and spot-status filters.
- **All / Available spot / Removed spot** status options.
- Admin Calendar sorted naturally by spot number, such as **A2, A7, A10, B1**.
- Three booking chips initially shown per day, with a control to open the complete daily list.
- Different legend shapes for booking chips and destination day cells.
- Add and edit spot forms with a live preview, plus a confirmation dialog before deleting a spot.

> In the All bookings status filter, **Available spot** means the referenced spot is still active in the catalog. It does not mean that the spot has no booking for the selected night.

## Booking Rules

1. A booking date must not precede the current date according to the backend's date rules.
2. A spot can have only one booking per date across vendors.
3. A member can book up to **three different spots per day**.
4. A member cannot book the same spot twice on the same date.
5. Members cannot edit, cancel, or reschedule a booking from **17:00 Bangkok time on its original booking date**. The page directs them to contact an administrator.
6. The cutoff also applies when a page or confirmation dialog remains open across 17:00. Changing the proposed booking date does not bypass the original booking's cutoff.
7. Completed bookings remain readable and locked for members, without booking-specific warning messages.
8. Removed or missing spots cannot issue passes. Current and upcoming bookings show instructions to change the spot or contact an administrator; completed bookings show neutral details without these warnings.
9. Failed rescheduling attempts leave the booking on its original date.

The frontend provides immediate validation feedback, while the backend enforces ownership and booking constraints. The additional 17:00 rule is enforced by this frontend's UI and Next.js API proxy, which obtains the authenticated role and original booking date from the backend. Administrators are exempt from this additional cutoff; existing backend validation still applies.

## Technology Stack

| Area | Technology |
| --- | --- |
| Frontend | Next.js 16 App Router, React 19, TypeScript |
| Styling | Tailwind CSS 4 |
| Typography | Anuphan, Bricolage Grotesque |
| Drag and drop | `@dnd-kit/core` |
| QR generation | `qrcode` |
| Ticket export | `html-to-image`, `jspdf` |
| Authentication | Backend-issued JWT stored in an HttpOnly cookie by Next.js |
| Backend integration | Node.js, Express, MongoDB/Mongoose REST API |
| Hosting | Separate frontend and backend deployments on Vercel |

## Run Locally

### Prerequisites

- **Node.js 20.9.0 or later** and npm.
- Git.
- A running Project 5 backend connected to MongoDB for database-backed operations.

Run the frontend and backend in separate terminals.

### 1. Start the Backend

```bash
git clone https://github.com/Preem-pcn/SWDevPrac2-Final-Backend.git
cd SWDevPrac2-Final-Backend
npm ci
```

Follow the backend repository's configuration instructions. For local development, configure its MongoDB connection, JWT secret, and port. The Project 5 backend configuration uses values such as:

```dotenv
PORT=5000
MONGO_URI=<your MongoDB connection string>
JWT_SECRET=<your own secret>
JWT_EXPIRE=30d
JWT_COOKIE_EXPIRE=30
```

Keep these values in the backend's local configuration or environment, not in the frontend repository. Then start the API using its development script:

```bash
npm run dev
```

With port 5000 configured, the API origin is `http://localhost:5000`; the Project 5 API documentation is available at `/api-docs`. Database-backed routes require a working MongoDB connection.

### 2. Start the Frontend

In another terminal:

```bash
git clone https://github.com/Preem-pcn/SWDevPrac2-Final-Project.git
cd SWDevPrac2-Final-Project
npm ci
```

Copy the frontend environment template.

**Windows PowerShell**

```powershell
Copy-Item .env.example .env.local
```

**macOS / Linux**

```bash
cp .env.example .env.local
```

Set the backend origin in `.env.local`:

```dotenv
BACKEND_URL=http://localhost:5000
```

Do not append `/api/v1`: the server-side client adds it automatically. If the backend uses another port, update this value to match and restart the frontend.

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 3. Prepare Demo Data

With the backend and database ready, run from the frontend directory:

```bash
npm run seed
```

The seed script reads `BACKEND_URL` from the environment or `.env.local`. It prepares demo accounts, **36 spots across three zones**, and sample bookings relative to the execution date. The terminal output identifies a suitable busy night for the presentation.

| Role | Email | Demo password |
| --- | --- | --- |
| Admin | `admin@saengdao.market` | `admin123` |
| Member — Somchai | `somchai@example.com` | `member123` |
| Member — Nok | `nok@example.com` | `member123` |
| Member — Ploy | `ploy@example.com` | `member123` |
| Member — Arthit | `arthit@example.com` | `member123` |

These are accounts prepared by the seed script, not a guarantee that every deployment or database already contains them. Existing accounts must have matching credentials.

Repeated runs reuse existing accounts and skip existing active spot entries. Booking dates depend on the execution date, so running the script on another day may add bookings for new dates. The script does not reset the database. Use a test or demonstration database.

## Application Routes

| Route | Page | Access |
| --- | --- | --- |
| `/` | Home | Public |
| `/spots` | Spot map and details | Public |
| `/register` | Registration | Public |
| `/login` | Login | Public |
| `/bookings/new` | New booking | Member |
| `/bookings` | My bookings / All bookings | Member / Admin |
| `/bookings?view=calendar` | Calendar view | Member / Admin |
| `/bookings/[id]/pass` | Booking pass and details | Owner / Admin |
| `/admin` | Dashboard | Admin |
| `/admin/spots` | Manage spots | Admin |
| `/admin/spots/new` | Add spot | Admin |
| `/admin/spots/[id]/edit` | Edit spot | Admin |
| `/admin/spots/[id]/delete` | Delete confirmation | Admin |

Replace `[id]` with the corresponding backend record ID.

## Project Structure

```text
src/
  app/
    api/auth/                Registration, login, and logout handlers
    api/proxy/[...path]/     Backend forwarding and booking cutoff checks
    admin/                   Dashboard and spot management routes
    bookings/                Booking list, creation, and pass routes
    spots/                   Public spot browsing route
  components/
    admin/                   Dashboard and spot management components
    auth/                    Authentication forms
    bookings/                List, calendar, pass, and booking dialogs
    spots/                   Spot map and details
    extras.css               Styles scoped to the additional screens
  lib/
    api.ts                   Browser API client and response cache
    backend.ts               Server-side backend client
    booking-policy.ts        Booking cutoff and completed-day rules
    date.ts                  Date and market-opening helpers
    session.ts               Server-side session cookie utilities
  proxy.ts                   Page-level session and role checks
scripts/
  seed.mjs                   Demo data preparation
  test-booking-cutoff.mjs     Cutoff and API proxy regression tests
```

## Authentication and API Integration

```text
Browser → Next.js API routes → Backend /api/v1 → MongoDB
```

The browser communicates with Next.js authentication and proxy routes. Next.js stores the backend JWT in an HttpOnly cookie and attaches it to server-side backend requests. Browser JavaScript does not need to read the token. The backend remains responsible for authenticating requests and enforcing access to booking records.

The frontend proxy forwards spot and booking operations. Registration, login, and logout have separate Next.js handlers. API responses use the backend's `success`, `data`, and `error` fields to display results and validation messages.

## Checks and Tests

Run from the frontend directory:

```bash
npm run lint
npx tsc --noEmit
node scripts/test-booking-cutoff.mjs
npm run build
```

The cutoff regression tests cover the Bangkok 17:00 boundary, midnight, member restrictions, the administrator exemption, backend ownership errors, and attempts to bypass the rule through a proposed future booking date or a forged display-role cookie.

These tests use mocked backend responses and do not connect to MongoDB or modify live data. They complement, rather than replace, testing against the actual backend and database.

After a successful production build:

```bash
npm run start
```

### Manual Acceptance Checklist

| Scenario | Expected result |
| --- | --- |
| Submit invalid registration data | Field validation explains the problem. |
| Log in as Member and Admin separately | Each role receives the appropriate menus and access. |
| Book a past date, duplicate spot, occupied spot, or fourth daily spot | The request is rejected with an explanation. |
| Edit or cancel an eligible booking | The change persists after refreshing. |
| Keep an edit dialog open across 17:00 | Member actions become locked and an admin-contact message appears. |
| Open a completed booking | History remains readable without booking-specific warnings. |
| Drag a booking to a valid future date | Calendar, List, and Pass show the updated date. |
| Drop on an invalid date or press Esc | The booking remains on its original date. |
| Scan a QR code and download PNG/PDF | Details match the booking and the complete ticket is visible. |
| Open a removed-spot booking | No ticket, QR, or download is offered; warnings appear only for bookings whose day has not passed. |
| Access another member's pass or an admin page as Member | Unauthorized access is denied. |
| Compare Dashboard with All bookings for the same date | Statistics reflect the same underlying booking data. |
| Filter bookings and open an admin calendar day | Results match the filters and spot numbers are naturally sorted. |
| Add, edit, and delete a test spot | Catalog changes persist, with confirmation before deletion. |

Use separate browsers or an Incognito window to keep Member and Admin sessions independent.

## Presentation Flow

1. Introduce Home, the market zones, and the Spots map.
2. Demonstrate registration validation and log in as a Member.
3. Create a booking for a future date and demonstrate booking-rule validation.
4. Review, edit, and cancel test bookings in My bookings.
5. Move a booking in Calendar and verify the date in List; demonstrate Esc or an invalid destination.
6. Open a pass, scan the QR code, and download PNG/PDF copies.
7. Log out and sign in as Admin to demonstrate Dashboard statistics.
8. Open All bookings, use filters, inspect booking details, and expand a calendar day's complete list.
9. Add, edit, and delete a disposable spot in Manage spots.

Choose future bookings for member-edit demonstrations to avoid the opening-time cutoff. Use disposable test data for cancellation and deletion.

## Limitations and Implementation Notes

- **Date handling:** The backend's booking-date validation and several default date selections use UTC. Between 00:00 and 06:59 Bangkok time, the UTC date is still the previous day. The additional opening-time cutoff and completed-day calculation use Bangkok time.
- **Member availability visibility:** Members can read only their own bookings. The spot map therefore cannot fully determine other vendors' reservations; the backend checks availability when a booking is submitted. Administrators can view all bookings.
- **Soft-deleted spots:** Removing a spot hides it from the active catalog but preserves existing bookings. Those bookings continue to count toward backend daily limits until moved or deleted.
- **Pass scope:** QR codes contain booking information; there is no attendance/check-in service or online payment integration.
- **Rental fees:** Fees are displayed as booking information; the application does not confirm payment collection.
- **Caching and rate limits:** Cached responses reduce backend traffic. Changes by another user may require refreshing the page, and excessive requests may receive HTTP 429 responses.
- **Additional cutoff enforcement:** The 17:00 restriction is implemented in this frontend and its Next.js proxy. Other clients calling the backend directly need equivalent backend-side enforcement to share that restriction.

## Deployment

The frontend and backend are deployed as separate Vercel projects, using the links listed above.

For a new deployment:

1. Deploy the backend with its MongoDB connection and authentication environment variables configured.
2. Import the frontend repository into Vercel.
3. Set the frontend's server-side `BACKEND_URL` to the backend origin, without `/api/v1`. For the supplied backend deployment:

   ```dotenv
   BACKEND_URL=https://sw-dev-prac2-final-backend.vercel.app
   ```

4. Build and deploy the frontend, then test both roles and booking operations through the deployed URL.
5. If demo data is required, point the local seed script at the intended demonstration backend before running it.

Keep `.env.local`, MongoDB connection strings, JWT secrets, and real access tokens out of version control.
