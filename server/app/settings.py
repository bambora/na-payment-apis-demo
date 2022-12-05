#
# Copyright (c) 2017 - Bambora Inc. <http://dev.na.bambora.com>
# MIT licensed. Feel free to use and abuse.
#

import os
import base64
import boto3
import decimal

# NOTE: A merchant account on our sandbox env (sandbox-web.na.bambora.com) is only
# required when testing Visa Checkout. All other payment types can be tested on
# web.na.bambora.com / api.na.bambora.com.
# *** Visa Checkout was removed on 2022-12-05 MTL-3515

# Bambora Payment APIs Server base URL. Defaults to 'https://api.na.bambora.com'
base_url = os.environ.get('SERVER_URL_BASE', 'https://api.na.bambora.com')

# Bambora params needed for authentication include Merchant ID & API Passcode.
# --> More info here: https://dev.na.bambora.com/docs/guides/merchant_quickstart/
try:
    # Open a client connection to AWS SSM and get secrets
    ssmclient = boto3.client('ssm')
    merchant_id = ssmclient.get_parameter(Name="paymentapidemo-MERCHANT_ID", WithDecryption=True)['Parameter']['Value']
    api_passcode = ssmclient.get_parameter(Name="paymentapidemo-API_PASSCODE", WithDecryption=True)['Parameter']['Value']
    report_api_passcode = ssmclient.get_parameter(Name="paymentapidemo-REPORT_API_PASSCODE", WithDecryption=True)['Parameter']['Value']
    secret_key = ssmclient.get_parameter(Name="paymentapidemo-SECRET_KEY", WithDecryption=True)['Parameter']['Value']
except Exception as e:
    merchant_id = os.environ.get('MERCHANT_ID')
    api_passcode = os.environ.get('API_PASSCODE')
    report_api_passcode = os.environ.get('REPORT_API_PASSCODE')
    secret_key = os.environ.get('SECRET_KEY')

if (merchant_id is None or
            api_passcode is None):
    print('Setup incomplete. Please set all environment variables and then'
          ' start this app!')
    exit(0)

print('-> API Server: ' + base_url)
print('-> Merchant ID: ' + merchant_id)

# http://stackoverflow.com/questions/1995615/how-can-i-format-a-decimal-to-always-show-2-decimal-places
TWO_PLACES = decimal.Decimal(10) ** -2  # same as Decimal('0.01')


def create_auth_headers() -> dict:
    passcode = merchant_id + ':' + api_passcode
    passcode = base64.b64encode(passcode.encode('utf-8')).decode()
    headers = {
        'Authorization': 'Passcode {}'.format(passcode),
        'Content-Type': 'application/json'
    }
    return headers
