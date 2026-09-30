# SIM Free

## Description

Sim-Free runs SimulationCraft for a pasted SimC addon profile. Items listed
under `### Gear from Bags` are detected by the frontend. Selected items replace
the currently equipped item in the same slot. When multiple items are selected
for a slot, they are alternatives to the currently equipped item. The frontend
generates a SimC Top Gear profile with one copied actor per combination other
than the original equipped gear, and enables `single_actor_batch=1`. SimC runs
the original actor and all gear combinations in a single simulation and
returns one HTML report. With no selection, only the original profile is
simulated. Select up to 20 items; profiles are limited to 100 total
combinations per run, including the original gear.

### Installation
```bash
git clone https://github.com/alexohneander/sim_free
cd sim_free

python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
```

The backend requires a SimulationCraft executable available in its working
directory. For the complete self-hosted setup, use the root Dockerfile, which
packages the frontend and SimulationCraft together.

### Run the backend
```bash
cd backend
fastapi run main.py
```
