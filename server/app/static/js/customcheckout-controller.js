(function () {
    var customCheckout = customcheckout();

    var isCardNumberComplete = false;
    var isCVVComplete = false;
    var isExpiryComplete = false;

    var customCheckoutController = {

        init: function () {
            console.log('checkout.init()');
            this.createInputs();
            this.addListeners();
        },
        createInputs: function () {
            console.log('checkout.createInputs()');
            var options = {};

            // Create and mount the inputs
            options.placeholder = 'Card number';
            customCheckout.create('card-number', options).mount('#card-number');

            options.placeholder = 'CVV';
            customCheckout.create('cvv', options).mount('#card-cvv');

            options.placeholder = 'MM / YY';
            customCheckout.create('expiry', options).mount('#card-expiry');
        },
        addListeners: function () {
            var self = this;

            // listen for submit button
            if (document.getElementById('checkout-form') !== null) {
                document.getElementById('checkout-form').addEventListener('submit', self.onSubmit.bind(self));
            }

            customCheckout.on('brand', function (event) {
                console.log('brand: ' + JSON.stringify(event));

                if (event.brand && event.brand !== 'unknown') {
                    var filePath = "https://cdn.na.bambora.com/downloads/images/cards/" + event.brand + ".svg";
                    cardLogo = "url(" + filePath + ")";
                } else {
                    cardLogo = "none";
                }
                document.getElementById('card-number').style.backgroundImage = cardLogo;
            });

            customCheckout.on('blur', function (event) {
                console.log('blur: ' + JSON.stringify(event));
            });

            customCheckout.on('focus', function (event) {
                console.log('focus: ' + JSON.stringify(event));
            });

            customCheckout.on('empty', function (event) {
                console.log('empty: ' + JSON.stringify(event));

                if (event.empty) {
                    if (event.field === 'card-number') {
                        isCardNumberComplete = false;
                    } else if (event.field === 'cvv') {
                        isCVVComplete = false;
                    } else if (event.field === 'expiry') {
                        isExpiryComplete = false;
                    }
                    self.setPayButton(false);
                }
            });

            customCheckout.on('complete', function (event) {
                console.log('complete: ' + JSON.stringify(event));

                if (event.field === 'card-number') {
                    isCardNumberComplete = true;
                    self.hideErrorForId('card-number');
                } else if (event.field === 'cvv') {
                    isCVVComplete = true;
                    self.hideErrorForId('card-cvv');
                } else if (event.field === 'expiry') {
                    isExpiryComplete = true;
                    self.hideErrorForId('card-expiry');
                }

                self.setPayButton(isCardNumberComplete && isCVVComplete && isExpiryComplete);
            });

            customCheckout.on('error', function (event) {
                console.log('error: ' + JSON.stringify(event));

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
                self.setPayButton(false);
            });
        },
        onSubmit: function (event) {
            var self = this;

            console.log('checkout.onSubmit()');

            event.preventDefault();
            self.setPayButton(false);
            self.toggleProcessingScreen();

            var callback = function (result) {
                console.log('token result : ' + JSON.stringify(result));

                if (result.error) {
                    self.processTokenError(result.error);
                } else {
                    self.processTokenSuccess(result.token);
                }
            };

            console.log('checkout.createToken()');
            customCheckout.createToken(callback);
        },
        hideErrorForId: function (id) {
            console.log('hideErrorForId: ' + id);

            var element = document.getElementById(id);

            if (element !== null) {
                var errorElement = document.getElementById(id + '-error');
                if (errorElement !== null) {
                    errorElement.innerHTML = '';
                }

                var bootStrapParent = document.getElementById(id + '-bootstrap');
                if (bootStrapParent !== null) {
                    bootStrapParent.className = "form-group has-feedback has-success";
                }
            } else {
                console.log('showErrorForId: Could not find ' + id);
            }
        },
        showErrorForId: function (id, message) {
            console.log('showErrorForId: ' + id + ' ' + message);

            var element = document.getElementById(id);

            if (element !== null) {
                var errorElement = document.getElementById(id + '-error');
                if (errorElement !== null) {
                    errorElement.innerHTML = message;
                }

                var bootStrapParent = document.getElementById(id + '-bootstrap');
                if (bootStrapParent !== null) {
                    bootStrapParent.className = "form-group has-feedback has-error ";
                }
            } else {
                console.log('showErrorForId: Could not find ' + id);
            }
        },
        setPayButton: function (enabled) {
            console.log('checkout.setPayButton() disabled: ' + !enabled);

            var payButton = document.getElementById('pay-button');
            if (enabled) {
                payButton.disabled = false;
                payButton.className = "btn btn-primary";
            } else {
                payButton.disabled = true;
                payButton.className = "btn btn-primary disabled";
            }
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
        processTokenError: function (error) {
            error = JSON.stringify(error, undefined, 2);
            console.log('processTokenError: ' + id);

            this.showErrorFeedback('Error creating token: </br>' + JSON.stringify(error, null, 4));
            this.setPayButton(true);
            this.toggleProcessingScreen();
        },
        processTokenSuccess: function (token) {
            console.log('processTokenSuccess: ' + token);

            this.showSuccessFeedback('Success! Created token: ' + token);
            this.setPayButton(true);

            // Use token to call Payments API
            this.makeTokenPayment(token);
        },
        makeTokenPayment: function (token) {
            var self = this;

            console.log('checkout.makeTokenPayment()');

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
                            var orderNumber = JSON.parse(xhr.responseText).order_number;
                            var transactionId = JSON.parse(xhr.responseText).id;
                            message = 'Made a payment using token.</br></br>Transaction Id:</br>' + transactionId + '</br></br>Order Number:</br>' + orderNumber;
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
                        self.setPayButton(true);
                        self.toggleProcessingScreen();
                    }

                }
            }.bind(this);

            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.send(data);
        },
    };

    customCheckoutController.init();
})();
