# Project setup
## Requirements
- Virtualenv

## Server app (Python - Flask)
```
cd app
virtualenv -p python3 venv
source venv/bin/activate
pip3 install -r requirements.txt
```

## Run flask app
```
cd scripts
sh run.sh
# Runs on http://127.0.0.1:5000/
```
