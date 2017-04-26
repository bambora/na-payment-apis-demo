#
# Copyright (c) 2017 - Beanstream Internet Commerce, Inc. <http://beanstream.com>
# MIT licensed. Feel free to use and abuse.
#

import os
import base64
import decimal


#
# Beanstream params needed for authentication include Merchant ID & API Passcode.
# --> More info here: http://developer.beanstream.com/documentation/authentication/
#
merchant_id = os.environ.get('MERCHANT_ID')
api_passcode = os.environ.get('API_PASSCODE')

if merchant_id is None or api_passcode is None:
    print('Setup incomplete. Please set your MERCHANT_ID'
          ' and API_PASSCODE environment variables and then'
          ' start this app!')
    exit(0)

base_url = 'https://www.beanstream.com/api/v1/payments'

# http://stackoverflow.com/questions/1995615/how-can-i-format-a-decimal-to-always-show-2-decimal-places
TWO_PLACES = decimal.Decimal(10) ** -2       # same as Decimal('0.01')


def create_auth_headers() -> dict:
    passcode = merchant_id + ':' + api_passcode
    passcode = base64.b64encode(passcode.encode('utf-8')).decode()
    headers = {
        'Authorization': 'Passcode ' + passcode,
        'Content-Type': 'application/json'
    }
    return headers
