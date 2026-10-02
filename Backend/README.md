# St. Thomas Convent Hr. Sec. School — CRM

A MERN-stack School CRM / management system for handling students, staff, and administrative operations, with authentication, file/image uploads, email notifications, and SMS/OTP verification.

## Tech Stack

- **Backend:** Node.js, Express
- **Database:** MongoDB (Atlas)
- **Auth:** JWT-based authentication
- **File/Image Storage:** Cloudinary
- **Email:** Nodemailer (SMTP)
- **SMS / OTP:** Twilio or MSG91 (optional — falls back to console logging in dev)
- **Frontend:** (Vite dev server assumed, e.g. React) running at `http://localhost:5173`

## Prerequisites

- Node.js (LTS recommended)
- npm
- A MongoDB Atlas cluster (or local MongoDB instance)
- (Optional) Cloudinary account for image uploads
- (Optional) SMTP provider (e.g. Gmail App Password) for email
- (Optional) Twilio or MSG91 account for SMS/OTP

## Getting Started

### 1. Clone & install

```bash
git clone <repo-url>
cd backend
npm install
```

### 2. Configure environment variables

Copy the example file and fill in your own values:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `PORT` | Port the backend server runs on (default `5000`) |
| `NODE_ENV` | `development` or `production` |
| `MONGO_URI` | MongoDB connection string (Atlas or local) |
| `JWT_SECRET` | Secret key used to sign JWTs — **must be set, keep it private** |
| `JWT_EXPIRES_IN` | JWT token expiry (e.g. `7d`) |
| `SESSION_SECRET` | Secret used to sign session cookies |
| `ADMIN_NAME` | Name used when seeding the initial admin account |
| `ADMIN_EMAIL` | Email for the seeded admin account |
| `ADMIN_PASSWORD` | Password for the seeded admin account |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Cloudinary credentials for media uploads |
| `CLIENT_URL` | Frontend URL, used for CORS (default `http://localhost:5173`) |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | SMTP credentials for outgoing email (e.g. Gmail App Password) |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_FROM_NUMBER` | Twilio credentials for SMS/OTP (optional) |
| `MSG91_AUTH_KEY` / `MSG91_SENDER_ID` / `MSG91_TEMPLATE_ID` | MSG91 credentials for SMS/OTP, alternative to Twilio (optional) |

> **Note:** Leave both the Twilio and MSG91 sections blank during local development — OTPs will be logged to the server console instead of being sent, so you can test the flow without a paid SMS provider.

> Sessions use express-session's in-memory store. They are cleared when the server restarts and are not shared between multiple server instances; configure a production session store before scaling or deploying for production.

> If you plan to use Twilio, install its SDK first:
> ```bash
> npm install twilio
> ```

### 3. Seed the admin account

This creates the **one** real admin login for the system, using `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` from your `.env`. Update these values to your actual admin's details before running it.

```bash
npm run seed
```

### 4. Run the server

```bash
# development
npm run dev

# production
npm start
```

The API will be available at `http://localhost:5000` (or whatever `PORT` you set), and will accept requests from `CLIENT_URL`.

## Security Notes

- Never commit your real `.env` file — only commit an `.env.example` with placeholder values.
- Use a long, random string for `JWT_SECRET` in production.
- Rotate `ADMIN_PASSWORD` after first login if it was shared insecurely.
- Restrict Cloudinary and SMTP/SMS credentials to least-privilege API keys where possible.

## Project Structure

```
backend/
├── controllers/       # Route handler logic
├── models/            # Mongoose schemas
├── routes/            # Express route definitions
├── middleware/         # Auth, error handling, etc.
├── utils/             # Email, SMS, Cloudinary helpers
├── seed/              # Admin seeding script
├── .env
└── server.js
```

*(Adjust this section to match your actual folder layout.)*

## License

Add your license here.
