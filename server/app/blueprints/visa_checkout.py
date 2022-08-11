#
# Copyright (c) 2017 - Bambora Inc. <http://dev.na.bambora.com>
# MIT licensed. Feel free to use and abuse.
#

import decimal
import requests
import simplejson as json
import urllib.parse as urlparse

from flask import Blueprint
from flask import render_template
from flask import request
from flask import session

import settings


payments = Blueprint('visa-checkout', __name__,)


@payments.route('/capture', methods=['POST'])
def make_payment():

    url = '{}/scripts/process_transaction.asp'.format(settings.base_querystring_sandbox_url)
    merchant_id = settings.sandbox_merchant_id
    payment_api_passcode = settings.sandbox_api_passcode

    querystring = {
        'requestType':'STS',
        'merchant_id': merchant_id,
        'api_passcode': payment_api_passcode,
        'trnAmount': decimal.Decimal(request.json.get('amount')).quantize(settings.TWO_PLACES),
        'visaCheckoutCallID': request.json.get('callId'),
        'ordProvince': 'BC',
        'shipProvince': 'BC'
    }

    response = requests.request('POST', url, params=querystring)

    query_string = response.text
    params = urlparse.parse_qs(query_string)

    if bool(params['trnStatus'][0]):
        try:
            feedback = {
                'success': True,
                'id': params['trnId'][0],
                'bank': params['rspId'][0],
                'avs': params['avsId'][0],
                'cvv': params['cvdId'][0],
            }
        except:
            feedback = {
                'success': False,
                'id': params['trnId'][0],
                'bank': params['rspId'][0],
                'avs': params['avsId'][0],
                'message': (params['rspId'][0] + ': ' + params['rspMessage'][0])
            }
    else:
        feedback = {'success': False,
                    'message': (args.get('rspId') + ': ' + params['rspMessage'][0])}

    return json.dumps(feedback), response.status_code
