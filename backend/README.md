# Frontdesk API

The Flask development server serves the API and the built React site at `http://127.0.0.1:5000/`.

## Database setup

Start your MySQL or MariaDB server and connect using a database administrator account. Run the following SQL with your chosen application password.

```sql
CREATE DATABASE frontdesk CHARACTER SET utf8mb4;
CREATE USER 'frontdesk'@'127.0.0.1' IDENTIFIED BY 'replace-with-a-strong-password';
```

Use the same database name, host, application user, and password in `.env`. If you customize the database name or account host, update the SQL below to match. Run the migration command from the [Windows or Linux setup](../README.md#run-locally) using an account with permission to create tables and triggers in this schema.

### Application account grants

After the migration, run these statements as the database administrator.

```sql
GRANT SELECT, INSERT ON frontdesk.accounts TO 'frontdesk'@'127.0.0.1';
GRANT UPDATE (manager_id, password_hash, must_change_password, password_version) ON frontdesk.accounts TO 'frontdesk'@'127.0.0.1';
GRANT SELECT, INSERT ON frontdesk.audit_events TO 'frontdesk'@'127.0.0.1';
GRANT SELECT, INSERT, UPDATE (owner_id, ownership_version) ON frontdesk.tickets TO 'frontdesk'@'127.0.0.1';
GRANT SELECT, INSERT ON frontdesk.ticket_messages TO 'frontdesk'@'127.0.0.1';
GRANT SELECT, INSERT ON frontdesk.ticket_attachments TO 'frontdesk'@'127.0.0.1';
GRANT UPDATE (priority) ON frontdesk.tickets TO 'frontdesk'@'127.0.0.1';
GRANT UPDATE (status, waiting_since, waiting_until, waiting_message_id, closed_at) ON frontdesk.tickets TO 'frontdesk'@'127.0.0.1';
GRANT SELECT ON frontdesk.sla_calendar_lock TO 'frontdesk'@'127.0.0.1';
GRANT SELECT, INSERT ON frontdesk.holiday_events TO 'frontdesk'@'127.0.0.1';
GRANT SELECT, INSERT ON frontdesk.ticket_sla_cycles TO 'frontdesk'@'127.0.0.1';
GRANT UPDATE (ended_at, closure_status) ON frontdesk.ticket_sla_cycles TO 'frontdesk'@'127.0.0.1';
GRANT SELECT, INSERT, UPDATE (deadline_at, deadline_kind, completed_at, breached_at, result) ON frontdesk.ticket_sla_milestones TO 'frontdesk'@'127.0.0.1';
GRANT UPDATE (paused_work_us) ON frontdesk.ticket_sla_milestones TO 'frontdesk'@'127.0.0.1';
GRANT SELECT, INSERT, UPDATE (status, claimed_at, sent_at, failed_at, failure_reason) ON frontdesk.reply_notifications TO 'frontdesk'@'127.0.0.1';
GRANT SELECT, INSERT, UPDATE, DELETE ON frontdesk.customer_verifications TO 'frontdesk'@'127.0.0.1';
```

On MySQL, grant the application account schema-scoped locking permission for the queries that use `SELECT ... FOR UPDATE`. [MySQL locking read documentation](https://dev.mysql.com/doc/refman/8.4/en/innodb-locking-reads.html)

```sql
GRANT LOCK TABLES ON frontdesk.* TO 'frontdesk'@'127.0.0.1';
```

When upgrading an existing Frontdesk database, run `python -m flask --app app sla-backfill` with the backend virtual environment's Python before starting Flask.

## Staff accounts and audit history

New customers request a verification link with their name and email. The link is valid for one hour and allows them to choose a password and create their account. Existing accounts retain access. Signup sends email directly, so configure the portal URL and SMTP settings in `.env` and reload Flask to enable registration. The reply notification worker handles ticket emails separately.

For local testing with an SMTP capture server running on the same machine, set `FRONTDESK_PUBLIC_URL=http://127.0.0.1:5000`, `FRONTDESK_SMTP_HOST=127.0.0.1`, `FRONTDESK_SMTP_SECURITY=plain`, and the capture server's port and a valid sender address. Leave its SMTP username and password empty if it accepts anonymous local connections.

Admins use **Staff Management** to create managers, create agents under an active manager, and move agents between teams. Managers use the same screen to create agents for their own team. Existing agents with no manager appear as **Unassigned** for admins.

Staff created in the portal sign in with their temporary password and choose a permanent password before accessing their workspace. Creating accounts, moving agents, and setting the first permanent password are recorded in the audit history.

The `staff-create` command is available for local setup and administrative bootstrap. It prompts for the account password and supports `agent`, `manager`, and `admin` roles.

See the [local setup commands](../README.md#run-locally) for creating an administrator on Windows or Linux.

Passwords must have 15 to 128 characters. `GET /api/audit` returns the latest 100 audit entries to signed-in managers and administrators. Entries record the actor, action, account affected, and UTC timestamp. Database triggers reject updates and deletes, and the application database account has read and append privileges on the history.

## Tickets

Customers use **My tickets** to open and follow their own tickets. New tickets start at Medium. The answer **No, I’m blocked** creates an Urgent ticket and flags the reported block for staff.

Staff can open the **Unassigned** queue and **Assigned to me**. Managers and administrators also have **All tickets** and can assign or transfer any active ticket. The current owner can hand over their own ticket to an active agent. Create accounts with the `agent` role to make those agents available as transfer recipients.

Only the current owner can send a public staff reply. **Private note** is a separate action and appears only in the staff conversation. Claiming, transferring, replying, and adding notes record the actor and time in the audit history.

## Attachments

Use **Attach files** when opening a ticket, sending a public reply, or adding a private note. Each submission accepts up to five files of 15 MB each. Replies and notes can contain attachments alone. A private note’s files are available only to staff who can access the ticket.

Frontdesk saves the file bytes under `backend/.local/attachments` and the attachment metadata in the database. Downloads use the same ticket access rules as the conversation. Keep the attachment folder with database backups.

## Working hours and SLA deadlines

Run backend commands below from `backend/` with the virtual environment active. Activate it with `.venv/bin/activate` sourced on Linux or `.\.venv\Scripts\Activate.ps1` in PowerShell. You can also use the virtual environment's Python executable as shown in the [local setup guide](../README.md#run-locally).

The ticket queue shows separate response and resolution overdue indicators. Ticket details show each promised deadline in IST and the first public staff response time when available. Staff can use **Change priority** on active tickets they can access. An upgrade compares each pending deadline with the new priority's promise. A downgrade keeps the existing promise.

Managers and admins use **Holidays** to add and remove dates. Edits affect future working time and write an audit entry for every deadline that moves. Completed milestones and recorded breaches retain their historical deadlines.

The urgent resolution rule uses same-day close for arrivals and escalations before closing on a working day, including before opening. An urgent ticket arriving at 6:00 PM on a working day is due at 6:30 PM. At closing time or on a non-working day, the deadline moves to the next working day's close.

Ticket views calculate current overdue indicators when loaded. The idempotent `sla-check` command records outstanding breaches in the audit history. Responses and timing edits also record applicable breaches as they happen.

```sh
python -m unittest -v test_business_hours
python -m flask --app app sla-check
```

## Waiting, closure, and reopening

The assigned agent can select **Wait for customer reply** and use **Send reply and wait** or select **Waiting on customer** after the latest public reply to the customer. The status pauses the applicable SLA deadlines and starts a separate 45-working-hour inactivity countdown. The customer's next reply resumes the deadlines. The assigned agent can also **Mark resolved** and confirm the resolution.

Customers can reopen either closure outcome for seven calendar days from closure. Reopening starts a fresh SLA cycle at the ticket's current priority. The ticket goes back to its previous owner when that account is active, or to the unassigned queue. Staff can expand **Previous SLA cycles** to see earlier outcomes. A resolution without a public staff reply records the missing first response as **Not applicable** if its deadline was still pending, or **Late** if it was missed.

Run the worker alongside Flask to check for inactivity closures and record overdue milestones. It checks every 30 seconds by default and uses the actual inactivity cutoff as the closure time. Omit `--watch` to run one check.

```sh
python -m flask --app app ticket-lifecycle --watch
```

## Dashboards, reports, and notifications

The ticket dashboard shows counts and status filters within the selected ticket scope. Customers can use **Needs your reply** to find their tickets waiting on them. Managers and admins use **Reports** to review deadline misses, open each ticket's audit history, see closure activity over time, and compare staff resolutions.

Report dates are inclusive in IST. Misses use the date of the missed deadline. Closures count each SLA cycle ending in the period, with reopening counted when a later cycle exists. The leaderboard credits the staff member who resolved each cycle and shows how many they resolved on time. Notification totals use the date each message was queued.

New public staff replies queue one email containing the ticket number and a portal link. The customer signs in to follow the link. Configure the `FRONTDESK_PUBLIC_URL` and `FRONTDESK_SMTP_*` values from `.env.example` to deliver the queued emails. An external mail server requires an HTTPS portal URL and `starttls` or `ssl`. Plain SMTP and HTTP portal URLs are reserved for loopback tests.

```sh
python -m flask --app app notification-worker --watch
```

The outbox retains queued notifications until delivery is configured and the worker is running. **Sent** means the SMTP server accepted the message. Delivery confirmation requires a receipt from the mail provider. Failed and uncertain attempts are recorded for review.
