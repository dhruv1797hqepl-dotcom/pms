#!/usr/bin/env bash
pip install -r requirements.txt

# Build the React frontend so Render always serves the latest compiled code
cd ../client
npm install
npm run build
cd ../server

python manage.py collectstatic --noinput
python manage.py migrate