FROM python:3.11-slim

WORKDIR /app

# Install system dependencies and build tools
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    git \
    && rm -rf /var/lib/apt/lists/*

# Pre-install setuptools and setuptools-scm to fix pkg_resources error
RUN pip install --no-cache-dir setuptools setuptools-scm wheel

# Copy requirements
COPY requirements.txt .

# Install Python dependencies with longer timeout
RUN pip install --no-cache-dir --default-timeout=1000 -r requirements.txt

# Copy application  
COPY . .

# Expose port
EXPOSE 10000

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "10000"]
