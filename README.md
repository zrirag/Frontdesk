# Frontdesk – Customer Support & SLA Tracking Portal

Frontdesk is a modern, enterprise-grade customer support portal built for Arvo Systems. It provides multi-tier ticket management, strict SLA milestone tracking in Indian Standard Time (IST), dual-mode internal staff collaboration, and an immutable audit trail.

Originally developed with a Flutter client, the frontend has been completely re-engineered into a fast, responsive, and accessible **React 18 + TypeScript** Single Page Application, powered by an enterprise **Python Flask** API and **MariaDB / MySQL** database.

---

## Key Features

- **Multi-Scope Ticket Workspaces:**
  - **Customers:** Follow submitted tickets via *My Requests*, respond with public messages, upload logs/screenshots, and reopen resolved issues.
  - **Support Agents:** Work within *Unassigned Queue* and *Assigned to Me*, claim unassigned tickets, post public customer replies, leave confidential internal notes, and transfer tickets to colleagues.
  - **Managers & Administrators:** Access *All Tickets*, oversee team assignment across managers and agents, reassign tickets, and track organizational throughput.
- **Intelligent Business Hours & SLA Engine:**
  - Standard support schedule: **Monday to Friday, 09:30 AM – 06:30 PM IST** (9 working hours/day).
  - Automatic exclusion of weekends and configured festival holidays.
  - **Urgent Priority:** 2 working hours first response; same-day close resolution (or next working day close for late-day/off-hours arrivals).
  - **Medium Priority:** Half working day (4.5 working hours) first response; 3 working days (27 working hours) resolution.
  - **Low Priority:** 1 working day (9 working hours) first response; 1 working week (45 working hours) resolution.
  - **Customer Waiting SLA Pause:** Putting a ticket into *Waiting on Customer* pauses SLA timers; customer replies instantly resume timers.
  - **Inactivity Timeout:** Automatic closure after 45 working hours (~5 working days) without customer response.
  - **Reopening Window:** 7 calendar days from resolution; attempts to reopen expired tickets are rejected with guidance to open a new ticket.
- **Security & Private Notes Isolation:**
  - Separate public replies and private internal team notes.
  - Strict database-level and API filtering ensures private notes and internal attachments are never transmitted to customer accounts.
  - Comprehensive Cross-Site Request Forgery (CSRF) token validation on all state-changing endpoints.
  - `HTTPOnly` and `SameSite` encrypted session cookies with automatic 12-hour expiration.
  - Granular Role-Based Access Control (RBAC) across `customer`, `agent`, `manager`, and `admin` roles.
- **Append-Only Immutable Audit Trail:**
  - Tracks lifecycle events: ticket creation, assignment, claim, priority changes, replies, notes, deadline reflows, and closures.
  - MariaDB database triggers prevent SQL `UPDATE` and `DELETE` operations on historical audit records.
- **Reporting & Operational Analytics:**
  - SLA compliance KPI tiles (On-Time Resolution %, Missed First Responses, Missed Resolutions).
  - Interactive Weekly Closure Activity Bar Chart.
  - Staff Resolution Leaderboard ranking on-time completion rates.
  - Missed Deadlines incident log with full ticket audit trail inspection modal.
  - Notification Outbox monitoring queued and dispatched customer emails.

---

## Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend SPA** | React 18, TypeScript 5, Vite 5, Tailwind CSS, Lucide React, Axios, HashRouter |
| **Backend API** | Python 3.12, Flask 3.x, PyMySQL, Cryptography, Scrypt, Click CLI |
| **Database** | MariaDB 10.4+ or MySQL 8.0+ (InnoDB, Triggers, Row-Level Locks) |
| **Design Tokens** | Navy (`#2B2D42`), Slate (`#8D99AE`), Light (`#EDF2F4`), Crimson (`#EF233C`), Deep Red (`#D90429`) |

---

## Architecture Overview

Frontdesk operates as a unified service where Flask hosts both the RESTful API endpoints (`/api/*`) and serves the compiled React production bundle from `backend/web/`.

```
                    +------------------------------------------+
                    |               Web Browser                |
                    | (React 18 + TypeScript + Tailwind CSS)   |
                    +--------------------+---------------------+
                                         |
                       HashRouter Client Navigation (/#/...)
                       Axios JSON API Requests with CSRF Tokens
                                         |
                                         v
+---------------------------------------------------------------------------------+
|                                 Flask Backend                                   |
|                                                                                 |
|  +--------------------+   +-----------------------+   +----------------------+  |
|  |   Static Handler   |   |    REST Controllers   |   |  Background Workers  |  |
|  |  Serves index.html |   | /api/auth    /api/sla |   |  ticket-lifecycle    |  |
|  |  and /assets/*     |   | /api/tickets /api/stf |   |  notification-worker |  |
|  +--------------------+   +-----------+-----------+   +----------+-----------+  |
|                                       |                          |              |
+---------------------------------------|--------------------------|--------------+
                                        v                          v
                    +------------------------------------------+
                    |             MariaDB / MySQL              |
                    |  - InnoDB Row-Level Locking (SLA Race)   |
                    |  - Append-Only Triggers (Audit Trail)    |
                    |  - UTF8MB4 Full Unicode Support          |
                    +------------------------------------------+
```

