#!/usr/bin/env python
#
# MIT License (MIT)
# Copyright (c) 2017 - Bambora Inc. <https://developer.na.bambora.com>
#
# Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
# documentation files (the "Software"), to deal in the Software without restriction, including without limitation
# the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
# to permit persons to whom the Software is furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in all copies or substantial portions of
# the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
# THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
# TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
# SOFTWARE.
#

import os
import sys
import json
import base64
import logging
import requests
import newrelic.agent
from flask import Flask
from flask import request
from flask import jsonify
from werkzeug.exceptions import default_exceptions
from werkzeug.exceptions import HTTPException
from db import payments

# Bambora Merchant API Server base URL. Defaults to 'https://api.na.bambora.com'
bic_server_url_base = os.environ.get('BIC_SERVER_URL_BASE')

if bic_server_url_base is None:
    bic_server_url_base = 'https://api.na.bambora.com'

# Params needed for authentication include Merchant ID & API Passcode.
# --> More info here: https://developer.na.bambora.com/docs/references/merchant_API/
bic_merchant_id = os.environ.get('BIC_MERCHANT_ID')
bic_api_passcode = os.environ.get('BIC_API_PASSCODE')

if bic_merchant_id is None or bic_api_passcode is None:
    print("FATAL: Required Server Params Missing!!!")

# If New Relic support is needed use the following environment variables.
# Environment should be one of
# --> development | test | staging | production

environment = os.environ.get('NEW_RELIC_ENVIRONMENT')
new_relic_license = os.environ.get('NEW_RELIC_LICENSE_KEY')

if environment is None or new_relic_license is None:
    print("New Relic Monitoring not enabled!")
else:
    newrelic.agent.initialize('config/newrelic.ini')

# Create the Server app
app = Flask(__name__)

# Setup a logger
logger = logging.getLogger('ApplePay-Demo')
logger.setLevel(logging.DEBUG)

ch = logging.StreamHandler(sys.stdout)
ch.setLevel(logging.DEBUG)
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
ch.setFormatter(formatter)
logger.addHandler(ch)

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

    logger.exception(ex)
    response = jsonify(message=str(ex))
    response.status_code = (ex.code
                            if isinstance(ex, HTTPException)
                            else 500)
    return response


for code in default_exceptions.items():
        app.error_handler_spec[None][code] = make_json_error


##########################
# ROUTES

@app.route('/version')
def version():
    return '1.0.2'


@app.route('/process-payment/<wallet_type>', methods=['POST'])
def process_payment(wallet_type):
    if wallet_type != 'apple-pay':
        return error400('Must use an Apple Pay wallet type.')

    if bic_merchant_id is None or bic_api_passcode is None:
        return error400('Required Server Params Missing.')

    logger.debug(request.form)

    amount = request.form.get('amount')
    transaction_type = request.form.get('transaction-type')
    ap_merchant_id = request.form.get('apple-wallet[apple-pay-merchant-id]')
    ap_token = request.form.get('apple-wallet[payment-token]')

    if transaction_type != "purchase" and transaction_type != "pre-auth":
        transaction_type = None

    # Ensure that POST params were all passed in OK.
    if amount is None \
            or transaction_type is None \
            or ap_merchant_id is None \
            or ap_token is None:

        return error400('Expected params not found.')

    # Create a new payment record in the local database.
    payment_dict = payments_dao.create_payment(
        payment_amount=amount,
        payment_method=payments.PaymentMethod.apple_pay
    )

    payment_id = payment_dict["id"]
    complete = True

    if transaction_type == 'pre-auth':
        complete = False

    # Call on Merchant API to process the payment.
    payload = {
        'amount': float(amount),
        'payment_method': 'apple_pay',
        'apple_pay': {
            'apple_pay_merchant_id': ap_merchant_id,
            'payment_token': ap_token,
            'complete': complete
        }
    }

    print(payload)

    passcode = bic_merchant_id + ':' + bic_api_passcode
    passcode = base64.b64encode(passcode.encode('utf-8')).decode()

    headers = {
        'Authorization': 'Passcode ' + passcode,
        'Content-Type': 'application/json'
    }

    response = requests.post(bic_server_url_base + '/v1/payments',
                             json=payload,
                             headers=headers)

    json_response = {'success': False}

    if response.status_code == 200:
        response = response.json()
        logger.info(response)

        bic_transaction_id = response.get('id')
        payment_status = payments.PaymentStatus.captured

        if transaction_type == "pre-auth":
            payment_status = payments.PaymentStatus.authorized

        # Update the payment record to include the Transaction ID
        # and a status to indicate payment was captured or authorized.
        json_response = payments_dao.update_payment(
            payment_id=payment_id,
            payment_status=payment_status,
            bic_transaction_id = bic_transaction_id
        )
    else:
        message = response.text
        logger.warn('Payments API call unsuccessful: ' + response.text)

        payment_status = payments.PaymentStatus.error

        try:
            json_dict = json.loads(message)
            message = json_dict.get('message')

            if message == 'Declined':
                payment_status = payments.PaymentStatus.declined

        except json.JSONDecodeError:
            pass

        # Update the payment record to include the new payment status
        payments_dao.update_payment(
            payment_id=payment_id,
            payment_status=payment_status
        )

        return error400(message)

    return jsonify(json_response)


# HELPER FUNCTIONS

# Used for custom error handling
@app.errorhandler(400)
def error400(e):

    logger.warning(e)
    return jsonify(error=400, message=str(e)), 400


@app.errorhandler(Exception)
def error500(e):

    logger.exception(e)
    error_code = 500
    return jsonify(error=error_code, message=str(e)), error_code

# START SERVER

payments_dao = payments.PaymentsDAO()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
