#!/usr/bin/env python3
"""
Production server configuration for the Campus Nutrition App backend.

This script configures uvicorn with production-optimized settings including:
- Multiple worker processes for better concurrency
- Optimized connection settings
- Proper logging configuration
- Health checks and monitoring endpoints

Usage:
    python production_server.py

Environment Variables:
    HOST: Server host (default: 0.0.0.0)
    PORT: Server port (default: 8000)
    WORKERS: Number of worker processes (default: auto-detected)
    ENVIRONMENT: Must be set to 'production' for production optimizations
"""

import os
import multiprocessing
import uvicorn
from main import app

def get_worker_count():
    """Calculate optimal number of workers based on CPU cores"""
    # Formula: (2 x CPU cores) + 1, but cap at reasonable limits
    cores = multiprocessing.cpu_count()
    workers = min(max((2 * cores) + 1, 2), 8)  # Between 2-8 workers
    return workers

def main():
    # Server configuration
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    workers = int(os.getenv("WORKERS", get_worker_count()))
    
    # SSL configuration (optional - usually handled by nginx/proxy)
    ssl_keyfile = os.getenv("SSL_KEYFILE")
    ssl_certfile = os.getenv("SSL_CERTFILE")
    
    # Ensure production mode is enabled
    if os.getenv("ENVIRONMENT") != "production":
        print("WARNING: ENVIRONMENT should be set to 'production' for optimal performance")
    
    protocol = "https" if ssl_keyfile and ssl_certfile else "http"
    print(f"Starting production server on {protocol}://{host}:{port} with {workers} workers")
    
    if ssl_keyfile and ssl_certfile:
        print(f"SSL enabled with cert: {ssl_certfile}")
    else:
        print("SSL disabled - using HTTP (recommended to use nginx/proxy for HTTPS)")
    
    # Production uvicorn configuration
    config = {
        "app": "main:app",
        "host": host,
        "port": port,
        "workers": workers,
        # Connection settings
        "backlog": 2048,  # Queue size for pending connections
        "limit_concurrency": 1000,  # Max concurrent connections per worker
        "limit_max_requests": 1000,  # Restart worker after N requests (prevents memory leaks)
        "timeout_keep_alive": 5,  # Keep-alive timeout
        "timeout_graceful_shutdown": 30,  # Graceful shutdown timeout
        # Logging
        "log_level": "info",
        "access_log": True,
        # Performance
        "loop": "uvloop",  # Use uvloop for better performance (if available)
        "http": "httptools",  # Use httptools for better HTTP parsing
        # Process management
        "reload": False,  # Disable auto-reload in production
    }
    
    # Add SSL configuration if certificates are provided
    if ssl_keyfile and ssl_certfile:
        config.update({
            "ssl_keyfile": ssl_keyfile,
            "ssl_certfile": ssl_certfile,
        })
    
    uvicorn.run(**config)

if __name__ == "__main__":
    main()