---

## Project Structure

```
.
├── backend/                        # Python Flask backend service
│   ├── app.py                     # Flask application factory & blueprint registry
│   ├── attachments.py             # File uploads (15MB max, disk storage)
│   ├── audit.py                   # Immutable event logging helper
│   ├── auth.py                    # Session auth, CSRF verification & RBAC
│   ├── business_hours.py          # IST business hours calendar engine
│   ├── database.py                # Database connection pool & transaction management
│   ├── holidays.py                # Festival holiday management API
│   ├── lifecycle.py               # Ticket state transitions & SLA timer pause/resume
│   ├── migrations.py              # Schema migration engine (001–008)
│   ├── notifications.py           # Email notification queue & delivery worker
│   ├── reports.py                 # SLA analytics, velocity charts & leaderboard API
│   ├── requirements.txt           # Python backend dependencies
│   ├── sla.py                     # SLA cycle management & milestone calculation
│   ├── staff.py                   # Staff roster & team management API
│   ├── test_business_hours.py     # Calendar & SLA unit test suite
│   ├── test_web_app.py            # Static asset serving test suite
│   ├── tickets.py                 # Ticket queue, actions, replies & notes API
│   ├── web_app.py                 # Static single-page application server
│   ├── .env.example               # Sanitized environment template
│   └── web/                       # Compiled React SPA production bundle (served at /)
│       ├── index.html
│       ├── assets/
│       │   ├── index-*.css
│       │   └── index-*.js
│       └── favicon.svg
├── frontend-react/                 # React + TypeScript frontend source
│   ├── public/                    # Favicons and web manifests
│   ├── src/
│   │   ├── api/                   # API client modules (auth, tickets, staff, reports)
│   │   ├── components/            # Reusable UI components (Modal, Button, Badge)
│   │   ├── context/               # AuthContext & user session management
│   │   ├── types/                 # TypeScript interfaces and domain models
│   │   ├── utils/                 # IST date/time helpers and milestone formatters
│   │   ├── views/                 # Top-level view controllers
│   │   │   ├── auth/              # Sign In, Registration, Verification & Password Setup
│   │   │   ├── holidays/          # Holiday Calendar & Declaration Modal
│   │   │   ├── reports/           # SLA Reports, Charts & Leaderboard
│   │   │   ├── staff/             # Staff Roster & Hierarchy Management
│   │   │   └── tickets/           # Ticket Workspace & Ticket Detail View
│   │   ├── App.tsx                # HashRouter configuration & layout shell
│   │   └── main.tsx               # Client entrypoint
│   ├── package.json               # Node.js dependencies
│   ├── tailwind.config.js         # Exact brand color tokens
│   ├── tsconfig.json              # TypeScript configuration
│   └── vite.config.ts             # Vite build configuration (outputs to ../backend/web/)
├── .gitignore                      # Git exclusion rules
├── .gitattributes                 # Line endings configuration
└── README.md                      # Project documentation
```

---

## Prerequisites

Before setting up Frontdesk, ensure the following are installed:
- **Python:** Version 3.12 or newer.
- **Node.js:** Version 18.x or 20.x LTS with `npm`.
- **Database Server:** MariaDB 10.4+ or MySQL 8.0+ running locally or accessible over TCP.
- **Git:** Version 2.30 or newer.

---

## Installation & Setup

### 1. Database Setup

Connect to your database server as an administrator (e.g. `root`) and create the database along with the application account:

```sql
CREATE DATABASE frontdesk CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'frontdesk'@'127.0.0.1' IDENTIFIED BY 'replace-with-a-strong-password';
```

Apply initial privileges:
```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON frontdesk.* TO 'frontdesk'@'127.0.0.1';
GRANT LOCK TABLES ON frontdesk.* TO 'frontdesk'@'127.0.0.1';
FLUSH PRIVILEGES;
```

---

### 2. Backend Setup

From the repository root:

#### Windows (PowerShell)
```powershell
cd backend
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

#### Linux / macOS (Bash)
```bash
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Generate a secure 64-character secret key:
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Edit `backend/.env` with your database credentials and paste the generated `SECRET_KEY`.

