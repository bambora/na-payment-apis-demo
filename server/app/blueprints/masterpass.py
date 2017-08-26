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


payments = Blueprint('masterpass', __name__,)


@payments.route('', methods=['POST'])
def get_redirect():
    url = '{}/scripts/process_transaction.asp'.format(settings.base_querystring_sandbox_url)
    merchant_id = settings.sandbox_merchant_id
    payment_api_passcode = settings.sandbox_api_passcode

    term_url = request.base_url + '/callback'

    querystring = {
        'requestType':'BACKEND',
        'paymentMethod':'MP',
        'merchant_id': merchant_id,
        'passcode': payment_api_passcode,
        'termUrl': term_url,
        'includeShipping':'1'
    }

    response = requests.request('POST', url, params=querystring)
    query_string = response.text
    params = urlparse.parse_qs(query_string)
    status = 400

    if bool(params['pageContents'][0]):
        feedback = {
            'success': True,
            'html': params['pageContents'][0]
        }
        status = 302
    else:
        feedback = {'success': False,
                    'message': (params['messageId'][0] + ': ' + params['messageText'][0])}

    return json.dumps(feedback), status


@payments.route('/callback', methods=['GET'])
def callback():
    url = '{}/scripts/process_transaction.asp'.format(settings.base_querystring_sandbox_url)
    merchant_id = settings.sandbox_merchant_id
    payment_api_passcode = settings.sandbox_api_passcode

    if request.args.get('mpstatus') == 'success':
        querystring = {
            'requestType':'BACKEND',
            'merchant_id': merchant_id,
            'passcode': payment_api_passcode,
            'oauth_token': request.args.get('oauth_token'),
            'oauth_verifier': request.args.get('oauth_verifier'),
            'checkout_resource_url':request.args.get('checkout_resource_url'),
            'trnAmount':'10.00',
            'vbvEnabled':'0',
            'scEnabled':'0',
            'sKeyEnabled':'0',
        }

        response = requests.request('POST', url, params=querystring)
        query_string = response.text
        params = urlparse.parse_qs(query_string)

        if bool(params['trnApproved'][0]):
            feedback = {
                'success': bool(params['trnApproved'][0]),
                'transaction_id': params['trnId'][0],
                'message_id': params['messageId'][0],
                'avs': params['avsId'][0],
                'cvv': params['cvdId'][0],
            }

        else:
            feedback = {'success': False,
                        'message': (params['messageId'][0] + ': ' + params['messageText'][0])}

    else:
        feedback = {'success': False,
                    'message': (request.args.get('mpstatus'))}

    return render_template('redirect-response.html', feedback=feedback)
