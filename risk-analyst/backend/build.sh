#!/usr/bin/env bash
pip install -r requirements.txt
cd risk_analyst
python3 manage.py collectstatic --no-input