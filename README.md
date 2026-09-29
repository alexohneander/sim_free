# SimC-Free: Your Self-Hosted, Open-Source Raid Bot

## What is SimC-Free?
SimC-Free is an open-source, customizable raid bot designed to simulate and analyze player performance in massively multiplayer online role-playing games (MMORPGs). Unlike proprietary raid bots, SimC-Free offers complete transparency, allowing users to modify and extend its functionality to suit their specific needs.

Paste the full SimulationCraft addon profile into the frontend. Items listed
under `### Gear from Bags` are detected automatically. Select up to 20 items,
including multiple alternatives per slot, to simulate their Top Gear
combinations alongside your current gear in one HTML report.

### How to Use:

```bash
git clone https://github.com/alexohneander/sim_free.git

docker build -t sim-free .
docker run -p 8000:8000 sim-free
```
