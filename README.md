# Routioneer

Routioneer is a self-hosted shared-item checkout, screen-time, and chore manager for families, classrooms, churches, and other small communities.

Users can check shared items in and out, see their remaining timed-device allowance, and submit completed chores. Admins can monitor activity, adjust time, approve chore rewards, edit schedules, and back up or restore the installation.

## What is included

- Restart-safe timed checkouts based on persisted timestamps
- Per-day time allowances in a configurable time zone
- Optional Family Space password with a remembered 30-day device session, strongly recommended for public-internet deployments
- PIN-protected user access and separately password-protected admin access
- Real-time checkout and countdown updates across connected screens
- Item availability enforcement (one item cannot be checked out twice)
- Per-user item assignments and chore-only profiles without checkout timers
- One-time, daily, and weekly chores with approval-based time rewards
- Read-only kiosk chore board with visible assignees
- Admin dashboard, activity history, and manual time adjustments
- JSON backup and restore, including automatic pre-migration/import backups
- Automatic migration from the original `adminSettings/users/items/userItemAssociations` database format
- Responsive, accessible Vue and Vuetify interface

## Technology

- Node.js 24 LTS
- Express 5
- Vue 3.5 and Vue Router 5
- Vite 8 and Vuetify 4
- Socket.IO 4.8
- lowdb 7
- Zod validation, Helmet security headers, and request rate limiting

## Run locally

Node.js 24 or newer is required.

```sh
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The Vue development server forwards application requests to the API on port 3001.

Useful commands:

```sh
npm run check   # automated tests and production build
npm run build   # production client bundle
npm start       # serve the production bundle on port 3001
```

By default, application data is written to `lowdb/db.json`. Override it with `DATABASE_FILE=/path/to/db.json`. The server also respects `PORT`, `HOST`, and `TZ`.

## Run with Docker

```sh
docker compose up -d --build
```

Open [http://localhost:3001](http://localhost:3001). Data is stored in the legacy-named `express-acc-data` Docker volume so existing installations keep using their original database after upgrading.

Optional environment overrides:

```sh
TZ=America/New_York PORT=8080 docker compose up -d
```

## Upgrading an older ExpressACC installation

1. Back up the existing `lowdb/db.json` or Docker volume.
2. Start the new version with the same data location.
3. The Compose configuration continues using the `express-acc-data` volume key for upgrade compatibility; do not replace it with a new empty volume.
4. Routioneer migrates the legacy schema and former default application name on first launch, then saves the original file as `db.json.bak`. Custom application names remain unchanged.
5. Sign in with the existing admin password and review users, items, and daily allowances.

Legacy plaintext passwords and PINs are converted to salted scrypt hashes during migration. They are never returned to the browser afterward.

## Backup and recovery

Use **Admin → Settings → Data** to download a complete JSON backup. Restoring a backup first copies the current database to `db.json.bak`. Keep external copies of important backups; the `.bak` file only protects the most recent migration or restore operation.

If the admin password is lost, choose **Forgot admin password?** on the admin sign-in screen and send a recovery code to the Docker logs. View it from the Docker host with:

```sh
docker compose logs routioneer
```

Enter the code and a new password on the sign-in screen within 10 minutes. Recovery codes can only be used once, are never sent to the browser, and a successful reset signs out existing admin sessions.

## Security notes

Routioneer is designed for self-hosting. Family Space can optionally be protected from **Admin → Settings → General** with a password that is separate from the admin password. Protection is strongly recommended before exposing Routioneer to the public internet, but can remain off when the app is only reachable on a trusted private network behind a firewall. Its HTTP-only, same-site session is remembered for 30 days on each signed-in device and is invalidated immediately when the Family Space password changes. Admin sessions also use an HTTP-only, same-site cookie. User sessions are short-lived and scoped to one user. Login attempts are rate-limited, inputs are validated on the server, and household real-time data is only sent to authorized Family Space or admin sessions when protection is enabled.

For access over the public internet, place Routioneer behind a maintained HTTPS reverse proxy and follow normal network-hardening practices.

## License

AGPL-3.0. See [LICENSE](LICENSE).
