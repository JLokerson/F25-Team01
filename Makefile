# Makefile for running client and server simultaneously

# Default target
.DEFAULT_GOAL := help

# Help target
help:
	@echo "Available commands:"
	@echo "  make dev        - Run both client and server in development mode"
	@echo "  make client     - Run only the client"
	@echo "  make server     - Run only the server"
	@echo "  make install    - Install dependencies for both client and server"
	@echo "  make clean      - Clean node_modules for both client and server"

# Install dependencies for both client and server
install:
	@echo "Installing server dependencies..."
	cd server && npm install
	@echo "Installing client dependencies..."
	cd client && npm install

# Run both client and server simultaneously
dev:
	@echo "Starting client and server..."
	start /B cmd /c "cd server && node index.js"
	timeout /t 2 /nobreak > nul
	cd client && npm start

# Run only the client
client:
	@echo "Starting client..."
	cd client && npm start

# Run only the server
server:
	@echo "Starting server..."
	cd server && node index.js

# Clean node_modules
clean:
	@echo "Cleaning server node_modules..."
	if exist server\node_modules rmdir /s /q server\node_modules
	@echo "Cleaning client node_modules..."
	if exist client\node_modules rmdir /s /q client\node_modules

# Build client for production
build:
	@echo "Building client for production..."
	cd client && npm run build

.PHONY: help install dev client server clean build