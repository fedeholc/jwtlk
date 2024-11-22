#!/bin/bash

gnome-terminal --tab -- bash -c "cd backend && npm start; exec bash"

gnome-terminal --tab -- bash -c "cd backend && npm run test; exec bash"

gnome-terminal --tab -- bash -c "npx http-server ./frontend/src/; exec bash"

gnome-terminal --tab -- bash -c "cd frontend && npx vitest; exec bash"

gnome-terminal --tab -- bash -c "cd frontend && npx playwright test; exec bash"

gnome-terminal --tab -- bash -c "google-chrome  http://127.0.0.1:8080; exec bash"

