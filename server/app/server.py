#!/usr/bin/env python
#
# Copyright (c) 2017 - Bambora Inc. <http://dev.na.bambora.com>
# MIT licensed. Feel free to use and abuse.
#

import os
import logging
import requests

from flask import Flask
from flask_featureflags import FeatureFlag
from flask import render_template
from flask import jsonify
from flask import request

from werkzeug.exceptions import default_exceptions
from werkzeug.exceptions import HTTPException

from blueprints.basic import payments as basic
from blueprints.checkout import payments as checkout
from blueprints.mobile import payments as mobile
from blueprints.interac import payments as interac
from blueprints.card import payments as card
from blueprints.visa_checkout import payments as visa_checkout
from blueprints.masterpass import payments as masterpass

import settings

# Setup a logger
logger = logging.getLogger('Payment-APIs-Demo')
logger.setLevel(logging.WARNING)

# Set apple global variables
merchant_identifier = "merchant.com.bambora.na.test"
merchant_domain="https://localhost:5000"


# Create a Flask app.
app = Flask(__name__)

# Grab config setup
app.config.from_object('config')

# Set up feature flagging
feature_flags = FeatureFlag(app)

# with open(os.path.join(app.root_path, 'domain.crt')) as f:
#     apple_pay_cert = f.read()

##########################
# ERROR/EXCEPTION HANDLING
#
# --> http://flask.pocoo.org/snippets/83/
# Creates a JSON-oriented Flask app.
#
# All error responses that you don't specifically
# manage yourself will have application/json content
# type, and will contain JSON like this (just an example):
#
# { "message": "405: Method Not Allowed" }

def make_json_error(ex):
    response = jsonify(message=str(ex))
    response.status_code = (ex.code
                            if isinstance(ex, HTTPException)
                            else 500)
    return response

for code in default_exceptions.items():
    app.error_handler_spec[None][code] = make_json_error


@app.errorhandler(Exception)
def error500(e):
    logger.exception(e)
    error_code = 500
    return jsonify(error=error_code, message=str(e)), error_code


#
# Routes
#

@app.route('/version')
def version():
    return '<VERSION>'

@app.route('/')
def get_landing_page():
    visa_checkout_api_key = settings.sandbox_visa_checkout_api_key
    return render_template('index.html', api_key=visa_checkout_api_key)

@app.route('/health')
def health():
    response = {'status': 'OK'}
    return jsonify(response)

@app.route('/<path:path>')
def route(path):
    return render_template(path)

# Start of translation

# Accept a POST to /getApplePaySession
@app.route('/getApplePaySession', methods=["POST"])
def get_apple_pay_session():
        # Must contain apple url from onMerchantValidate event
        url = request.form["url"]
        #merchant ID, domain name, and display name
        body = jsonify(merchantIdentifier=merchant_identifier,
                        displayName='Payments Demo',
                        initiative='web',
                        initiativeContext='dev-demo.na.bambora.com')
        r = requests.post(url, cert=('merchant_id.cer'), data=body)
        return r

app.register_blueprint(basic, url_prefix='/payment/basic')
app.register_blueprint(card, url_prefix='/payment/card')
app.register_blueprint(checkout, url_prefix='/checkout')
app.register_blueprint(mobile, url_prefix='/payment/mobile')
app.register_blueprint(interac, url_prefix='/payment/interac')
app.register_blueprint(visa_checkout, url_prefix='/visa-checkout')
app.register_blueprint(masterpass, url_prefix='/payment/masterpass')

#
# Start the app using the built-in Flask (non-production quality) server
#

# Set the secret key for sessions to work.  Keep this really secret!
app.secret_key = 'A0Zr98j/3yX R~XHH!jmN]LWX/,?RT'

# When doing local dev and serving flask directly, the browser
# needs to use an IP address or name and not 0.0.0.0 or else
# browser side security checks will likely fail.
if __name__ == '__main__':
    # if cert exists, use it for SSL, else just run plain HTTP
    cert_file = os.path.join(app.root_path, 'domain.crt')
    key_file = os.path.join(app.root_path, 'domain.key')
    if os.path.exists(cert_file) and os.path.exists(key_file):
        context = (cert_file, key_file)
        app.run(debug=True, host='0.0.0.0', ssl_context=context)
    else:
        app.run(debug=True, host='0.0.0.0')
