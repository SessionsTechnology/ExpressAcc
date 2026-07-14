# Routioneer demo deployment

This branch is the public, disposable Routioneer demo. It is intentionally separate from `main` so it can be deployed at its own URL without changing the production/self-hosted application.

## Demo behavior

- Sample users, items, chores, activity, and credentials are restored when the container starts.
- The same sample data is restored on fixed 15-minute boundaries (`:00`, `:15`, `:30`, and `:45`).
- Open browsers return to the demo home screen after a reset.
- Admin and user sessions are invalidated at reset time.
- The Family Space has no password or user PINs, so visitors can try it immediately.
- The demo admin password is `demo-admin` and is displayed in the demo banner.
- Credential changes are blocked, including admin and Family Space passwords, user PINs, password recovery, and backup restore.

Do not place real data or real credentials in this deployment. Visitors have admin access until the next reset.

## Run beside the normal application

The Compose configuration on this branch is isolated from the normal deployment:

- image: `routioneer:demo`
- host port: `3002` by default
- data volume: `routioneer-demo-data`
- demo mode: always enabled

Start it with:

```sh
docker compose up -d --build
```

Open [http://localhost:3002](http://localhost:3002). Set `DEMO_PORT` if port 3002 is already in use.

The deployment can override `TZ`, `DEMO_RESET_MINUTES`, and `DEMO_ADMIN_PASSWORD`. The password must contain at least eight characters. Because the intended demo password is returned by the public status endpoint and displayed to visitors, it must never be reused anywhere else.

For a managed container host, deploy this branch as a second service and set `DEMO_MODE=true`. Give the service a separate hostname, database volume, and deployment trigger from the normal `main` service.

## Bring updates in from `main`

Use a regular merge so the published branch never needs a force-push:

```sh
git fetch origin
git switch codex/demo
git merge origin/main
npm ci
npm run check
git push origin codex/demo
```

Resolve conflicts in favor of the new application behavior from `main`, while retaining these demo-specific pieces:

- `server/demo.js`
- the demo startup/reset wiring in `index.js` and `server/api.js`
- the demo banner in `client/src/App.vue` and `client/src/assets/main.css`
- the isolated demo values in `docker-compose.yml`
- `test/demo.test.js` and this document

Configure the demo hosting service to redeploy whenever `codex/demo` is pushed. The normal service should continue to follow `main`.
