<img src="http://www.beanstream.com/wp-content/uploads/2015/08/Beanstream-logo.png" />

# REST API Payments Demo App

Copyright © 2016 Beanstream Internet Commerce, Inc.

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
'''
python app/app.py
'''

## Build docker image and deploy to AWS
'''
make build
make tag
make push
make deploy
'''

You can view the deployed app at: http://payments-api-demo.us-west-2.elasticbeanstalk.com/.

## Todo:
- Validate inputs
- Populate card fields when the user clicks the table

- 3d secure
 - Fix completion call.
 - Display 3d secure in Lightbox.
 - Ensure 3d secure implementation conforms with code guideline in support.beanstream.com.
