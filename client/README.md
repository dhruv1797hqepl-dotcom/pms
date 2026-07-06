# HQEPL PMS - Client (Frontend)

This is the frontend application for the HQEPL Project Management System. It is built using modern web technologies to provide a fast and responsive user experience.

## Tech Stack
- **Framework**: React 19 + Vite
- **Routing**: React Router DOM
- **Styling**: Tailwind CSS v4
- **Data Fetching**: Axios
- **Charts & Visualization**: Recharts
- **Icons**: Lucide React
- **Document Generation**: jsPDF, jsPDF-AutoTable
- **Excel Handling**: xlsx
- **Animations**: Framer Motion
- **Emails**: EmailJS

## Installation

1. Navigate to the client directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables:
   Create a `.env` file in the root of the `client` folder and add your backend API URL and other required keys:
   ```env
   VITE_API_BASE_URL=http://localhost:8000
   ```

## Running the Application

To start the development server:
```bash
npm run dev
```
The application will be accessible at `http://localhost:5173`.

## Build for Production
To create an optimized production build:
```bash
npm run build
```
You can preview the production build locally with:
```bash
npm run preview
```