#### Execute Database Migrations
Run the migration command using your database administrator credentials:
```bash
python -m flask --app app db-upgrade --user root --ask-password
```

#### Provision Initial Administrator
Create the primary system administrator account:
```bash
python -m flask --app app staff-create --role admin --name "Frontdesk Admin" --email admin@example.com
```
*(Enter a strong password of 15 to 128 characters when prompted)*

---

### 3. Frontend Setup & Build

Compile the React + TypeScript frontend into the production bundle served by Flask:

```bash
cd ../frontend-react
npm install
npm run build
```

The build compiles the React application directly into `backend/web/`.

---

## Environment Variables

Configure `backend/.env` using the provided `.env.example` reference:

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `DB_HOST` | Database server hostname or IP | `127.0.0.1` |
| `DB_PORT` | Database server port | `3306` |
| `DB_NAME` | MariaDB / MySQL database name | `frontdesk` |
| `DB_USER` | Database application username | `frontdesk` |
| `DB_PASSWORD` | Database application password | *(Your secret password)* |
| `SECRET_KEY` | Flask session encryption key (min. 32 chars) | *(Generated hex token)* |
| `SESSION_COOKIE_SECURE` | Enforce HTTPS cookies (`true` in production) | `false` (for local development) |
| `FRONTDESK_PUBLIC_URL` | Public-facing portal URL for email links | `http://127.0.0.1:5000` |
| `FRONTDESK_SMTP_HOST` | Outbound SMTP server hostname | `127.0.0.1` |
| `FRONTDESK_SMTP_PORT` | Outbound SMTP server port | `587` |
| `FRONTDESK_SMTP_SECURITY` | Encryption protocol (`plain`, `starttls`, `ssl`) | `starttls` |
| `FRONTDESK_SMTP_FROM` | Outbound notification sender address | `support@example.com` |
| `FRONTDESK_SMTP_USER` | SMTP username | *(Optional)* |
| `FRONTDESK_SMTP_PASSWORD`| SMTP password | *(Optional)* |

---

## Running the Application Locally

For full ticket lifecycle automation, run the web server alongside the lifecycle worker in separate terminal windows:

### Terminal 1: Web Application Server
```bash
cd backend
# Windows: .\.venv\Scripts\Activate.ps1  |  Linux: source .venv/bin/activate
python -m flask --app app run --host 127.0.0.1 --port 5000
```
Open **`http://127.0.0.1:5000/`** in your browser.

### Terminal 2: Ticket Lifecycle Worker
Processes overdue milestones and automatic inactivity closures every 30 seconds:
```bash
cd backend
python -m flask --app app ticket-lifecycle --watch
```

### Terminal 3 (Optional): Notification Dispatch Worker
Dispatches queued customer reply emails from the outbox table:
```bash
cd backend
python -m flask --app app notification-worker --watch
```

---

## Verification & Testing

### Backend Unit Tests
Verify business calendar interval math, holiday exclusions, and SLA calculation rules:
```bash
cd backend
python -m unittest -v test_business_hours
python -m unittest -v test_web_app
```

### Static Asset Serving Check
Verify that the Flask server correctly routes to the React bundle and database:
```bash
curl http://127.0.0.1:5000/api/health
# Expected: {"database":"connected","status":"ok"}
```

### Frontend Type-Check & Build
Ensure zero TypeScript compilation errors and bundle integrity:
```bash
cd frontend-react
npm run build
```

---

## Production Deployment Guidelines

1. **WSGI Application Server:**
   Deploy the Flask application using a production WSGI server such as **Gunicorn** (Linux) or **Waitress** (Windows):
   ```bash
   gunicorn --workers 4 --bind 127.0.0.1:5000 "app:create_app()"
   ```
2. **Reverse Proxy (Nginx / Caddy):**
   Place Nginx or Caddy in front of Gunicorn to handle SSL/TLS termination, HTTP/2, and proxy buffering.
3. **Enforce Secure Cookies:**
   In your production `.env`, set:
   ```env
   SESSION_COOKIE_SECURE=true
   ```
4. **Daemonize Background Workers:**
   Use `systemd` or `supervisor` to maintain persistent execution of:
   - `python -m flask --app app ticket-lifecycle --watch`
   - `python -m flask --app app notification-worker --watch`
5. **Attachment Backups:**
   Persist and back up the `backend/.local/attachments` directory along with regular MariaDB database dumps.

---

## Author & Attribution

- **Original Base:** Developed for Arvo Systems support portal requirements.
- **React Migration & Modernization:** Migrated from Flutter to React 18, TypeScript, Tailwind CSS, and HashRouter architecture.
- **License:** All rights reserved to their respective copyright holders. Open-source dependencies are subject to their respective MIT, BSD, and Apache-2.0 licenses.
