# Container installation and operations

Routioneer publishes a prebuilt container image at `ghcr.io/sessionstechnology/routioneer`. The image supports 64-bit Intel/AMD (`linux/amd64`) and 64-bit ARM (`linux/arm64`) systems.

This guide is for people running Routioneer on their own server. Application development instructions remain in the main [README](../README.md).

## Requirements

- Docker Engine
- Docker Compose v2, available through the `docker compose` command
- A server that can reach `ghcr.io`
- Port `3001`, or another available port of your choice

## Install without cloning the repository

Create a small folder for the Compose file, download it, and start Routioneer:

```sh
mkdir -p routioneer
cd routioneer
curl -fsSLO https://raw.githubusercontent.com/SessionsTechnology/Routioneer/main/docker-compose.yml
docker compose up -d
```

Open `http://SERVER-IP:3001`, replacing `SERVER-IP` with the address of your server. The first page will ask for a household name, an admin password, and a time zone.

The Compose file pulls `ghcr.io/sessionstechnology/routioneer:latest`. It does not download the source code or build the application.

## Configuration

The Compose file accepts these optional values:

| Setting | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3001` | Port used to open Routioneer from a browser |
| `TZ` | `America/Chicago` | Time zone used by the container and daily schedules |

Provide values when starting the container:

```sh
TZ=America/New_York PORT=8080 docker compose up -d
```

For settings that should survive restarts and updates, create a `.env` file beside `docker-compose.yml`:

```dotenv
TZ=America/New_York
PORT=8080
```

Then use the normal `docker compose up -d` command.

## Persistent data

Routioneer stores its database at `/data/db.json` inside the container. Compose mounts that directory from the logical volume key `express-acc-data`. The old key is intentionally retained so upgrades from ExpressAcc continue using the same data.

Docker normally prefixes a Compose-managed volume with the project name. For example, a Compose file in a folder named `routioneer` commonly creates `routioneer_express-acc-data`. Keep the Compose file in the same folder when updating an existing installation. Do not run `docker compose down -v` unless you intend to delete the stored application data.

The container itself is replaceable. Only the data volume and any backups you download need to be preserved.

## Update Routioneer

Before an update, open **Parent dashboard → Settings → Data** and select **Download backup**. Store the downloaded JSON file somewhere outside the Docker server.

From the folder containing `docker-compose.yml`, run:

```sh
docker compose pull
docker compose up -d
docker compose ps
```

`pull` downloads the newest image. `up -d` replaces the old container while reusing the existing data volume. `ps` should show the `routioneer` service as running and, after its startup period, healthy.

If the Compose definition changes in a future release, download the current file before updating:

```sh
curl -fsSL https://raw.githubusercontent.com/SessionsTechnology/Routioneer/main/docker-compose.yml -o docker-compose.yml
docker compose pull
docker compose up -d
```

## Move from a source-built installation

Perform this migration in the existing Compose folder so Docker continues using the same project name and volume.

1. Download a backup from **Parent dashboard → Settings → Data**.
2. Stop the existing container without deleting its volume:

   ```sh
   docker compose down
   ```

3. Replace the old Compose file with the current one:

   ```sh
   curl -fsSL https://raw.githubusercontent.com/SessionsTechnology/Routioneer/main/docker-compose.yml -o docker-compose.yml
   ```

4. Pull and start the prebuilt image:

   ```sh
   docker compose pull
   docker compose up -d
   ```

5. Open Routioneer and confirm that the existing users, items, chores, and settings are present.

Do not add `-v` to the `docker compose down` command. That option deletes Compose-managed volumes and can remove the database you are trying to preserve.

## Image tags and rollback

- `latest` follows the production `main` branch and is the recommended tag for normal self-hosted updates.
- `sha-<commit>` identifies one exact source commit and never moves.
- Version tags such as `1.2.0`, `1.2`, and `1` are published when a matching Git tag such as `v1.2.0` is created.

For a repeatable deployment, replace `latest` in `docker-compose.yml` with a specific version or full commit tag. To roll back the application image, choose an earlier tag, then run:

```sh
docker compose pull
docker compose up -d
```

Application updates can migrate stored data. Keep a JSON backup from before the update and restore it from **Settings → Data** if the older application cannot use the newer database format.

## Health checks and logs

Check container state:

```sh
docker compose ps
```

Check the application health endpoint from the Docker host:

```sh
curl -fsS http://127.0.0.1:3001/api/health
```

Replace `3001` if you configured a different host port.

A healthy response is:

```json
{"ok":true}
```

View recent logs:

```sh
docker compose logs --tail=100 routioneer
```

Follow new logs until you press `Ctrl+C`:

```sh
docker compose logs -f routioneer
```

## Container security

The published image and Compose definition use these safeguards:

- The application runs as the non-root `node` user.
- The container filesystem is read-only except for `/data` and a small temporary filesystem.
- Linux capabilities are dropped.
- Privilege escalation is disabled.
- The image includes an HTTP health check.
- Image metadata links each package back to its source repository and license.
- GitHub Actions publishes build-provenance attestations with each image.

If Routioneer is available outside a trusted private network, place it behind a maintained HTTPS reverse proxy and enable a separate Family Space password under **Parent dashboard → Settings → General**.

## How images are published

The [container workflow](../.github/workflows/container.yml) builds the Dockerfile for `linux/amd64` and `linux/arm64`, publishes the tags to GitHub Container Registry, and attaches build provenance. It runs for application changes on `main`, matching `v*` tags, and manual workflow dispatches. Documentation- and landing-page-only changes do not rebuild the application image.

The image is linked to the Routioneer repository through Open Container Initiative metadata. The workflow uses GitHub's short-lived `GITHUB_TOKEN`; no long-lived registry password is stored in the repository.
