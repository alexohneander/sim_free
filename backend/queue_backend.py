import os
from functools import lru_cache

from redis import Redis
from rq import Queue
from rq.job import Job

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
QUEUE_NAME = os.getenv("SIMULATION_QUEUE_NAME", "simulations")
RESULT_TTL_SECONDS = int(os.getenv("SIMULATION_RESULT_TTL_SECONDS", "86400"))
JOB_TIMEOUT_SECONDS = int(os.getenv("SIMULATION_TIMEOUT_SECONDS", "3600"))


@lru_cache(maxsize=1)
def get_redis_connection() -> Redis:
    return Redis.from_url(REDIS_URL)


def get_simulation_queue() -> Queue:
    return Queue(
        QUEUE_NAME,
        connection=get_redis_connection(),
        default_timeout=JOB_TIMEOUT_SECONDS,
    )


def get_queue_position(job: Job) -> int | None:
    position = get_simulation_queue().get_job_position(job)
    return position + 1 if position is not None else None


def enqueue_simulation(
    simcprofile: str,
    raidbots_options: bool = False,
) -> Job:
    from tasks import run_simulation

    return get_simulation_queue().enqueue(
        run_simulation,
        simcprofile,
        raidbots_options,
        job_timeout=JOB_TIMEOUT_SECONDS,
        result_ttl=RESULT_TTL_SECONDS,
        failure_ttl=RESULT_TTL_SECONDS,
    )
