# Cron Job Setup Guide

The weekly performance score email is triggered via an API endpoint, rather than a scheduled background task inside the Python code itself. To automate this, you must set up an external Cron Job (for example, on Render.com) that pings this endpoint.

## Endpoint Details
- **Method**: `POST`
- **URL**: `https://<your-backend-url>/api/tasks/send-weekly-score-email/`
- **Headers**: `X-Cron-Secret: <your-cron-secret-here>`

## Steps to configure on Render.com:

1. **Log into the Render Dashboard** and navigate to your workspace.
2. **Create a new Cron Job** (Click `New` -> `Cron Job`).
3. **Environment**: 
   - Set the command to execute a cURL request to your backend:
     ```bash
     curl -X POST https://<your-backend-url>/api/tasks/send-weekly-score-email/ -H "X-Cron-Secret: $CRON_SECRET"
     ```
   - *Note: Replace `<your-backend-url>` with your actual production backend URL.*
4. **Schedule (Every Monday at 9:30 PM)**: 
   - Enter your desired cron expression. 
   - **Important**: Render cron jobs run in **UTC**. 
   - If you want the job to run at 9:30 PM **IST** (which is UTC+5:30), 9:30 PM IST equals 4:00 PM UTC.
   - The cron expression for 4:00 PM UTC on Monday is:
     ```text
     0 16 * * 1
     ```
   - If your platform supports setting the timezone directly, you can use `30 21 * * 1` for 9:30 PM local time.

5. **Add Environment Variables**:
   - Scroll down to the Environment Variables section.
   - **Key**: `CRON_SECRET`
   - **Value**: (Enter the exact same secret key you defined in your Django Web Service environment variables so the backend can verify the request).

6. **Save and Deploy**. 
   - The job will now automatically execute at the scheduled time and trigger the weekly email.
