#
# Copyright (c) 2017 - Bambora Inc. <http://dev.na.bambora.com>
# MIT licensed. Feel free to use and abuse.
#

import decimal
import requests
import simplejson as json

from flask import Blueprint
from flask import render_template
from flask import request
from flask import session

import settings


payments = Blueprint('interac', __name__,)


INTERAC_BASE_URL = 'https://yo-api.na.bambora.com'


@payments.route('', methods=['POST'])
def make_interac_payment():
    data = json.dumps({
        'amount': decimal.Decimal(request.json.get('amount')).quantize(settings.TWO_PLACES),
        'payment_method': 'interac'
    }, use_decimal=True)

    response = requests.post(
        INTERAC_BASE_URL + '/v1/payments', 
        headers=settings.create_auth_headers(), data=data)
    session['interac-id'] = json.loads(response.content.decode("utf-8")).get('merchant_data')
    return response.content.decode("utf-8"), response.status_code


@payments.route('/callback', methods=['POST'])
def interac_callback():
    if 'interac-id' in session:
        url = '{}/{}/continue'.format(
            INTERAC_BASE_URL + '/v1/payments', 
            session['interac-id'])
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

        response = requests.post(url, headers=settings.create_auth_headers(), data=data)
        status = response.status_code
        content = json.loads(response.content.decode("utf-8"))

        if status == 200:
            feedback = {
                'success': True,
                'transaction_id': content.get('id'),
                'message_id': content.get('message_id'),
                'avs': '',
                'cvv': '',
            }
        else:
            feedback = {'success': False, 'message': content.get('message')}

    else:
        feedback = {'success': False, 'message': 'Error. Your session has expired. Please return to the payment page.'}

    return render_template('redirect-response.html', feedback=feedback)
