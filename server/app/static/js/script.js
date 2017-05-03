/*
 * Copyright (c) 2017 - Bambora Inc. <http://developer.na.bambora.com>
 * MIT licensed. Feel free to use and abuse.
 */

(function () {
    var tabController = {
        init: function () {
            console.log('tabController.init()');
            this.cacheDom();
            this.addListeners();
        },
        cacheDom: function () {
            console.log('tabController.cacheDom()');
            this.cardBlock = document.getElementById('card-block');
            this.interacBlock = document.getElementById('interac-block');
            this.cardTag = document.getElementById('card-tag');
            this.interacTag = document.getElementById('interac-tag');
        },
        addListeners: function () {
            console.log('tabController.addListeners()');
            if (this.cardTag != null) {
                this.cardTag.addEventListener('click', this.setPaymentMethod.bind(this));
            }
            if (this.interacTag != null) {
                this.interacTag.addEventListener('click', this.setPaymentMethod.bind(this));
            }
        },
        setPaymentMethod: function () {
            console.log('tabController.setPaymentMethod()');
            this.cardBlock.classList.toggle('visible');
            this.interacBlock.classList.toggle('visible');
            this.cardTag.classList.toggle('active');
            this.interacTag.classList.toggle('active');
            collapseGrowDiv();
        }
    };
    tabController.init();
})();

(function () {
    // Pre-populate fields
    document.getElementById('amount').value = '1.00';
    document.getElementById('name').value = 'Jane Smith';
})();

