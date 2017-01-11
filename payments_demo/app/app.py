from flask import Flask, request, abort, make_response
from flask import jsonify
import json

from werkzeug.exceptions import default_exceptions
from werkzeug.exceptions import HTTPException

import os

# http://flask.pocoo.org/docs/0.12/quickstart/

'''
Creates a JSON-oriented Flask app.
Source: http://flask.pocoo.org/snippets/83/
'''
def make_json_app(import_name, **kwargs):
    def make_json_error(ex):
        response = jsonify(message=str(ex))
        response.status_code = (ex.code
                                if isinstance(ex, HTTPException)
                                else 500)
        return response

    app = Flask(import_name, **kwargs)

    for code in default_exceptions.items():
        app.error_handler_spec[None][code] = make_json_error

    return app

app = make_json_app(__name__)

@app.errorhandler(Exception)
def error500(e):
    print('there was a 500 error')
    return jsonify(error=500, message=str(e)), 500

@app.errorhandler(400)
def error400(e):
    print('there was a 400 error')
    return jsonify(error=400, message=str(e)), 400

# ROUTES
@app.route('/', methods=['GET'])
@app.route('/hello', methods=['GET'])
def hello():
    response = {'welcome': 'Welcome to the Beanstream Payments API demo microservice'}
    return jsonify(response)

@app.route('/interac_redirect', methods=['GET'])
def interac_response():
    response = {'interac_redirect': 'interac_redirect',
                'args': request.args}
    return jsonify(response)

@app.route('/3d_secure_redirect', methods=['GET'])
def three_secure_response():
    response = {'3d_secure_redirect': '3d_secure_redirect',
                'args': request.args}
    return jsonify(response)

# Start server
if __name__ == '__main__':
    app.run(debug=True)
