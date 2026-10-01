import os
import logging
import subprocess
from contextlib import asynccontextmanager

from typing import Annotated
from fastapi import FastAPI, Form, HTTPException, Response, status
from redis.exceptions import RedisError
from rq.exceptions import NoSuchJobError
from rq.job import Job

from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from starlette.exceptions import HTTPException as StarletteHTTPException
from fastapi.exception_handlers import http_exception_handler

from fastapi.staticfiles import StaticFiles
from starlette.responses import FileResponse

from queue_backend import (
    enqueue_simulation,
    get_redis_connection,
    get_queue_position,
)

# SIMC Settings
logging.basicConfig(level=logging.INFO)
simc_path = "./"


@asynccontextmanager
async def lifespan(app: FastAPI):
    result = subprocess.run(
        [os.path.join(simc_path, "simc")],
        capture_output=True,
        check=True,
        text=True,
    )
    version_output = f"{result.stdout}\n{result.stderr}"
    app.state.simc_version = next(
        (
            "SimulationCraft " + line.strip().split("SimulationCraft ", 1)[1]
            for line in version_output.splitlines()
            if "SimulationCraft " in line
        ),
        None,
    )
    if app.state.simc_version is None:
        raise RuntimeError("SimulationCraft did not report its version.")
    yield


app = FastAPI(
    title = "SimC-Free Backend",
    version="0.1.0",
    lifespan=lifespan,
)

origins = [
    "*",
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


@app.get("/api/simc-version")
def read_simc_version():
    return {"version": app.state.simc_version}


@app.exception_handler(StarletteHTTPException)
async def custom_http_exception_handler(request, exc):
    logging.warning("HTTP error on %s: %r", request.url.path, exc)
    if request.url.path.startswith(("/sim/", "/api/")) or exc.status_code != 404:
        return await http_exception_handler(request, exc)
    index_path = os.path.join('templates', '404.html')
    return FileResponse(index_path)

@app.post("/sim/current_gear")
def simulate_current_gear(
    response: Response,
    simcprofile: Annotated[str, Form()],
):
    try:
        job = enqueue_simulation(simcprofile)
    except RedisError as exc:
        logging.exception("Unable to enqueue simulation")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The simulation queue is temporarily unavailable.",
        ) from exc

    response.status_code = status.HTTP_202_ACCEPTED
    return {"job_id": job.id}


@app.get("/api/simulations/{job_id}")
def get_simulation_status(job_id: str):
    try:
        job = Job.fetch(job_id, connection=get_redis_connection())
        job_status = job.get_status(refresh=True)
        status_value = getattr(job_status, "value", job_status)
        queue_position = (
            get_queue_position(job)
            if status_value in ("created", "queued", "deferred", "scheduled")
            else None
        )
        report = (
            job.return_value(refresh=True)
            if status_value == "finished"
            else None
        )
    except NoSuchJobError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Simulation job not found or expired.",
        ) from exc
    except RedisError as exc:
        logging.exception("Unable to read simulation job %s", job_id)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The simulation queue is temporarily unavailable.",
        ) from exc

    if status_value == "finished":
        if not isinstance(report, str):
            logging.error("Finished simulation job %s has no HTML report", job_id)
            return {
                "status": "failed",
                "error": "The simulation finished without a report. Please retry.",
            }
        return {"status": "finished", "report": report}
    if status_value in ("failed", "stopped", "canceled"):
        return {
            "status": "failed",
            "error": "The simulation could not be completed. Please retry.",
        }
    if status_value == "started":
        return {"status": "started"}
    if status_value in ("created", "queued", "deferred", "scheduled"):
        return {"status": "queued", "queue_position": queue_position}

    logging.error("Simulation job %s has unexpected status %r", job_id, status_value)
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="The simulation job has an unexpected status.",
    )
