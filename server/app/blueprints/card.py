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


payments = Blueprint('card', __name__,)


@payments.route('', methods=['POST'])
def make_payment():
    term_url = request.base_url + '/redirect'

    data = json.dumps({
        'amount': decimal.Decimal(request.json.get('amount')).quantize(settings.TWO_PLACES),
        'language': 'en',
        'term_url': term_url,
        'comments': '',
        'payment_method': 'token',
        'token': {
            'code': request.json.get('token'),
            'name': request.json.get('name')
        }
    }, use_decimal=True)

    response = requests.post(settings.base_url + '/v1/payments', headers=settings.create_auth_headers(), data=data)
    session['3d-secure-id'] = json.loads(response.content.decode("utf-8")).get('merchant_data')
    return response.content.decode("utf-8"), response.status_code


@payments.route('/redirect', methods=['POST'])
def redirect():
    if '3d-secure-id' in session:
        url = '{}/{}/continue'.format(settings.base_url + '/v1/payments', session['3d-secure-id'])
        session.pop('3d-secure-id', None)
        data = json.dumps({
            'payment_method': 'credit_card',
            'card_response': {
                'pa_res': request.form.get('PaRes')
            }
        })

        response = requests.post(url, headers=settings.create_auth_headers(), data=data)
        status = response.status_code
        content = json.loads(response.content.decode("utf-8"))

        if status == 200:
            feedback = {'success': True, 'transaction_id': content.get('id'), \
            'cvv': content.get('card').get('cvd_result'), \
            'avs': content.get('card').get('avs').get('id'), \
            'message_id': content.get('message_id') }
        else:
            feedback = {'success': False, 'message': content.get('message')}

        return render_template('redirect-response.html', feedback=feedback)

    else:
        feedback = {'success': False, 'message': 'Error. Your session has expired. Please return to the payment page.'}
        return render_template('redirect-response.html', feedback=feedback)
