#
# Copyright (c) 2017 - Bambora Inc. <http://dev.na.bambora.com>
# MIT licensed. Feel free to use and abuse.
#

import decimal
import requests
import simplejson as json

from flask import request
from flask import Blueprint

import settings


# Setup our Basic Payment Blueprint
payments = Blueprint('basic', __name__,)


@payments.route('/token', methods=['POST'])
def make_token_payment():
    data = json.dumps({
        'amount': decimal.Decimal(request.json.get('amount')).quantize(settings.TWO_PLACES),
        'payment_method': 'token',
        'token': {
            'code': request.json.get('token'),
            'name': request.json.get('name')
        }
    }, use_decimal=True)

    response = requests.post(settings.base_url + '/v1/payments', headers=settings.create_auth_headers(), data=data)
    return response.content.decode("utf-8"), response.status_code
