#!/usr/bin/env python
#
# Copyright (c) 2017 - Bambora Inc. <http://developer.na.bambora.com>
# MIT licensed. Feel free to use and abuse.
#

import logging

from flask import Flask
from flask import render_template
from flask import jsonify

from werkzeug.exceptions import default_exceptions
from werkzeug.exceptions import HTTPException

from blueprints.basic import payments as basic
from blueprints.enhanced import payments as enhanced


# Setup a logger
logger = logging.getLogger('Merchant-API-Demo')
logger.setLevel(logging.DEBUG)

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

@app.route('/', defaults={'path': 'index.html'})
@app.route('/<path:path>')
def route(path):
    return render_template(path)


app.register_blueprint(basic, url_prefix='/payment/basic')
app.register_blueprint(enhanced, url_prefix='/payment/enhanced')


#
# Start the app using the built-in Flask (non-production quality) server
#

# Set the secret key for sessions to work.  Keep this really secret!
app.secret_key = 'A0Zr98j/3yX R~XHH!jmN]LWX/,?RT'

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
