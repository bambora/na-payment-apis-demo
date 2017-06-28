<img src="https://cdn.na.bambora.com/resources/logos/bambora-logo180x92.png" />

# Payment APIs Demo Client & Server

Copyright © 2017 Bambora Inc.

This repo contains a simple merchant Python/Flask server and associated Web and iOS clients to help process payments. 
The demo server & clients are intended to be simple examples that can help you with your production implementation.

# Server

Feel free to [view and try out](https://demo.na.bambora.com) the Payment APIs Demo web app now!

The server project requires Python 3. To build & run the server for local dev you can use a SQLite DB and 
try the server out by just setting your Bambora Payments API Passcode as a server side environment variable 
and then start up as follows.

## Server Setup & Installation

* Execute a git clone command on this repo and in a terminal cd into the root project directory.
```bash
$ git clone https://github.com/bambora/na-payment-apis-demo.git
$ cd na-payment-apis-demo/server/app
```

* Install virtualenv (if not already available)
```bash
$ [sudo] pip install virtualenv
```

* Create (if not already created) and/or Activate project environment
```bash
$ virtualenv -p python3 venv
$ source venv/bin/activate
```

* Install/update project dependencies
```bash
(venv) app$ pip install -r requirements.txt
```

## Execution (Development Only)

### Set up Environment Variables
#### Mac/Linux
```bash
(venv) app$ export SERVER_URL_BASE="https://api.na.bambora.com"  # Defaults to this and can be omitted
(venv) app$ export DATABASE_URL=sqlite:////tmp/mobilepay-demo.db  # Defaults to this and can be omitted
(venv) app$ export API_PASSCODE=<your_merchant_payments_passcode>
(venv) app$ export MERCHANT_ID=<your_bambora_merchant_id>
```

#### Windows
```
(venv) app$ $env:SERVER_URL_BASE ="https://api.na.bambora.com"  # Defaults to this and can be omitted
(venv) app$ $env:DATABASE_URL = "sqlite:////users/<your_user>/appdata/local/temp/mobilepay-demo.db"
(venv) app$ $env:API_PASSCODE = "<your_merchant_payments_passcode>"
(venv) app$ $env:MERCHANT_ID = "<your_bambora_merchant_id>"
```

### Run 
```
(venv) app$ python server.py
```

# iOS Client

The iOS client project was built with XCode 8 and requires Swift 3.0.

<img width="83" height="53" align="right" src="http://images.apple.com/v/apple-pay/f/images/overview/apple_pay_logo_large_2x.png">

The Apple Pay payment request flows from the iOS client and then, if successful, an Apple Pay token is 
transmitted to the demo merchant server, which records the payment request and executes the Bambora 
Payments API.

In your production flow, a mobile client might transmit other info such as the customer identifier, 
detailed sales/inventory data, and related shipping and billing addresses. This info might be recorded 
on a merchants CRM (as an example), and then a request to process the payment using the Apple Pay token 
would then be made to the Bambora Payments API. Upon success or failure to process the payment, the 
merchant’s CRM could be updated and the originating mobile client would then receive a response.

For details on how to develop Apple Pay enabled apps please visit:

https://developer.apple.com/library/content/ApplePay_Guide/index.html#//apple_ref/doc/uid/TP40014764-CH1-SW1

## Apple Pay and the Bambora Payments API

When an Apple Pay client makes a payment request, it first gets an Apple Pay payment token using standard Apple SDK 
APIs. It then communicates this info to the Demo Server which is responsible for interacting with the 
Bambora Payments API. The Bambora Payments API has been updated to allow for Apple Pay transactions 
and the following is a sample POST parameter to use with a RESTful invocation of the Payments API.

```
payload = {
    'amount': float(<purchase_amount>),
    'payment_method': 'apple_pay',
    'apple_pay': {
        'apple_pay_merchant_id': <your_apple_pay_merchant_id>,
        'payment_token': <apple_pay_base64_encoded_token>,
        'complete': <true (Defaults to true if omitted. Used for a purchase) | false (Used for a Pre-Auth.)>
    }
}
```

---

<a name="contributing"/>

## Building Locally and Contributing

 * Check out this repository
 * Fork the repo to commit changes to and issue Pull Requests as needed.

---

# API References
* [Mercant Quickstart](https://dev.na.bambora.com/docs/guides/merchant_quickstart/)
* [Payment APIs](https://dev.na.bambora.com/docs/references/payment_APIs)
* [Apple Pay @ Bambora](https://dev.na.bambora.com/docs/guides/apple_pay/)
* [Getting Started with Apple Pay](https://developer.apple.com/apple-pay/get-started/)
* [Apple Pay Programming Guide](https://developer.apple.com/library/content/ApplePay_Guide/)
* [Apple Pay Sandbox Testing](https://developer.apple.com/support/apple-pay-sandbox/)
