"""Wait until PostgreSQL is available before booting Django."""

import os
import time

import psycopg2


def wait_for_db(max_retries: int = 30, delay_seconds: int = 2) -> None:
    """Poll PostgreSQL connectivity until available or raise an error."""
    config = {
        'dbname': os.getenv('POSTGRES_DB', 'support_tickets'),
        'user': os.getenv('POSTGRES_USER', 'postgres'),
        'password': os.getenv('POSTGRES_PASSWORD', 'postgres'),
        'host': os.getenv('POSTGRES_HOST', 'db'),
        'port': os.getenv('POSTGRES_PORT', '5432'),
    }

    for _ in range(max_retries):
        try:
            connection = psycopg2.connect(**config)
            connection.close()
            return
        except psycopg2.OperationalError:
            time.sleep(delay_seconds)

    raise RuntimeError('Database is unavailable after multiple retry attempts.')


if __name__ == '__main__':
    wait_for_db()
