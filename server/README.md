# HQEPL PMS - Server (Backend)

This is the backend API for the HQEPL Project Management System, built with Django and Django REST Framework.

## Tech Stack
- **Framework**: Django 5.0
- **API**: Django REST Framework (DRF)
- **Authentication**: JWT (Simple JWT & PyJWT)
- **Database**: PostgreSQL (via `psycopg2-binary` and `dj-database-url`)
- **Server**: Gunicorn & Whitenoise (for static file serving)
- **Data Processing**: Pandas, Openpyxl
- **PDF Generation**: ReportLab
- **Storage**: Cloudinary (via `django-cloudinary-storage`)
- **CORS**: django-cors-headers

## Prerequisites
- Python 3.10+
- PostgreSQL (if running locally instead of SQLite)

## Installation

1. Navigate to the server directory:
   ```bash
   cd server
   ```
2. Create and activate a virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install the dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Set up environment variables:
   Create a `.env` file in the `server` directory and configure the required settings:
   ```env
   SECRET_KEY=your_django_secret_key
   DEBUG=True
   DATABASE_URL=postgres://user:password@localhost:5432/dbname
   CRON_SECRET=your_cron_secret_key
   CLOUDINARY_URL=cloudinary://...
   ```

## Database Setup

Run the migrations to set up the database schema:
```bash
python manage.py migrate
```

## Running the Server

Start the Django development server:
```bash
python manage.py runserver
```
The API will be available at `http://localhost:8000/`.
