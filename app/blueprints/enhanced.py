#
# Copyright (c) 2017 - Beanstream Internet Commerce, Inc. <http://beanstream.com>
# MIT licensed. Feel free to use and abuse.
#

import decimal
import requests
import simplejson as json

from flask import Blueprint
from flask import request
from flask import render_template
from flask import current_app as app

# Setup our Enhanced Payment Blueprint
payments = Blueprint('enhanced', __name__,)


@payments.route('/token', methods=['POST'])
def make_token_payment():
    data = json.dumps({
        'amount': decimal.Decimal(request.json.get('amount')).quantize(app.TWO_PLACES),
        'payment_method': 'token',
        'term_url': request.host_url + 'payment/redirect/3d-secure',
        'token': {
            'code': request.json.get('token'),
            'name': request.json.get('name')
        }
    }, use_decimal=True)

    # Note: Sending a 'term_url' param and saving the merchant_data response value is only required
    # for payments when a customer uses a 3D Secure enabled credit card and when your Beanstream
    # merchant account is also configured to enable 3D Secure.

    response = requests.post(app.base_url, headers=app.create_auth_headers(), data=data)
    app.session['3d-secure-id'] = json.loads(response.content.decode("utf-8")).get('merchant_data')
    return response.content.decode("utf-8"), response.status_code


@payments.route('/3d-secure/token', methods=['POST'])
def make_3d_secure_token_payment():
    data = json.dumps({
        'amount': decimal.Decimal(request.json.get('amount')).quantize(app.TWO_PLACES),
        'language': 'en',
        'term_url': request.host_url + 'payment/redirect/3d-secure',
        'comments': '',
        'payment_method': 'token',
        'token': {
            'code': request.json.get('token'),
            'name': request.json.get('name')
        }
    }, use_decimal=True)

    response = requests.post(app.base_url, headers=app.create_auth_headers(), data=data)
    app.session['3d-secure-id'] = json.loads(response.content.decode("utf-8")).get('merchant_data')
    return response.content.decode("utf-8"), response.status_code


@payments.route('/interac', methods=['POST'])
def make_interac_payment():
    data = json.dumps({
        'order_number': request.json.get('order_number'),
        'amount': decimal.Decimal(request.json.get('amount')).quantize(app.TWO_PLACES),
        'payment_method': 'interac'
    }, use_decimal=True)

    response = requests.post(app.base_url, headers=app.create_auth_headers(), data=data)
    app.session['interac-id'] = json.loads(response.content.decode("utf-8")).get('merchant_data')
    return response.content.decode("utf-8"), response.status_code


@payments.route('/interac_callback', methods=['POST'])
def interac_callback():
    if 'interac-id' in app.session:
        url = '{}/{}/continue'.format(app.base_url, app.session['interac-id'])
        app.session.pop('interac-id', None)

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

        response = requests.post(url, headers=app.create_auth_headers(), data=data)
        status = response.status_code
        content = json.loads(response.content.decode("utf-8"))

        if status == 200:
            feedback = {'success': True, 'invoice_id': content.get('order_number'), 'transaction_id': content.get('id')}
        else:
            feedback = {'success': False, 'message': content.get('message')}

        return render_template('interac-response.html', feedback=feedback)

    else:
        feedback = {'success': False, 'message': 'Error. Your session has expired. Please return to the payment page.'}
        return render_template('interac-response.html', feedback=feedback)


@payments.route('/redirect/3d-secure', methods=['POST'])
def three_d_secure_callback():
    if '3d-secure-id' in app.session:
        url = '{}/{}/continue'.format(app.base_url, app.session['3d-secure-id'])
        app.session.pop('3d-secure-id', None)
        data = json.dumps({
            'payment_method': 'credit_card',
            'card_response': {
                'pa_res': request.form.get('PaRes')
            }
        })

        response = requests.post(url, headers=app.create_auth_headers(), data=data)
        status = response.status_code
        content = json.loads(response.content.decode("utf-8"))

        if status == 200:
            feedback = {'success': True, 'invoice_id': content.get('order_number'), 'transaction_id': content.get('id')}
        else:
            feedback = {'success': True, 'invoice_id': status, 'transaction_id': content}

        return render_template('interac-response.html', feedback=feedback)

    else:
        feedback = {'success': False, 'message': 'Error. Your session has expired. Please return to the payment page.'}
        return render_template('interac-response.html', feedback=feedback)
