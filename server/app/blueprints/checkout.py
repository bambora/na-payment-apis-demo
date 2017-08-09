#
# Copyright (c) 2017 - Bambora Inc. <http://dev.na.bambora.com>
# MIT licensed. Feel free to use and abuse.
#

import hashlib
import urllib.parse
import os
import simplejson as json

from flask import Blueprint
from flask import render_template
from flask import request


payments = Blueprint('checkout', __name__,)


@payments.route('', methods=['GET'])
def checkout():
    return render_template('checkout.html')


@payments.route('/redirect', methods=['POST'])
def process_order():
    merchant_id = os.environ.get('MERCHANT_ID')
    #hash_key = os.environ.get('HASH_KEY')
    hash_key = '46E664B4-396C-423D-90E6-430DCB06'
    amount = request.json.get('amount')
    name = urllib.parse.quote_plus(request.json.get('name'))
    postal = urllib.parse.quote_plus(request.json.get('postal'))
    term_url = request.base_url.replace('redirect','response')

    hash_data = ('merchant_id=' + merchant_id + '&trnAmount=' + amount +
                '&ordName=' + name + '&ordPostalCode=' + postal +
                '&ordProvince=BC&ordCountry=CA' +
                '&approvedPage=' + term_url + '&declinedPage=' + term_url)

    hash = hashlib.sha1(str(hash_data + hash_key).encode('utf-8')).hexdigest()

    checkout_url = 'https://web.na.bambora.com/scripts/payment/payment.asp?'+ hash_data + "&hashValue=" + hash

    data = json.dumps({
        'redirect_url': checkout_url
    }, use_decimal=True)

    return data


@payments.route('/response', methods=['GET'])
def response():
    args = request.args
    if bool(args.get('messageId')):
        feedback = {
            'success': bool(args.get('messageId')),
            'transaction_id': args.get('trnId'),
            'message_id': args.get('messageId'),
            'avs': args.get('avsId'),
            'cvv': args.get('cvdId'),
        }

    else:
        feedback = {'success': False,
                    'message': args.get('messageId') + ': '+ args.get('messageText')}

    return render_template('redirect-response.html', feedback=feedback)
