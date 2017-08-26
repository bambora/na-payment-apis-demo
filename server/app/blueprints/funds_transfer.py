#
# Copyright (c) 2017 - Bambora Inc. <http://dev.na.bambora.com>
# MIT licensed. Feel free to use and abuse.
#

import decimal
import requests
import simplejson as json
import time

from flask import request
from flask import Blueprint

import settings


payments = Blueprint('funds-transfer', __name__,)


@payments.route('', methods=['POST'])
def process_order():

    # note: 2 API calls to confirm transaction success
    # first, submit batch file containing transaction
    # second, get report to varify status of transaction

    success = 'false'
    batch_id = ''
    trans_id = ''

    amount = int(float(request.json.get('amount')) * 100) # convert dollars to cents
    name = request.json.get('name')
    accountNumber = request.json.get('accountNumber')
    institutionNumber = request.json.get('institutionNumber')
    transitNumber = request.json.get('transitNumber')
    referenceNumber = 0

    transaction = 'E,D,{},{},{},{},{},{}'.format(
        institutionNumber, transitNumber, accountNumber, amount, referenceNumber,
        name)
    transactionX = 'E,D,001,99001,09400313371,10000,1000070001,General Motors'
    batch_response = submitBatch(transaction)

    if batch_response['success']:
        batch_id = batch_response['batch_id']

        # make 3 attempts to varify success of batch upload
        attempt = 3
        report_response = getReport(batch_id, attempt)
        success = report_response['success']
        trans_id = report_response['trans_id']
        batch_id = report_response['batch_id']
    else:
        print('FAIL: edge case. batch request returned http status !200 or message !1')
        print(batch_response)

    data = json.dumps({
        'success': success,
        'batch_id': batch_id,
        'trans_id': trans_id
    }, use_decimal=True)

    return data


def submitBatch(transaction):
    url = '{}/v1/batchpayments'.format(settings.base_url)

    payload = ('--CHEESE\r\n'
                'Content-Disposition:form-data;name=\"criteria\"\r\n'
                'Content-Type:application/json\r\n\r\n{\"process_now\":1}\r\n'
                '--CHEESE\r\n'
                'Content-Disposition: form-data; name=\"testdata\"; filename=\"testdata.csv\"\r\n'
                'Content-Type: text/plain\r\n\r\n'
                +transaction+'\r\n'
                '--CHEESE--\r\n')

    headers = {
        'content-type': "multipart/form-data; boundary=CHEESE",
        'authorization': settings.get_batch_paymemt_auth_header_value(),
        'filetype': "STD"
        }

    response = requests.request("POST", url, data=payload, headers=headers)
    content = json.loads(response.content.decode("utf-8"))
    code = content.get('code')
    data = {}
    data['success'] = response.status_code == 200 and code == 1
    data['batch_id'] = content.get('batch_id')

    return data

def getReport(batch_id, attempt):
    success = 'false'
    trans_id = ''

    url = '{}/scripts/reporting/report.aspx'.format(settings.base_querystring_url)
    merchant_id = settings.merchant_id
    report_api_passcode = settings.report_api_passcode

    payload = ('<?xml version=\'1.0\' encoding=\'utf-8\'?>\r\n'
                '<request>\r\n<rptVersion>2.0</rptVersion>\r\n'
                '<serviceName>BatchPaymentsEFT</serviceName>\r\n'
                '<merchantId>{}</merchantId>\r\n'
                '<passCode>{}</passCode>\r\n'
                '<rptFormat>JSON</rptFormat>\r\n'
                '<rptFilterBy1>batch_id</rptFilterBy1>\r\n'
                '<rptOperationType1>EQ</rptOperationType1>\r\n'
                '<rptFilterValue1>{}</rptFilterValue1>\r\n</request>').format(merchant_id, report_api_passcode, batch_id)

    headers = {
        'content-type': "application/xml"
        }

    response = requests.request("POST", url, data=payload, headers=headers)
    status = response.status_code
    content = json.loads(response.content.decode("utf-8")).get('response')
    code = content.get('code')

    if status == 200 and code == 1:
        # report was created
        # note: this does not mean that the report is populated

        records = content.get('records')
        if len(records) and content.get('records')['total']:
            record_count = content.get('records')['total']

            # there is 1 line item on report for our 1 line item in batch
            record_status = content.get('record')[0]['statusId']
            if record_status == 1:
                # line item format in batch file was validated and accepted
                # return success
                success = 'true'
                trans_id = content.get('record')[0]['transId']

                # the batch_id on transaction will differ from the batch_id on the file if
                # if the transaction is deemed to be a duplicate
                batch_id = content.get('record')[0]['batchId']
            else:
                print('FAIL: line item format in batch file was validated and rejected.')
                batch_id = 0
                # line item format in batch file was validated and rejected
                # return fail

        else:
            # cause: batch has not been parsed yet
            # solution: pause and try again
            # todo: impliment try again
            # return fail

            # wait for 1 second
            if attempt > 0:
                print('FAIL: edge case. empty report returned. Trying again.')
                attempt -= 1
                time.sleep(1)
                report_response = getReport(batch_id, attempt)
                success = report_response['success']
                trans_id = report_response['trans_id']
                batch_id = report_response['batch_id']
            else:
                print('FAIL: edge case. empty report returned.')

    else:
        # report on batch was not received
        # edge case. unable to varify status of transaction in batch. return fail.
        print('FAIL: edge case. report http status !200')

    data = {}
    data['success'] = success
    data['trans_id'] = trans_id
    data['batch_id'] = batch_id
    return data
