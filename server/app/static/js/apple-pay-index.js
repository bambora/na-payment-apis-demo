/*
Copyright (C) 2016 Apple Inc. All Rights Reserved.
See LICENSE.txt for this sample’s licensing information

Abstract:
The main client-side JS. Handles displaying the Apple Pay button and requesting a payment.
*/

/**
* This method is called when the page is loaded.
* We use it to show the Apple Pay button as appropriate.
* Here we're using the ApplePaySession.canMakePayments() method,
* which performs a basic hardware check.
*
* If we wanted more fine-grained control, we could use
* ApplePaySession.canMakePaymentsWithActiveCards() instead.
*/
document.addEventListener('DOMContentLoaded', () => {
    if (window.ApplePaySession) {
        if (ApplePaySession.canMakePayments) {
            showApplePayButton();
        }
    }
});

function showApplePayButton() {
    HTMLCollection.prototype[Symbol.iterator] = Array.prototype[Symbol.iterator];
    const buttons = document.getElementsByClassName("apple-pay-button");
    for (let button of buttons) {
        button.className += " visible";
    }
}


/**
* Apple Pay Logic
* Our entry point for Apple Pay interactions.
* Triggered when the Apple Pay button is pressed
*/
function applePayButtonClicked() {
    const paymentRequest = {
        countryCode: 'CA',
        currencyCode: 'CAD',
        shippingMethods: [
            {
                label: 'Free Shipping',
                amount: '0.00',
                identifier: 'free',
                detail: 'Delivers in five business days',
            },
            {
                label: 'Express Shipping',
                amount: '5.00',
                identifier: 'express',
                detail: 'Delivers in two business days',
            },
        ],

        lineItems: [
            {
                label: 'Shipping',
                amount: '0.00',
            }
        ],

        total: {
            label: 'Apple Pay Example',
            amount: '1.00',
        },

        supportedNetworks:[ 'amex', 'discover', 'masterCard', 'visa'],
        merchantCapabilities: [ 'supports3DS' ],

        requiredShippingContactFields: [ 'postalAddress', 'email' ],
    };

    const session = new ApplePaySession(1, paymentRequest);

    /**
    * Merchant Validation
    * We call our merchant session endpoint, passing the URL to use
    */
    session.onvalidatemerchant = (event) => {
        console.log("Validate merchant");
        const validationURL = event.validationURL;
        getApplePaySession(event.validationURL).then(function(response) {
            console.log(response);
            session.completeMerchantValidation(response);
        });
    };

    /**
    * Shipping Method Selection
    * If the user changes their chosen shipping method we need to recalculate
    * the total price. We can use the shipping method identifier to determine
    * which method was selected.
    */
    session.onshippingmethodselected = (event) => {
        const shippingCost = event.shippingMethod.identifier === 'free' ? '0.00' : '5.00';
        const totalCost = event.shippingMethod.identifier === 'free' ? '1.00' : '6.00';

        const lineItems = [
            {
                label: 'Shipping',
                amount: shippingCost,
            },
        ];

        const total = {
            label: 'Apple Pay Example',
            amount: totalCost,
        };

        session.completeShippingMethodSelection(ApplePaySession.STATUS_SUCCESS, total, lineItems);
    };

    /**
    * Payment Authorization
    * Here you receive the encrypted payment data. You would then send it
    * on to your payment provider for processing, and return an appropriate
    * status in session.completePayment()
    */
    session.onpaymentauthorized = (event) => {
        const amount = document.getElementById('amount').value;
        const name = document.getElementById('name').value;

        // Send payment for processing...
        const payment = event.payment;
        const token = payment.token;

        makeApplePayPaymentRequest(amount, name, token);

        // ...return a status and redirect to a confirmation page
        session.completePayment(ApplePaySession.STATUS_SUCCESS);
    }

    // All our handlers are setup - start the Apple Pay payment
    session.begin();
}

// Returns true if payment request is successful otherwise returns false
function makeApplePayPaymentRequest(amount, name, paymentToken) {

    console.log('makeApplePayRequest()');

    const paymentData = paymentToken.paymentData;
    var encodedPaymentData = Base64.encode(JSON.stringify(paymentData));

    var xhr = new XMLHttpRequest();
    var method = "POST";
    var url = "/payment/mobile/process/apple-pay";

    var data = JSON.stringify({
        'name': name,
        'amount': amount,
        'payment-token': encodedPaymentData
    });

    setRequestStr(data);

    xhr.open(method, url, true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            var json = null;
            var jsonStr = '';

            try {
                json = JSON.parse(xhr.responseText);
                jsonStr = JSON.stringify(json, undefined, 2);
                setResponseStr(jsonStr);
            }
            catch (ex) {
                console.log(ex);
                setResponseStr(ex.message);
            }

            if (xhr.status === 200) {
                this.invoice.innerHTML = JSON.parse(xhr.responseText).order_number;
                this.transaction.innerHTML = JSON.parse(xhr.responseText).id;
                this.errorFeedback.classList.remove('visible');
                this.successFeedback.classList.add('visible');
                this.processingScreen.classList.toggle('visible');
            }
            else {
                var message = xhr.responseText;
                try {
                    message = JSON.parse(xhr.responseText).message;
                }
                catch (ex) {
                    console.log('Parsing exception: ' + ex.message);
                }
                this.message.innerHTML = JSON.parse(xhr.responseText).message;
                this.successFeedback.classList.remove('visible');
                this.errorFeedback.classList.add('visible');
                this.processingScreen.classList.toggle('visible');
            }
        }
    }.bind(this);

    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(data);
}