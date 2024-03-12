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

from blueprints.basic import payments as basic
from blueprints.checkout import payments as checkout
from blueprints.card import payments as card
from blueprints.masterpass import payments as masterpass

import settings

# Setup a logger
logger = logging.getLogger('Payment-APIs-Demo')
logger.setLevel(logging.WARNING)

# Create a Flask app.
app = Flask(__name__)

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
    return render_template('index.html')

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
app.register_blueprint(masterpass, url_prefix='/payment/masterpass')

#
# Start the app using the built-in Flask (non-production quality) server
#

# Set the secret key for sessions to work.  Keep this really secret!
app.secret_key = settings.secret_key

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
