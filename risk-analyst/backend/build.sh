#!/usr/bin/env bash
pip install -r requirements.txt
pip install whitenoise

cd risk_analyst
mkdir -p staticfiles
python manage.py collectstatic --no-input
cd ..