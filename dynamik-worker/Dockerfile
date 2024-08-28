FROM python:3.11-buster AS builder

RUN pip install poetry==1.8.3

ENV POETRY_NO_INTERACTION=1
ENV POETRY_VIRTUALENVS_IN_PROJECT=1
ENV POETRY_VIRTUALENVS_CREATE=1
ENV POETRY_CACHE_DIR=/tmp/poetry_cache

WORKDIR /dynamik

COPY ./pyproject.toml ./poetry.lock /dynamik/

RUN --mount=type=cache,target=$POETRY_CACHE_DIR poetry install --no-root

FROM python:3.11-slim-buster AS runtime

ENV PATH="/dynamik/.venv/bin:$PATH"

WORKDIR /dynamik

COPY --from=builder /dynamik/.venv /dynamik/.venv
COPY ./runner /dynamik/runner

ENTRYPOINT ["python", "-m", "runner"]