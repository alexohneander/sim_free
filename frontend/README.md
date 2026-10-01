# SimC-Free frontend

This Next.js frontend lets players submit a SimulationCraft addon profile,
select bag items, and view the HTML report produced by SimulationCraft. The
root Dockerfile builds the static frontend and packages it with the FastAPI and
SimulationCraft backend.

## Build

```bash
npm ci
npm run build
```

The static export is written to `out/`. For a complete working application,
build and run from the repository root with Docker; the frontend submits
profiles to the backend at the same origin. Each submitted simulation updates
the page URL with its unique job ID. Reloading or sharing that URL restores the
queue position or completed report while the result is retained in Redis
(24 hours by default).
