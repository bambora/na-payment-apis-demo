/*
 * Copyright (c) 2017 - Bambora Inc. <http://dev.na.bambora.com>
 * MIT licensed. Feel free to use and abuse.
 */
(function () {
    var style = {
        base: {
            fontFamily: '"Fakt Pro", "HelveticaNeue-Light", \
                        "Helvetica Neue Light", "Helvetica Neue", Helvetica, \
                        Arial, "Lucida Grande", sans-serif',
            fontSize: '15px',
            color: 'rgba(30, 30, 30, 1)'
        },
        invalid: {
            color: 'red'
        }
    };
    var options = {
        style: style
    };

    var checkoutFields = checkoutfields();

    var isCardNumberComplete = false;
    var isCVVComplete = false;
    var isExpiryComplete = false;

    var checkoutFieldsController = {

        init: function () {
            console.log('checkoutFields.init()');
            this.createInputs();
            this.addListeners();
        },
        createInputs: function () {
            console.log('checkoutFields.createInputs()');

            // Create and mount the inputs
            options.placeholder = 'Card number';
            var cardNumber = checkoutFields.create('card-number', options);
            cardNumber.mount('#card-number');

            options.placeholder = 'CVV';
            var cvv = checkoutFields.create('cvv', options);
            cvv.mount('#card-cvv');

            options.placeholder = 'MM / YY';
            var expiry = checkoutFields.create('expiry', options);
            expiry.mount('#card-expiry');
        },
        addListeners: function () {
            var self = this;

            if (document.getElementById('checkout-form') !== null) {
                document.getElementById('checkout-form').addEventListener('submit', self.onSubmit.bind(self));
            }

            checkoutFields.on('brand', function (event) {
                var eventType = 'brand';
                console.log(eventType + ': ' + JSON.stringify(event));

                if (event.brand && event.brand !== 'unknown') {
                    var filePath = "/static/images/" + event.brand + ".svg";
                    cardLogo = "url(" + filePath + ")";
                } else {
                    cardLogo = "none";
                }
                document.getElementById('card-number').style.backgroundImage = cardLogo;
            });

            checkoutFields.on('blur', function (event) {
                var eventType = 'blur';
                console.log(eventType + ': ' + JSON.stringify(event));
            });

            checkoutFields.on('focus', function (event) {
                var eventType = 'focus';
                console.log(eventType + ': ' + JSON.stringify(event));
            });

            checkoutFields.on('empty', function (event) {
                var eventType = 'empty';
                console.log(eventType + ': ' + JSON.stringify(event));

                if (event.field === 'card-number') {
                    isCardNumberComplete = false;
                } else if (event.field === 'cvv') {
                    isCVVComplete = false;
                } else if (event.field === 'expiry') {
                    isExpiryComplete = false;
                }
                self.updatePayButton();
            });

            checkoutFields.on('complete', function (event) {
                var eventType = 'complete';
                console.log(eventType + ': ' + JSON.stringify(event));

                if (event.field === 'card-number') {
                    self.hideErrorForId('card-number');
                    isCardNumberComplete = true;
                } else if (event.field === 'cvv') {
                    self.hideErrorForId('card-cvv');
                    isCVVComplete = true;
                } else if (event.field === 'expiry') {
                    self.hideErrorForId('card-expiry');
                    isExpiryComplete = true;
                }
                self.updatePayButton();
            });

            checkoutFields.on('error', function (event) {
                var eventType = 'error';
                console.log(eventType + ': ' + JSON.stringify(event));

                if (event.field === 'card-number') {
                    isCardNumberComplete = false;
                    self.showErrorForId('card-number', event.message);
                } else if (event.field === 'cvv') {
                    isCVVComplete = false;
                    self.showErrorForId('card-cvv', event.message);
                } else if (event.field === 'expiry') {
                    isExpiryComplete = false;
                    self.showErrorForId('card-expiry', event.message);
                }
                self.updatePayButton();
            });
        },
        onSubmit: function (event) {
            var self = this;

            console.log('checkoutFields.onSubmit()');

            event.preventDefault();
            self.setPayButton(false);
            self.toggleProcessingScreen();

            var callback = function (result) {
                console.log('token result : ' + JSON.stringify(result));

                if (result.error) {
                    var error = 'Error creating token: </br></br>' + result.error;
                    self.showErrorFeedback(error);
                    self.updatePayButton();
                    self.toggleProcessingScreen();
                } else {
                    self.showSuccessFeedback('Created token: ' + result.token);
                    self.makeTokenPayment(result.token);
                }
            };

            console.log('checkoutFields.createToken()');
            checkoutFields.createToken(callback);
        },
        hideErrorForId: function (id) {
            console.log('hideErrorForId: ' + id);
            document.getElementById(id).classList.remove('invalid');
            document.getElementById(id + '-error').innerHTML = '';
        },
        showErrorForId: function (id, message) {
            console.log('showErrorForId: ' + id);
            document.getElementById(id).classList.add('invalid');
            document.getElementById(id + '-error').classList.add('invalid');
            document.getElementById(id + '-error').innerHTML = message;
        },
        setPayButton: function (enabled) {
            console.log('checkoutFields.setPayButton() enabled: ' + enabled);

            var payButton = document.getElementById('pay-button');
            payButton.disabled = !enabled;
            if (enabled) {
                payButton.className = "button";
            } else {
                payButton.className = "button button-disabled";
            }
        },
        updatePayButton: function () {
            console.log('checkoutFields.updatePayButton()');

            this.setPayButton(isCardNumberComplete && isCVVComplete && isExpiryComplete);
        },
        toggleProcessingScreen: function () {
            var processingScreen = document.getElementById('processing-screen');
            if (processingScreen) {
                processingScreen.classList.toggle('visible');
            }
        },
        showErrorFeedback: function (message) {
            var xMark = '\u2718';
            this.feedback = document.getElementById('feedback');
            this.feedback.innerHTML = xMark + ' ' + message;
            this.feedback.classList.add('error');
        },
        showSuccessFeedback: function (message) {
            var checkMark = '\u2714';
            this.feedback = document.getElementById('feedback');
            this.feedback.innerHTML = checkMark + ' ' + message;
            this.feedback.classList.add('success');
        },
        makeTokenPayment: function (token) {
            var self = this;

            console.log('checkoutFields.makeTokenPayment()');
            var amount = document.getElementById('amount').value;
            var name = document.getElementById('name').value;

            var xhr = new XMLHttpRequest();
            var method = "POST";
            var url = "/payment/basic/token";

            if (document.getElementById('3ds-checkbox') !== null) {
                if (document.getElementById('3ds-checkbox').checked) {
                    url = "/payment/enhanced/3d-secure/token";
                }
                else {
                    url = "/payment/enhanced/token";
                }
            }

            var data = JSON.stringify({
                "name": name,
                "amount": amount,
                "token": token
            }, undefined, 2);

            setDisplayedRequest(data);

            xhr.open(method, url, true);
            xhr.onreadystatechange = function () {
                if (xhr.readyState === XMLHttpRequest.DONE) {
                    var json = null;
                    var jsonStr = '';

                    try {
                        json = JSON.parse(xhr.responseText);
                        jsonStr = JSON.stringify(json, undefined, 2);
                        setDisplayedResponse(jsonStr);
                    }
                    catch (ex) {
                        console.log(ex);
                        setDisplayedResponse(ex.message);
                    }

                    if (json !== null && jsonStr !== '' && xhr.status === 302) {
                        var contents = json.contents;
                        var contents_decoded = decodeURIComponent(contents.replace(/\+/g, '%20'));
                        var formStr = contents_decoded.match("<FORM(.*)<\/FORM>");
                        document.body.insertAdjacentHTML('afterbegin', formStr);
                        document.form1.submit();
                    } else {
                        var message;
                        if (xhr.status === 200) {
                            var invoice = JSON.parse(xhr.responseText).order_number;
                            var transactionId = JSON.parse(xhr.responseText).id;
                            message = 'Made a payment using token.</br></br>' + transactionId + '</br></br>' + invoice;
                            self.showSuccessFeedback(message);
                        }
                        else {
                            message = xhr.responseText;
                            try {
                                message = JSON.parse(xhr.responseText).message;
                            }
                            catch (ex) {
                                console.log('Parsing exception: ' + ex.message);
                            }
                            self.showErrorFeedback(message);
                        }
                        self.updatePayButton();
                        self.toggleProcessingScreen();
                    }

                }
            }.bind(this);

            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.send(data);
        },
    };

    checkoutFieldsController.init();
})();
