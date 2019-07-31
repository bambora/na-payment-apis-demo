#!/usr/bin/env python
#
# Copyright (c) 2017 - Bambora Inc. <http://dev.na.bambora.com>
# MIT licensed. Feel free to use and abuse.
#

import os
import logging

from flask import Flask
from flask import render_template
from flask import jsonify

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

# Create a Flask app.
app = Flask(__name__)

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
