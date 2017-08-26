#
# Copyright (c) 2017 - Bambora Inc. <http://dev.na.bambora.com>
# MIT licensed. Feel free to use and abuse.
#

import hashlib
import urllib.parse
import simplejson as json

from flask import Blueprint
from flask import render_template
from flask import request

import settings

payments = Blueprint('checkout', __name__,)


@payments.route('', methods=['GET'])
def checkout():
    return render_template('checkout.html')


@payments.route('/redirect', methods=['POST'])
def process_order():
    merchant_id = settings.sandbox_merchant_id
    hash_key = settings.sandbox_hash_key

    amount = request.json.get('amount')
    name = urllib.parse.quote_plus(request.json.get('name'))
    postal = urllib.parse.quote_plus(request.json.get('postal'))
    term_url = request.base_url.replace('redirect','callback')

    hash_data = ('merchant_id=' + merchant_id + '&trnAmount=' + amount +
                '&ordName=' + name + '&ordPostalCode=' + postal +
                '&ordProvince=BC&ordCountry=CA' +
                '&approvedPage=' + term_url + '&declinedPage=' + term_url)

    hash = hashlib.sha1(str(hash_data + hash_key).encode('utf-8')).hexdigest()

    checkout_url = '{}/scripts/payment/payment.asp?{}&hashValue={}'.format(settings.base_querystring_sandbox_url, hash_data, hash)

    data = json.dumps({
        'redirect_url': checkout_url
    }, use_decimal=True)

    return data


@payments.route('/callback', methods=['GET'])
def handle_callback():
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
