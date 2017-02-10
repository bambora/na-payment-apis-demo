#!/usr/bin/env python
#
# Copyright (c) 2017 - Beanstream Internet Commerce, Inc. <http://beanstream.com>
# MIT licensed. Feel free to use and abuse.
#

from flask import Flask
from flask import render_template
from flask import request
from flask import session

import requests
import base64
import json
import os


#
# Beanstream params needed for authentication include Merchant ID & API Passcode.
# --> More info here: http://developer.beanstream.com/documentation/authentication/
#
merchant_id = os.environ.get('MERCHANT_ID')
api_passcode = os.environ.get('API_PASSCODE')

if merchant_id is None or api_passcode is None:
    print('Setup incomplete. Please set your MERCHANT_ID'
          ' and API_PASSCODE environment variables and then'
          ' start this app!')
    exit(0)

base_url = 'https://www.beanstream.com/api/v1/payments'

# Create a Flask app.
app = Flask(__name__)


#
# Util functions
#

def create_auth_headers() -> dict:
    passcode = merchant_id + ':' + api_passcode
    passcode = base64.b64encode(passcode.encode('utf-8')).decode()

    headers = {
        'Authorization': 'Passcode ' + passcode,
        'Content-Type': 'application/json'
    }

    return headers


#
# Routes
#

@app.route('/')
def home():
    return render_template('index.html')


@app.route('/payment/token', methods=['POST'])
def make_token_payment():
    data = json.dumps({
        'amount': int(request.json.get('amount')),
        'payment_method': 'token',
        'token': {
            'code': request.json.get('token'),
            'name': request.json.get('name')
        }
    })
    response = requests.post(base_url, headers=create_auth_headers(), data=data)
    return response.content.decode("utf-8"), response.status_code


@app.route('/payment/3d-secure/token', methods=['POST'])
def make_3d_secure_token_payment():
    data = json.dumps({
        'amount': int(request.json.get('amount')),
        'language': 'en',
        'term_url': 'http://payments-api-demo.us-west-2.elasticbeanstalk.com/redirect/3d-secure',
        'comments': '',
        'payment_method': 'token',
        'token': {
            'code': request.json.get('token'),
            'name': request.json.get('name')
        }
    })

    response = requests.post(base_url, headers=create_auth_headers(), data=data)
    session['3d-secure-id'] = json.loads(response.content.decode("utf-8")).get('merchant_data')
    return response.content.decode("utf-8"), response.status_code


@app.route('/payment/interac', methods=['POST'])
def make_interac_payment():
    data = json.dumps({
        'order_number': request.json.get('order_number'),
        'amount': int(request.json.get('amount')),
        'payment_method': 'interac'
    })

    response = requests.post(base_url, headers=create_auth_headers(), data=data)
    session['interac-id'] = json.loads(response.content.decode("utf-8")).get('merchant_data')
    return response.content.decode("utf-8"), response.status_code


# @app.route('/redirect/interac', methods=['POST'])
@app.route('/interac_callback', methods=['POST'])
def interac_callback():
    if 'interac-id' in session:
        url = '{}/{}/continue'.format(base_url, session['interac-id'])
        session.pop('interac-id', None)

        data = json.dumps({
            'payment_method': 'interac',
            'interac_response': {
                'funded': request.args.get('funded'),
                'idebit_track2': request.form.get('IDEBIT_TRACK2'),
                'idebit_isslang': request.form.get('IDEBIT_ISSLANG'),
                'idebit_version': request.form.get('IDEBIT_VERSION'),
                'idebit_issconf': request.form.get('IDEBIT_ISSCONF'),
                'idebit_issname': request.form.get('IDEBIT_ISSNAME'),
                'idebit_amount': request.form.get('IDEBIT_AMOUNT'),
                'idebit_invoice': request.form.get('IDEBIT_INVOICE'),
            }
        })

        response = requests.post(url, headers=create_auth_headers(), data=data)
        status = response.status_code
        content = json.loads(response.content.decode("utf-8"))

        if status == 200:
            feedback = {'success': True, 'invoice_id': content.get('order_number'), 'transaction_id': content.get('id')}
        else:
            feedback = {'success': False, 'message': content.get('message')}

        return render_template('interac-response.html', feedback=feedback)

    else:
        feedback = {'success': False, 'message': 'Error. Your session has expired. Please return to the payment page.'}
        return render_template('interac-response.html', feedback=feedback)


@app.route('/redirect/3d-secure', methods=['POST'])
def three_d_secure_callback():
    if '3d-secure-id' in session:
        url = '{}/{}/continue'.format(base_url, session['3d-secure-id'])
        session.pop('3d-secure-id', None)
        data = json.dumps({
            'payment_method': 'credit_card',
            'card_response': {
                'pa_res': request.form.get('pa_res')
            }
        })

        response = requests.post(url, headers=create_auth_headers(), data=data)
        status = response.status_code
        content = json.loads(response.content.decode("utf-8"))

        if status == 200:
            feedback = {'success': True, 'invoice_id': content.get('order_number'), 'transaction_id': content.get('id')}
        else:
            feedback = {'success': True, 'invoice_id': status, 'transaction_id': content}

        return render_template('interac-response.html', feedback=feedback)

    else:
        feedback = {'success': False, 'message': 'Error. Your session has expired. Please return to the payment page.'}
        return render_template('interac-response.html', feedback=feedback)


#
# Start the app using the built-in Flask (non-production quality) server
#

# Set the secret key for sessions to work.  Keep this really secret!
app.secret_key = 'A0Zr98j/3yX R~XHH!jmN]LWX/,?RT'

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
