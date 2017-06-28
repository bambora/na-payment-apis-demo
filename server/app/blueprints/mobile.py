#!/usr/bin/env python
#
# MIT License (MIT)
# Copyright (c) 2017 - Bambora Inc. <https://dev.na.bambora.com>
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

import sys
import json
import base64
import logging
import requests

from flask import Blueprint
from flask import request
from flask import jsonify

import settings
from blueprints.mobilepayments import db

# Setup our Mobile Payments Blueprint
payments = Blueprint('mobile-payments', __name__,)

# Create our database access helper instance variable
payments_dao = db.PaymentsDAO()

# Setup a logger
logger = logging.getLogger('Mobile-Payments')
logger.setLevel(logging.WARNING)

ch = logging.StreamHandler(sys.stdout)
ch.setLevel(logging.DEBUG)
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
ch.setFormatter(formatter)
logger.addHandler(ch)


##########################
# ROUTES

@payments.route('/process/<wallet_type>', methods=['POST'])
def process_payment(wallet_type):

    payment_method = None
    if wallet_type == db.WalletType.apple_pay.value:
        payment_method = db.PaymentMethod.apple_pay
    elif wallet_type == db.WalletType.android_pay.value:
        payment_method = db.PaymentMethod.android_pay

    if not (payment_method == db.PaymentMethod.apple_pay or payment_method == db.PaymentMethod.android_pay):
        return error400('Must use an Apple Pay or Android Pay wallet type.')

    logger.debug(request.form)

    amount = request.json.get('amount')
    # name = request.json.get('name')
    transaction_type = request.json.get('transaction-type')
    apple_merchant_id = 'merchant.com.beanstream.apbeanstream'
    android_merchant_id = 'com.bambora.na.mobilepay'
    payment_token = request.json.get('payment-token')

    if transaction_type != "purchase" and transaction_type != "pre-auth":
        transaction_type = None

    # Ensure that POST params were all passed in OK.
    if amount is None \
            or transaction_type is None \
            or (payment_method == db.WalletType.apple_pay and apple_merchant_id is None) \
            or (payment_method == db.WalletType.android_pay and android_merchant_id is None) \
            or payment_token is None:

        return error400('Expected params not found.')

    # Create a new payment record in the local database.
    payment_dict = payments_dao.create_payment(
        payment_amount=amount,
        payment_method=payment_method
    )

    payment_id = payment_dict["id"]
    complete = True

    if transaction_type == 'pre-auth':
        complete = False

    # Call on Payments API to process the payment.
    if wallet_type == db.WalletType.apple_pay.value:
        payload = {
            'amount': float(amount),
            'payment_method': 'apple_pay',
            'apple_pay': {
                'apple_pay_merchant_id': apple_merchant_id,
                'payment_token': payment_token,
                'complete': complete
            }
        }
    elif wallet_type == db.WalletType.android_pay.value:
        payload = {
            'amount': float(amount),
            'payment_method': 'android_pay',
            'android_pay': {
                'android_pay_merchant_id': android_merchant_id,
                'payment_token': payment_token,
                'complete': complete
            }
        }

    print(payload)

    passcode = settings.merchant_id + ':' + settings.api_passcode
    passcode = base64.b64encode(passcode.encode('utf-8')).decode()

    headers = {
        'Authorization': 'Passcode ' + passcode,
        'Content-Type': 'application/json'
    }

    response = requests.post(settings.base_url + '/v1/payments',
                             json=payload,
                             headers=headers)

    if response.status_code == 200:
        response = response.json()
        logger.info(response)

        bic_transaction_id = response.get('id')
        payment_status = db.PaymentStatus.captured

        if transaction_type == "pre-auth":
            payment_status = db.PaymentStatus.authorized

        # Update the payment record to include the Transaction ID
        # and a status to indicate payment was captured or authorized.
        json_response = payments_dao.update_payment(
            payment_id=payment_id,
            payment_status=payment_status,
            bic_transaction_id=bic_transaction_id
        )

        return jsonify(json_response)

    else:
        message = response.text
        logger.warning('Payments API call unsuccessful: ' + response.text)

        payment_status = db.PaymentStatus.error

        try:
            json_dict = json.loads(message)
            message = json_dict.get('message')

            if message == 'Declined':
                payment_status = db.PaymentStatus.declined

        except json.JSONDecodeError:
            pass

        # Update the payment record to include the new payment status
        payments_dao.update_payment(
            payment_id=payment_id,
            payment_status=payment_status
        )

        return error400(message)


@payments.route('/apple-pay-session', methods=['POST'])
def get_apple_pay_session():
    json_params = request.get_json(silent=True)
    apple_pay_url = json_params['url']
    # We need a URL from the client to call
    if not apple_pay_url:
        return error400("No URL param found.")

    # We must provide our Apple Pay certificate, merchant ID, domain name, and display name
    payload = {
        'merchantIdentifier': 'merchant.com.beanstream.apbeanstream',
        'domainName': 'demo.na.bambora.com',
        'displayName': 'Payment APIs Demo',
    }

    # Send the request to the Apple Pay server and return the response to the client
    response = requests.post(apple_pay_url, json=payload)

    if response.status_code == 200:
        return response.text, response.status_code, response.headers.items()
    else:
        print('Error generating Apple Pay session!')
        return response.text, response.status_code, response.headers.items()


# HELPER FUNCTIONS

# Used for custom error handling
def error400(e):

    # logger.warning(e)
    return jsonify(error=400, message=str(e)), 400


def error500(e):

    logger.exception(e)
    error_code = 500
    return jsonify(error=error_code, message=str(e)), error_code
