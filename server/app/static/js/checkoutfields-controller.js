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

    var checkoutFieldsController = {
        init: function () {
            console.log('checkoutFields.init()');
            this.mountFields();
            this.addListeners();
        },
        mountFields: function () {
            console.log('checkoutFields.mountFields()');

            // Create and mount the checkoutFields inputs
            var cardNumber = checkoutFields.create('card-number', options);
            cardNumber.mount('#card-number');

            var cvv = checkoutFields.create('cvv', options);
            cvv.mount('#cvv');

            var expiry = checkoutFields.create('expiry', options);
            expiry.mount('#expiry');
        },
        addListeners: function () {
            var self = this;
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
            });

            checkoutFields.on('complete', function (event) {
                var eventType = 'complete';
                console.log(eventType + ': ' + JSON.stringify(event));

                if (event.field === 'card-number') {
                    self.hideFieldError(event);
                } else if (event.field === 'cvv') {
                    self.hideFieldError(event);
                } else if (event.field === 'expiry') {
                    self.hideFieldError(event);
                }
            });

            checkoutFields.on('error', function (event) {
                var eventType = 'error';
                console.log(eventType + ': ' + JSON.stringify(event));

                if (event.field === 'card-number') {
                    self.showFieldError(event);
                } else if (event.field === 'cvv') {
                    self.showFieldError(event);
                } else if (event.field === 'expiry') {
                    self.showFieldError(event);
                }
            });

            if (document.getElementById('checkoutfields-form') !== null) {
                document.getElementById('checkoutfields-form').addEventListener('submit', this.onSubmit.bind(this));
            }
        },
        hideFieldError: function (event) {
            console.log('hideFieldError: ' + event.field);
            document.getElementById(event.field).classList.remove('invalid');
            document.getElementById(event.field + '-error').classList.remove('invalid');
            document.getElementById(event.field + '-error').innerHTML = '';
        },
        showFieldError: function (event) {
            console.log('showFieldError: ' + event.field);
            document.getElementById(event.field).classList.add('invalid');
            document.getElementById(event.field + '-error').classList.add('invalid');
            document.getElementById(event.field + '-error').innerHTML = event.message;
        },
        onSubmit: function (event) {
            console.log('checkoutFields.onSubmit()');
            event.preventDefault();
            this.processPayment();
        },
        processPayment: function () {
            var self = this;

            console.log('checkoutFields.processPayment()');
            self.showProcessingScreen();

            var callback = function (result) {
                console.log('checkoutFields.tokenCallback()');

                var eventType = 'token';
                console.log(eventType + ': ' + JSON.stringify(result));

                // if token is success
                if (result.code === 200) {
                    console.log('successToken()');
                    self.makeTokenPayment(result.token);
                } else {
                    self.hideProcessingScreen();
                    self.showError(result.error);
                    console.log('failToken()');
                }
            };

            console.log('checkoutFields.createToken()');
            checkoutFields.createToken(callback);
        },
        makeTokenPayment: function (token) {
            var self = this;

            console.log('checkoutFields.makeTokenPayment()');
            var amount = document.getElementById('amount').value;
            var name = document.getElementById('name').value;

            var xhr = new XMLHttpRequest();
            var method = "POST";
            var url = "/payment/basic/token"

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
                    }
                    else if (xhr.status === 200) {
                        var invoiceMessage = JSON.parse(xhr.responseText).order_number;
                        var transactionMessage = JSON.parse(xhr.responseText).id;
                        self.showSuccess(invoiceMessage, transactionMessage);
                        self.hideProcessingScreen();
                    }
                    else {
                        var message = xhr.responseText;
                        try {
                            message = JSON.parse(xhr.responseText).message;
                        }
                        catch (ex) {
                            console.log('Parsing exception: ' + ex.message);
                        }
                        self.showError(JSON.parse(xhr.responseText).message);
                        self.hideProcessingScreen();
                    }
                }
            }.bind(this);

            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.send(data);
        },
        showProcessingScreen: function () {
            document.getElementById('processing-screen').classList.add('visible');
        },
        hideProcessingScreen: function () {
            document.getElementById('processing-screen').classList.remove('visible');
        },
        showError: function (message) {
            console.log('checkoutFields.showError(): ' + message);

            this.successFeedback = document.getElementById('success-feedback');
            this.errorFeedback = document.getElementById('error-feedback');
            this.message = this.errorFeedback.getElementsByClassName('error-message')[0];

            this.message.innerHTML = message;
            this.successFeedback.classList.remove('visible');
            this.errorFeedback.classList.add('visible');
        },
        showSuccess: function (invoice, transaction) {
            console.log('checkoutFields.showSuccess(): invoice: ' + invoice + 'transaction: ' + transaction);

            this.successFeedback = document.getElementById('success-feedback');
            this.errorFeedback = document.getElementById('error-feedback');
            this.invoice = this.successFeedback.getElementsByClassName('invoice')[0];
            this.transaction = this.successFeedback.getElementsByClassName('transaction')[0];

            this.invoice.innerHTML = invoice;
            this.transaction.innerHTML = transaction;
            this.successFeedback.classList.add('visible');
            this.errorFeedback.classList.remove('visible');
        },
    };

    checkoutFieldsController.init();
})();
