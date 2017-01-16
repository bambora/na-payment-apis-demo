from flask import Flask, render_template, request
from flask import jsonify, session
import requests
import json
import urllib
import re

app = Flask(__name__)

@app.route('/')
def home():
  return render_template('index.html')

@app.route('/make_token_payment', methods=['POST'])
def make_token_payment():
    url = 'https://www.beanstream.com/api/v1/payments'
    headers = {'Authorization': 'Passcode MzAwMjAyNzc5OkZENUQyYkIyMUQxOTQ1MTQ4RmJhRDJFYzAzNkY0ZmE2', 'Content-Type': 'application/json'}
    data = json.dumps({
        'order_number': request.json['order_number'],
        'amount': int(request.json['amount']),
        'payment_method': 'token',
        'token': {
            'code':request.json['token'],
            'name':request.json['name']
        }
    })

    response = requests.post(url, headers=headers, data=data)
    return response.content.decode("utf-8"), response.status_code

@app.route('/make_interac_payment', methods=['POST'])
def make_interac_payment():
    print('make_interac_payment')
    url = 'https://www.beanstream.com/api/v1/payments'
    headers = {'Authorization': 'Passcode MzAwMjAzOTQwOjY5Mjg1YzE1MkY2YzQyNGE5ODBlQUM5ZDQ4ODNjNDYx', 'Content-Type': 'application/json'}
    data = json.dumps({
        'order_number': request.json['order_number'],
        'amount': int(request.json['amount']),
        'payment_method': 'interac'
    })

    response = requests.post(url, headers=headers, data=data)
    session['interac_id'] = json.loads(response.content.decode("utf-8"))['merchant_data']
    return response.content.decode("utf-8"), response.status_code

@app.route('/interac_callback', methods=['GET'])
def interac_callback():
  # http://developer.beanstream.com/documentation/take-payments/purchases/interac-purchases/

  if 'interac_id' in session and request.args.get('funded') is not None:
      url = 'https://www.beanstream.com/api/v1/payments/{0}/continue'.format(session['interac_id'])
      session.pop('interac_id', None)

      headers = {'Authorization': 'Passcode MzAwMjAyNzc5OkZENUQyYkIyMUQxOTQ1MTQ4RmJhRDJFYzAzNkY0ZmE2', 'Content-Type': 'application/json'}
      data = json.dumps({
          'payment_method': 'interac',
          'interac_response': {
              'funded':request.args.get('funded'),
              'idebit_track2':request.args.get('idebit_track2' or ''),
              'idebit_isslang':request.args.get('idebit_isslang' or ''),
              'idebit_version':request.args.get('idebit_version' or ''),
              'idebit_issconf':request.args.get('idebit_issconf' or ''),
              'idebit_issname':request.args.get('idebit_issname' or ''),
              'idebit_amount':request.args.get('idebit_amount' or ''),
              'idebit_invoice':request.args.get('idebit_invoice' or ''),
          }
      })

      # this is broken. the callback is called with only the 'funded' peram

      # QUESTION: Is there a test card and password for the simulator
      # QUESTION: Does teh simulator usually return more than the 'funded' peram
      # QUESTION: If the simulator only returns he 'funded' peram, how do you complete the payment

      response = requests.post(url, headers=headers, data=data)
      status = response.status_code
      #content = response.decode("utf-8")
      content = response

      '''
      if status == 200:
          feedback = {'success': True, 'invoice_id': content['order_number'], 'transaction_id': content['id']}
      else:
          feedback = {'success': False, 'message': content['message']}

      return render_template('interac_response.html', feedback=feedback)
      '''

      feedback = {'content': content, 'status': status}
      return render_template('interac_response_test.html', feedback=feedback)
  else:
      feedback = {'success': False, 'message': 'Error. Your session has expired. Please return to the payment page.'}
      return render_template('interac_response.html', feedback=feedback)

# set the secret key.  keep this really secret:
app.secret_key = 'A0Zr98j/3yX R~XHH!jmN]LWX/,?RT'

if __name__ == '__main__':
  app.run(debug=True, host='0.0.0.0')
