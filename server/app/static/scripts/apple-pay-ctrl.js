document.addEventListener('DOMContentLoaded', () => {
    if (window.ApplePaySession) {
        if (ApplePaySession.canMakePayments) {
                document.getElementById('apple_pay_button').style.display = 'inline-block';
                document.getElementById('apple_pay_not_enabled').style.display = 'none';
            }
        }
    }
);

function getApplePaySession(url) {
    console.log(url);
    return new Promise(function (resolve, reject) {
      var xhr = new XMLHttpRequest();
      xhr.open('POST', '/getApplePaySession');
      xhr.onload = function () {
        if (this.status >= 200 && this.status < 300) {
          resolve(JSON.parse(xhr.response));
        } else {
          reject({
            status: this.status,
            statusText: xhr.statusText
          });
        }
      };
      xhr.onerror = function () {
        reject({
          status: this.status,
          statusText: xhr.statusText
        });
      };
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.send(JSON.stringify({url: url}));
    });
  }

function applePayButtonClicked() {
    const paymentRequest = {
        countryCode: 'US',
        currencyCode: 'USD',
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
            amount: '8.99',
        },
 
        supportedNetworks:[ 'amex', 'discover', 'masterCard', 'visa'],
        merchantCapabilities: [ 'supports3DS' ],
 
        requiredShippingContactFields: [ 'postalAddress', 'email' ],
    };
 
    const session = new ApplePaySession(1, paymentRequest);
    
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
        const totalCost = event.shippingMethod.identifier === 'free' ? '8.99' : '13.99';
 
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
        // Send payment for processing...
        const payment = event.payment;
 
        // ...return a status and redirect to a confirmation page
        session.completePayment(ApplePaySession.STATUS_SUCCESS);
        window.location.href = "/success.html";
    }
 
    // All our handlers are setup - start the Apple Pay payment
    session.begin();
}