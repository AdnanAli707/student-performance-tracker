# Student Performance Tracker

A JavaScript web application for tracking student marks, attendance, and auto-calculated grades.

## Modules

- Login Portal: choose Teacher or Student before opening a dashboard.
- Teacher Panel: add or update student marks and attendance.
- Student Panel: students view performance by entering their ID.
- Admin Panel: inspect the visible database, export JSON, import JSON, and clear records.

## Demo Login

- Teacher: ID `TCH-001`, username `teacher`
- Student: use an ID and username saved in the database, for example after loading sample data use ID `STU-1001`, username `Ayesha Khan`

## Grade Automation

- A: 80 to 100
- B: 60 to 79
- C: below 60

## Database

The app uses browser `localStorage` as a lightweight database so it can run directly on GitHub Pages without a backend server. First-time users get sample records so the database can be demonstrated immediately. Data remains visible in the same browser until it is cleared. The Teacher Panel shows a database table, and the Admin Panel shows the full JSON database with export/import controls.

## Run Locally

Open `index.html` in a browser, or serve the folder with any static server.
