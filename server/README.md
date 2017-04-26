<img src="http://www.beanstream.com/wp-content/uploads/2015/08/Beanstream-logo.png" />

# Payments REST API Demo App

Copyright © 2017 Beanstream Internet Commerce, Inc.

A simple Python/Flask based app to demonstrate how to use the Beanstream REST v1 APIs.

## Running the Python app locally

### Install dependencies in virtualenv
```
cd rest-api-demo
virtualenv -p python3 venv
source venv/bin/activate
pip3 install -r requirements.txt
```

### Run the app
```
python app/app.py
```

## Build docker image and deploy to AWS
```
make build
make tag
make push
make deploy
```

You can view the deployed app at: http://payments-api-demo.us-west-2.elasticbeanstalk.com/.

## Todo:
- Validate inputs
- 3d secure
 - Display 3d secure in Lightbox.