(function () {
    var cardFormController = {
        init: function () {
            console.log('cardFormController.init()');
            this.cacheDom();
            this.addListeners();
            this.getPaymentType();
        },
        cacheDom: function () {
            console.log('cardFormController.cacheDom()');
            this.cardPaymentForm = document.getElementById('cardPaymentForm');
            this.processingScreen = document.getElementById('processing-screen');
            this.successFeedback = document.getElementById('success-feedback');
            this.errorFeedback = document.getElementById('error-feedback');
            this.message = this.errorFeedback.getElementsByClassName('error-message')[0];
            this.invoice = this.successFeedback.getElementsByClassName('invoice')[0];
            this.transaction = this.successFeedback.getElementsByClassName('transaction')[0];
        },
        addListeners: function () {
            console.log('cardFormController.addListeners()');
            document.addEventListener('beanstream_payfields_loaded', this.onFieldsInjected.bind(this));
            document.addEventListener('beanstream_payfields_tokenRequested', this.onTokenRequested.bind(this));
            document.addEventListener('beanstream_payfields_tokenUpdated', this.onTokenUpdated.bind(this));
            document.addEventListener('beanstream_payfields_inputValidityChanged', this.onValidityChanged.bind(this));
            if (this.cardPaymentForm != null) {
                this.cardPaymentForm.addEventListener('submit', function preventDefault(e) {
                    e.preventDefault();
                });
            }
        },
        onFieldsInjected: function () {
            console.log('cardFormController.onFieldsInjected()');
            this.number = document.querySelector("[data-beanstream-id='ccNumber']");
            this.expiry = document.querySelector("[data-beanstream-id='ccExp']");
            this.cvv = document.querySelector("[data-beanstream-id='ccCvv']");
        },
        onTokenRequested: function () {
            console.log('cardFormController.onTokenRequested()');
            this.processingScreen.classList.toggle('visible');
        },
        onTokenUpdated: function (e) {
            console.log('cardFormController.onTokenUpdated()');
            if (e.eventDetail.success) {
                this.makeTokenPayment(e.eventDetail.token);
            }
            else {
                this.message.innerHTML = e.eventDetail.message;
                this.successFeedback.classList.remove('visible');
                this.errorFeedback.classList.add('visible');
                this.processingScreen.classList.toggle('visible');
            }
        },
        onValidityChanged: function (e) {
            console.log('cardFormController.onValidityChanged()');
            switch (e.eventDetail.fieldType) {
                case 'number':
                    if (e.eventDetail.isValid) {
                        this.number.classList.remove('invalid');
                    }
                    else {
                        this.number.classList.add('invalid');
                    }
                    break;
                case 'expiry':
                    if (e.eventDetail.isValid) {
                        this.expiry.classList.remove('invalid');
                    }
                    else {
                        this.expiry.classList.add('invalid');
                    }
                    break;
                case 'cvv':
                    if (e.eventDetail.isValid) {
                        this.cvv.classList.remove('invalid');
                    }
                    else {
                        this.cvv.classList.add('invalid');
                    }
                    break;
                default:
                    break;
            }
        },
        makeTokenPayment: function (token) {
            console.log('cardFormController.makeTokenPayment()');
            var amount = document.getElementById('amount').value;
            var name = document.getElementById('name').value;

            var xhr = new XMLHttpRequest();
            var method = "POST";
            var url = "/payment/basic/token"

            if (document.getElementById('3ds-checkbox') != null) {
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

                    if (json != null && jsonStr !== '' && xhr.status === 302) {
                        var contents = json.contents;
                        var contents_decoded = decodeURIComponent(contents.replace(/\+/g, '%20'));
                        var formStr = contents_decoded.match("<FORM(.*)<\/FORM>");
                        document.body.insertAdjacentHTML('afterbegin', formStr);
                        document.form1.submit();
                    }
                    else if (xhr.status === 200) {
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
        },
        getPaymentType: function () {
            console.log('cardFormController.getPaymentType()');

            // We can use the url to determine which payment method to use.
            this.paymentType = window.location.href.substr(window.location.href.lastIndexOf('/') + 1);
        }
    };

    cardFormController.init();
})();

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
            if (document.getElementById('interacPaymentForm') != null) {
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

function toggleGrowDiv() {
    var growDiv = document.getElementById('grow');
    if (growDiv.clientHeight) {
        growDiv.style.height = 0;
    }
    else {
        var wrapper = document.querySelector('.measuringWrapper');
        growDiv.style.height = wrapper.clientHeight + "px";
        growDiv.scrollIntoView();
    }
    var moreButton = document.getElementById('more-button');
    moreButton.value = moreButton.value == 'Show JSON' ? 'Hide JSON' : 'Show JSON';
}

function collapseGrowDiv() {
    var growDiv = document.getElementById('grow');
    if (growDiv.clientHeight > 0) {
        toggleGrowDiv();
    }
}

function setRequestStr(str) {
    var elem = document.getElementById('raw-json-request');
    elem.innerHTML = str;
    elem.className = "prettyprint lang-js";

    PR.prettyPrint();
    resizeGrowDiv();
}

function setResponseStr(str) {
    var elem = document.getElementById('raw-json-response');
    elem.innerHTML = str;
    elem.className = "prettyprint lang-js";

    PR.prettyPrint();
    resizeGrowDiv();
}

// Text change may require a resize of the containing div
function resizeGrowDiv() {
    var growDiv = document.getElementById('grow');
    if (growDiv.clientHeight > 0) {
        // Force div resize
        var display = growDiv.style.display;
        growDiv.style.display = 'none';
        var trick = growDiv.offsetHeight;
        growDiv.style.display = display;

        // Reset containing div size
        var wrapper = document.querySelector('.measuringWrapper');
        growDiv.style.height = wrapper.clientHeight + "px";
        growDiv.style.height = wrapper.clientHeight + "px";
    }
}

// Doesn't quite work as Payfields DOM events aren't fired to format and validate.
function setCCPaymentData(cardStr, cvvStr) {
    var cardPaymentForm = document.getElementById('cardPaymentForm');
    var ccNumberInput = cardPaymentForm.querySelector('[data-beanstream-id=ccNumber]');
    var ccExpInput = cardPaymentForm.querySelector('[data-beanstream-id=ccExp]');
    var ccCvvInput = cardPaymentForm.querySelector('[data-beanstream-id=ccCvv]');

    ccNumberInput.value = cardStr;
    ccExpInput.value = '12/2030';
    ccCvvInput.value = cvvStr;
}

// Copies a string to the clipboard. Must be called from within an
// event handler such as click. May return false if it failed, but
// this is not always possible. Browser support for Chrome 43+,
// Firefox 42+, Safari 10+, Edge and IE 10+.
// IE: The clipboard feature may be disabled by an administrator. By
// default a prompt is shown the first time the clipboard is
// used (per session).
function copyToClipboard(text) {
    var copied = false;
    if (window.clipboardData && window.clipboardData.setData) {
        // IE specific code path to prevent textarea being shown while dialog is visible.
        copied = clipboardData.setData("Text", text);

    } else if (document.queryCommandSupported && document.queryCommandSupported("copy")) {
        var textarea = document.createElement("textarea");
        textarea.textContent = text;
        textarea.style.position = "fixed";  // Prevent scrolling to bottom of page in MS Edge.
        document.body.appendChild(textarea);
        textarea.select();
        try {
            copied = document.execCommand("copy");  // Security exception may be thrown by some browsers.
        } catch (ex) {
            console.warn("Copy to clipboard failed.", ex);
            copied = false;
        } finally {
            document.body.removeChild(textarea);
        }
    }

    if (copied) {
        alert("Copied card number to clipboard");
    }
}