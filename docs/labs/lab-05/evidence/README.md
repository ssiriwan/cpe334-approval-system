# Lab 5 evidence

Raw capture files referenced by `../evidence-index.md`. Files here are transcripts, not
summaries: they are pasted verbatim so a TA can see what the commands actually printed.

| File | Check | What it proves |
| :--- | :---: | :--- |
| `c03-clean-clone.log` | C-03 | A fresh clone of the public repository builds and runs with only `.env.example` copied to `.env`, on a **fresh** database volume: migration applied, container healthy, `/api/health` reporting the clone's commit, demo accounts seeded, then a login and a request created through the API to PostgreSQL and read back |

## How `c03-clean-clone.log` was produced (2026-11-15)

Environment: Windows, Docker Desktop, `docker compose` v2, no local `.env`, no `node_modules`.

```powershell
$root = "$env:TEMP\lab5-c03"
git clone https://github.com/ssiriwan/cpe334-approval-system.git "$root\repo"
cd "$root\repo"
git rev-parse HEAD          # f35ad24ede42ed5522b20a68179473bf286744f3
cp .env.example .env        # only placeholder values, nothing edited

# Ports 3100/5435 so the check does not collide with anything already running.
$env:APP_PORT="3100"; $env:POSTGRES_PORT="5435"
$env:GIT_COMMIT=(git rev-parse HEAD)

# Isolated compose project so the database volume is genuinely empty.
docker compose -p lab5-c03 up --build --detach
docker compose -p lab5-c03 ps
docker compose -p lab5-c03 logs migrate
curl http://localhost:3100/api/health

docker compose -p lab5-c03 --profile seed run --rm seed
```

Then the API round trip (login, create request, read it back) captured in the same file.

Notes for honesty:

- The image build output is not in the log; the build ran once from this clone and later
  `up` calls reused the cached image. The `migrate` excerpt is from the fresh volume, which is
  the part that matters for R-04 style reproducibility.
- `POSTGRES_PORT` and `APP_PORT` are overrides that only change the host ports, not the
  application configuration; `docker-compose.yml` documents them in `.env.example`.
- No password, token, or connection string appears in the file. The demo password is used by
  the API call but is never echoed.
- Teardown afterwards: `docker compose -p lab5-c03 down --volumes`.
