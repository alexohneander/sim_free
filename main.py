import os
import logging
import uuid
import time
import functools

from pathlib import Path
from simcrunner import Simc, JsonExport, Arguments, Profile

from typing import Union, Annotated
from fastapi import FastAPI, Form
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from starlette.responses import FileResponse, HTMLResponse
from simcrunner.simc import HtmlExport

# SIMC Settings
logging.basicConfig(level=logging.INFO)
# simc_path = os.path.join('tests', 'simc')
simc_path = "./"

app = FastAPI()
app.mount("/static", StaticFiles(directory="templates/static"), name="static")

# ROUTES
@app.get("/")
def read_root():
    index_path = os.path.join('templates', 'index.html')
    return FileResponse(index_path)

@app.post("/sim/current_gear")
def simulate_current_gear(simcprofile: Annotated[str, Form()]):

    profile_path = create_sim_arguments(simcprofile)
    export_path = create_html_export()
    html_export = HtmlExport(export_path)

    profile = Profile(profile_path)
    args = Arguments(profile, iterations=1000)

    runner = Simc(simc_path=simc_path)
    (runner
        .add_args(args)
        .add_args('target_error=0.05', threads=4)
        .add_args(html_export)
        .run())

    response = read_file_with_lru_cache(export_path)
    remove_temp_files(profile_path, export_path)

    return HTMLResponse(response)

# HELPER Functions
def create_profile(profile_path: str, profile_data: str):
    with open(profile_path, 'w') as file:
        # Write content to the file
        file.write(profile_data)

def create_html_export():
    rand_uuid = uuid.uuid4()
    export_path = os.path.join('results', str(rand_uuid)+'.html')

    return export_path

def create_sim_arguments(profile_data: str):
    rand_uuid = uuid.uuid4()
    profile_path = os.path.join('profiles', str(rand_uuid)+'.simc')

    create_profile(profile_path, profile_data)

    return profile_path

def remove_temp_files(profile_path: str, export_path: str):
    time.sleep(1)
    os.remove(export_path)
    os.remove(profile_path)

@functools.lru_cache(maxsize=2)
def read_file_with_lru_cache(file_path):
    # Read the file content
    with open(file_path, 'r', encoding="utf-8") as file:
        file_content = file.read()
        print(f"Reading from file: {file_path}")

    return file_content
