from rq import Worker

from queue_backend import get_redis_connection, get_simulation_queue


def main() -> None:
    connection = get_redis_connection()
    queue = get_simulation_queue()
    Worker([queue], connection=connection).work()


if __name__ == "__main__":
    main()
