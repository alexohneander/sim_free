FROM simulationcraftorg/simc:latest

ENV LANG=de_DE.UTF-8

RUN apk add --no-cache python3 py3-pip git

ENV VIRTUAL_ENV=/opt/venv
RUN python3 -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# Install dependencies:
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 8000

ENTRYPOINT []

CMD ["fastapi", "run", "main.py", "--port", "8000"]
