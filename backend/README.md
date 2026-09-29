# SIM Free

## Description

Sim-Free runs SimulationCraft for a pasted SimC addon profile. Items listed
under `### Gear from Bags` are detected by the frontend. Selected items replace
the currently equipped item in the same slot, and the resulting profile is sent
to the existing simulation endpoint. SimulationCraft returns its HTML report
directly for display in the frontend. Select at most one item per slot and up
to 20 items per simulation.

### Installation
```bash
git clone https://github.com/alexohneander/sim_free
cd sim_free

python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Run
```bash
fastapi run main.py
```
