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
git clone https://github.com/bambora/na-payment-apis-demo.git
cd na-payment-apis-demo/server/app
```

* Install virtualenv (if not already available)

```bash
[sudo] pip install virtualenv
```

* Create (if not already created) and/or Activate project environment

```bash
virtualenv -p python3 venv
source venv/bin/activate
```

* Install/update project dependencies

```bash
cd server/app
pip install -r requirements.txt
```

## Execution (Development Only)

### Set up Environment Variables

We are using 2 test accounts in this demo app. One is on Production, the other is on Sandbox. All services,
except Visa Checkout can be tested on Production. Visa Checkout must be tested on Sandbox.

#### Mac/Linux

```bash
export SERVER_URL_BASE="https://api.na.bambora.com"  # Defaults to this and can be omitted
export DATABASE_URL=sqlite:////tmp/mobilepay-demo.db  # Defaults to this and can be omitted
export MERCHANT_ID=<your_bambora_merchant_id>
export API_PASSCODE=<your_payment_api_passcode>
export BATCH_PAYMENT_API_PASSCODE=<your_batch_payment_api_passcode>
export REPORT_API_PASSCODE=<report_api_passcode>
export SANDBOX_MERCHANT_ID=<your_bambora_sandbox_merchant_id>
export SANDBOX_API_PASSCODE=<your_sandbox_payment_api_passcode>
export SANDBOX_HASH_KEY=<your_sandbox_hash_key>
export SANDBOX_VISA_CHECKOUT_API_KEY=<your_sandbox_visa_checkout_api_key>
```

#### Windows

```bash
(venv) app$ $env:SERVER_URL_BASE ="https://api.na.bambora.com"  # Defaults to this and can be omitted
(venv) app$ $env:DATABASE_URL = "sqlite:////users/<your_user>/appdata/local/temp/mobilepay-demo.db"
(venv) app$ $env:MERCHANT_ID = "<your_bambora_merchant_id>"
(venv) app$ $env:API_PASSCODE = "<your_merchant_payments_passcode>"
(venv) app$ $env:SANDBOX_MERCHANT_ID = "<your_bambora_sandbox_merchant_id>"
(venv) app$ $env:SANDBOX_API_PASSCODE = "<your_sandbox_merchant_payments_passcode>"
(venv) app$ $env:SANDBOX_HASH_KEY = "<your_sandbox_hash_key>"
```

### Run

From within the server/app directory:

```bash
python server.py
```

## Local Dev SSL Setup

If you require HTTPS, then you'll need to create a local Certificate Authority (CA), trust it,
and then generate certs to use.

### Generate the Root cert & App Cert

Run the supplied `gen-cert.sh` script.  This creates the root CA & cert for the app.

### Trust the Cert

#### Mac

```bash
sudo security add-trusted-cert -d -r trustAsRoot -k /Library/Keychains/System.keychain server/app/domain.crt
```

Once this is done, going to https://0.0.0.0:5000 should resolve without error.

# Mobile Payment Clients

Apple Pay or Android Pay payment requests are initiated from mobile clients and then, if successful, an Apple Pay or
Android Pay token is transmitted to the demo payment server, which records the payment request and executes the Bambora
Payments API.

In your production flow, a mobile client might transmit other info such as the customer identifier,
detailed sales/inventory data, and related shipping and billing addresses. This info might be recorded
on a merchant's CRM (as an example), and then a request to process the payment using the Apple Pay or
Android Pay token would then be made to the Bambora Payments API. Upon success or failure to process
the payment, the merchant's CRM could be updated and the originating mobile client would then receive a response.

# iOS Client

The iOS client project was built with XCode 8 and requires Swift 3.0.

<img width="83" height="53" align="right" src="http://images.apple.com/v/apple-pay/f/images/overview/apple_pay_logo_large_2x.png">

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

# Android Client

The Android client project was built with Android Studio v2.3.1.

<img width="120" align="right" src="https://www.android.com/static/2016/img/pay/androidpaylogo-outlined.png">

For details on how to develop Android Pay enabled apps please visit:

https://developers.google.com/android-pay/

## Android Pay and the Bambora Payments API

When an Android Pay client makes a payment request, it first gets an Android Pay payment token using standard Android
SDK APIs. It then communicates this info to the Demo Server which is responsible for interacting with the
Bambora Payments API. The Bambora Payments API has been updated to allow for Android Pay transactions
and the following is a sample POST parameter to use with a RESTful invocation of the Payments API.

```
payload = {
    'amount': float(<purchase_amount>),
    'payment_method': 'android_pay',
    'android_pay': {
        'apple_pay_merchant_id': <your_android_pay_merchant_id>,
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
* [Android Pay @ Bambora](https://dev.na.bambora.com/docs/guides/android_pay/)
* [Getting Started with Android Pay](https://www.android.com/pay/)
