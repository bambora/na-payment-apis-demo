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

@app.route('/payment/token', methods=['POST'])
def make_token_payment():
    url = 'https://www.beanstream.com/api/v1/payments'
    headers = {'Authorization': 'Passcode MzAwMjAyNzc5OkZENUQyYkIyMUQxOTQ1MTQ4RmJhRDJFYzAzNkY0ZmE2', 'Content-Type': 'application/json'}
    data = json.dumps({
        'order_number': request.json.get('order_number'),
        'amount': int(request.json.get('amount')),
        'payment_method': 'token',
        'token': {
            'code':request.json.get('token'),
            'name':request.json.get('name')
        }
    })

    response = requests.post(url, headers=headers, data=data)
    return response.content.decode("utf-8"), response.status_code

@app.route('/payment/3d_secure/token', methods=['POST'])
def make_3dsecure_token_payment():
    url = 'https://www.beanstream.com/api/v1/payments'
    headers = {'Authorization': 'Passcode MzAwMjAzOTQwOjY5Mjg1YzE1MkY2YzQyNGE5ODBlQUM5ZDQ4ODNjNDYx', 'Content-Type': 'application/json'}
    data = json.dumps({
        'order_number': request.json.get('order_number'),
        'amount': int(request.json.get('amount')),
        'language': 'en',
        'term_url': 'http://payments-api-demo.us-west-2.elasticbeanstalk.com/redirect/3dsecure',
        'comments': '',
        'payment_method': 'token',
        'token': {
            'code':request.json.get('token'),
            'name':request.json.get('name')
        }
    })

    response = requests.post(url, headers=headers, data=data)
    print(response.content.decode("utf-8"))

    #toDo: check if payment complete. redirect if 3d secure
    
    return response.content.decode("utf-8"), response.status_code

@app.route('/payment/interac', methods=['POST'])
def make_interac_payment():
    print('make_interac_payment')
    url = 'https://www.beanstream.com/api/v1/payments'
    headers = {'Authorization': 'Passcode MzAwMjAzOTQwOjY5Mjg1YzE1MkY2YzQyNGE5ODBlQUM5ZDQ4ODNjNDYx', 'Content-Type': 'application/json'}
    data = json.dumps({
        'order_number': request.json.get('order_number'),
        'amount': int(request.json.get('amount')),
        'payment_method': 'interac'
    })

    response = requests.post(url, headers=headers, data=data)
    session['interac_id'] = json.loads(response.content.decode("utf-8")).get('merchant_data')
    return response.content.decode("utf-8"), response.status_code

#@app.route('/redirect/interac', methods=['POST'])
@app.route('/interac_callback', methods=['POST'])
def interac_callback():

  if 'interac_id' in session:
      url = 'https://www.beanstream.com/api/v1/payments/{0}/continue'.format(session['interac_id'])
      session.pop('interac_id', None)

      headers = {'Authorization': 'Passcode MzAwMjAyNzc5OkZENUQyYkIyMUQxOTQ1MTQ4RmJhRDJFYzAzNkY0ZmE2', 'Content-Type': 'application/json'}
      data = json.dumps({
          'payment_method': 'interac',
          'interac_response': {
              'funded':request.args.get('funded'),
              'idebit_track2':request.form.get('IDEBIT_TRACK2'),
              'idebit_isslang':request.form.get('IDEBIT_ISSLANG'),
              'idebit_version':request.form.get('IDEBIT_VERSION'),
              'idebit_issconf':request.form.get('IDEBIT_ISSCONF'),
              'idebit_issname':request.form.get('IDEBIT_ISSNAME'),
              'idebit_amount':request.form.get('IDEBIT_AMOUNT'),
              'idebit_invoice':request.form.get('IDEBIT_INVOICE'),
          }
      })

      response = requests.post(url, headers=headers, data=data)
      status = response.status_code
      content = json.loads(response.content.decode("utf-8"))

      if status == 200:
          feedback = {'success': True, 'invoice_id': content.get('order_number'), 'transaction_id': content.get('id')}
      else:
          feedback = {'success': False, 'message': content.get('message')}

      return render_template('interac_response.html', feedback=feedback)

  else:
      feedback = {'success': False, 'message': 'Error. Your session has expired. Please return to the payment page.'}
      return render_template('interac_response.html', feedback=feedback)


@app.route('/redirect/3dsecure', methods=['POST'])
def threedsecure_callback():

  if '3dsecure_id' in session:
      feedback = {'success': False, 'message': 'Foo.'}
      return render_template('interac_response.html', feedback=feedback)

  else:
      feedback = {'success': False, 'message': 'Error. Your session has expired. Please return to the payment page.'}
      return render_template('interac_response.html', feedback=feedback)


# set the secret key.  keep this really secret:
app.secret_key = 'A0Zr98j/3yX R~XHH!jmN]LWX/,?RT'

if __name__ == '__main__':
  app.run(debug=True, host='0.0.0.0')
