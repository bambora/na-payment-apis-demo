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


# Setup our Basic Payment Blueprint
payments = Blueprint('checkout', __name__,)


@payments.route('/redirect', methods=['POST'])
def process_order():
    merchant_id = os.environ.get('MERCHANT_ID')
    amount = request.json.get('amount')
    name = urllib.parse.quote_plus(request.json.get('name'))
    postal = urllib.parse.quote_plus(request.json.get('postal'))

    hash_data = 'merchant_id=' + merchant_id + '&trnAmount=' + amount + '&ordName=' + name + '&ordPostalCode=' + postal
    hash_key = '204AA6A5-1BCD-489E-9FEA-C904EBFA'
    hash = hashlib.sha1(str(hash_data + hash_key).encode('utf-8')).hexdigest()

    checkout_url = 'https://web.na.bambora.com/scripts/payment/payment.asp?'+ hash_data + "&hashValue=" + hash

    data = json.dumps({
        'redirect_url': checkout_url
    }, use_decimal=True)

    return data


@payments.route('/response', methods=['GET'])
def response():
    if request.args.get('trnApproved') == '1':
        feedback = {'success': True, 'transaction_id': request.args.get('trnId'),
                    'auth_code': request.args.get('authCode'), 'message_id': request.args.get('messageId'),
                    'message_text': request.args.get('messageText'), 'trans_date': request.args.get('trnDate')}
    else:
        feedback = {'success': False, 'transaction_id': request.args.get('trnId'),
                    'message_id': request.args.get('messageId'), 'message_text': request.args.get('messageText'),
                    'trans_date': request.args.get('trnDate')}

    return render_template('checkout-response.html', feedback=feedback)
