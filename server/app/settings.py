#
# Copyright (c) 2017 - Bambora Inc. <http://dev.na.bambora.com>
# MIT licensed. Feel free to use and abuse.
#

import os
import base64
import decimal


# Bambora Payment APIs Server base URL. Defaults to 'https://api.na.bambora.com'
base_url = os.environ.get('SERVER_URL_BASE')

if base_url is None:
    base_url = 'https://api.na.bambora.com'

base_sandbox_url = 'https://sandbox-api.na.bambora.com'
base_querystring_url = 'https://web.na.bambora.com'
base_querystring_sandbox_url = 'https://sandbox-web.na.bambora.com'

# Bambora params needed for authentication include Merchant ID & API Passcode.
# --> More info here: https://dev.na.bambora.com/docs/guides/merchant_quickstart/
merchant_id = os.environ.get('MERCHANT_ID')
api_passcode = os.environ.get('API_PASSCODE')
report_api_passcode = os.environ.get('REPORT_API_PASSCODE')

sandbox_merchant_id = os.environ.get('SANDBOX_MERCHANT_ID')
sandbox_api_passcode = os.environ.get('SANDBOX_API_PASSCODE')
sandbox_hash_key = os.environ.get('SANDBOX_HASH_KEY')
sandbox_visa_checkout_api_key = os.environ.get('SANDBOX_VISA_CHECKOUT_API_KEY')


if (merchant_id is None or
    api_passcode is None or
    sandbox_api_passcode is None or
    sandbox_api_passcode is None or
    sandbox_hash_key is None or
    sandbox_visa_checkout_api_key is None):
    print('Setup incomplete. Please set all environment variables and then'
          ' start this app!')
    exit(0)

print('-> API Server: ' + base_url)
print('-> Merchant ID: ' + merchant_id)

# http://stackoverflow.com/questions/1995615/how-can-i-format-a-decimal-to-always-show-2-decimal-places
TWO_PLACES = decimal.Decimal(10) ** -2       # same as Decimal('0.01')


def create_auth_headers() -> dict:
    passcode = merchant_id + ':' + api_passcode
    passcode = base64.b64encode(passcode.encode('utf-8')).decode()
    headers = {
        'Authorization': 'Passcode {}'.format(passcode),
        'Content-Type': 'application/json'
    }
    return headers
