/*
 * Copyright (c) 2017 - Bambora Inc. <http://dev.na.bambora.com>
 * MIT licensed. Feel free to use and abuse.
 */

(function () {
    var interacFormController = {
        init: function () {
            console.log('interacFormController.init()');
            this.cacheDom();
            this.addListeners();
        },
        cacheDom: function () {
            console.log('interacFormController.cacheDom()');
            this.processingScreen = document.getElementById('processing-screen');
            this.successFeedback = document.getElementById('success-feedback');
            this.errorFeedback = document.getElementById('error-feedback');
            this.message = this.errorFeedback.getElementsByClassName('error-message')[0];
        },
        addListeners: function () {
            console.log('interacFormController.addListeners()');
            if (document.getElementById('interacPaymentForm') !== null) {
                document.getElementById('interacPaymentForm').addEventListener('submit', this.onSubmit.bind(this));
            }
        },
        onSubmit: function (e) {
            console.log('interacFormController.onSubmit()');
            e.preventDefault();
            this.makeInteracPayment();
        },
        makeInteracPayment: function (e) {
            console.log('interacFormController.makeInteracPayment()');
            this.processingScreen.classList.toggle('visible');

            var amount = document.getElementById('amount').value;
            var xhr = new XMLHttpRequest();
            var method = "POST";
            var data = JSON.stringify({"amount": amount});
            var url = "/payment/enhanced/interac";

            xhr.open(method, url, true);
            xhr.onreadystatechange = function () {
                if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 302) {
                    var contents = JSON.parse(xhr.responseText).contents;
                    var contents_decoded = decodeURIComponent(contents.replace(/\+/g, '%20'));
                    var formStr = contents_decoded.match("<FORM(.*)<\/FORM>");
                    document.body.insertAdjacentHTML('afterbegin', formStr);
                    document.frmIOnline.submit();
                }
                else if (xhr.readyState === XMLHttpRequest.DONE) {
                    this.message.innerHTML = JSON.parse(xhr.responseText).message;
                    this.successFeedback.classList.remove('visible');
                    this.errorFeedback.classList.add('visible');
                    this.processingScreen.classList.toggle('visible');
                }
            }.bind(this);

            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.send(data);
        }
    };

    interacFormController.init();
})();
