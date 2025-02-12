#!/usr/bin/env bash
pip install -r requirements.txt

cd risk_analyst
mkdir -p staticfiles
python manage.py collectstatic --no-input
cd ..