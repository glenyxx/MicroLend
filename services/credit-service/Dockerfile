# Python 3.11 on Debian slim - better wheel support for data science packages
FROM python:3.11-slim

# Install build tools needed to compile some Python packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
# Install numpy first to avoid dependency errors with numba/llvmlite
RUN pip install --no-cache-dir numpy
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN python generate_data.py && python train_model.py

EXPOSE 3003

CMD ["sh", "start.sh"]