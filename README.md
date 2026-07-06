# HQEPL Project Management System (PMS)

A comprehensive Project Management System designed to handle task delegation, weekly performance scoring, document generation, and analytics.

The repository is structured as a monorepo containing both the frontend client and the backend server.

## Project Structure

- `/client`: The React frontend application. Built with Vite, TailwindCSS, and React Router.
- `/server`: The Django backend API. Powered by Django REST Framework and PostgreSQL.
- `cronjob.md`: Instructions for configuring scheduled tasks (like the weekly email).
- `API_DOCUMENTATION.md`: Detailed documentation of the API endpoints.

## Quick Start

### 1. Backend (Server)
Navigate to the `server` directory, install Python dependencies, run migrations, and start the development server.
```bash
cd server
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```
*For detailed instructions, see [server/README.md](./server/README.md).*

### 2. Frontend (Client)
In a new terminal, navigate to the `client` directory, install npm packages, and start the Vite development server.
```bash
cd client
npm install
npm run dev
```
*For detailed instructions, see [client/README.md](./client/README.md).*

## Core Features
- **Task Management**: Create, assign, and track tasks.
- **Role-Based Access**: Specialized dashboards for Employees, SGMs, Admins, and Clients.
- **Analytics & Reporting**: Automatic generation of weekly performance score PDFs.
- **Excel Import/Export**: Bulk import tasks via `.xlsx`.
- **Notifications & Reminders**: Repeat task reminders.

## Scheduled Jobs
Certain features, like the weekly performance email, rely on external cron jobs. See [cronjob.md](./cronjob.md) for setup instructions.