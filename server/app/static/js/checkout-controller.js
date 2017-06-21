/*
 * Copyright (c) 2017 - Bambora Inc. <http://dev.na.bambora.com>
 * MIT licensed. Feel free to use and abuse.
 */

(function () {
    var checkoutController = {
        init: function () {
            console.log('checkoutController.init()');
            this.addListeners();
        },
        addListeners: function () {
            console.log('checkoutController.addListeners()');
            if (document.getElementById('order-form') !== null) {
                document.getElementById('order-form').addEventListener('submit', this.onSubmit.bind(this));
            }
        },
        onSubmit: function (e) {
            console.log('checkoutController.onSubmit()');
            e.preventDefault();
            this.toggleProcessingScreen();
            this.processOrder();
        },
        setPayButton: function (enabled) {
            console.log('checkoutController.setPayButton() disabled: ' + !enabled);

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
        processOrder: function () {
            console.log('checkoutController.processOrder()');
            var amount = document.getElementById('amount').value;
            var name = document.getElementById('name').value;
            var postal = document.getElementById('postal').value;

            var xhr = new XMLHttpRequest();
            var method = "POST";
            var url = "/payment/checkout/redirect";

            var data = JSON.stringify({
                "name": name,
                "amount": amount,
                "postal": postal
            }, undefined, 2);

            xhr.open(method, url, true);
            xhr.onreadystatechange = function () {
                if (xhr.readyState === XMLHttpRequest.DONE) {
                    if (xhr.status === 200) {
                        location = JSON.parse(xhr.responseText).redirect_url;
                    }
                    this.setPayButton(true);
                    this.toggleProcessingScreen();
                }
            }.bind(this);

            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.send(data);
        }
    };

    checkoutController.init();
})();
