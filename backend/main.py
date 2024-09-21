import os
import logging
import uuid
import time
import functools

from pathlib import Path
from simcrunner import Simc, JsonExport, Arguments, Profile

from typing import Union, Annotated
from fastapi import FastAPI, Form

from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from starlette.responses import FileResponse, HTMLResponse
from simcrunner.simc import HtmlExport

# SIMC Settings
logging.basicConfig(level=logging.INFO)
# simc_path = os.path.join('tests', 'simc')
simc_path = "./"

app = FastAPI(
    title = "SimC-Free Backend",
    version="0.1.0",
)

origins = [
    "http://localhost",
    "http://localhost:3000",
    "http://localhost:8000",
    "http://127.0.0.1",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8000",
    "https://sim-free.dev-null.rocks",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GZipMiddleware(app, 500, 9)

app.mount("/_next", StaticFiles(directory="templates/_next"), name="static")
app.mount("/img", StaticFiles(directory="templates/img"), name="static")

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

    return FileResponse(export_path)

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

@functools.lru_cache(maxsize=2)
def read_file_with_lru_cache(file_path):
    # Read the file content
    with open(file_path, 'r', encoding="utf-8") as file:
        file_content = file.read()
        print(f"Reading from file: {file_path}")

    return file_content
