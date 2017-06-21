/*
 * Copyright (c) 2017 - Bambora Inc. <http://dev.na.bambora.com>
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
            if (this.cardTag !== null) {
                this.cardTag.addEventListener('click', this.setPaymentMethod.bind(this));
            }
            if (this.interacTag !== null) {
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
	if (document.getElementById('postal') !== null) {
		document.getElementById('postal').value = 'V8T 4M3';
	}
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
    moreButton.value = moreButton.value === 'Show JSON' ? 'Hide JSON' : 'Show JSON';
}

function collapseGrowDiv() {
    var growDiv = document.getElementById('grow');
    if (growDiv.clientHeight > 0) {
        toggleGrowDiv();
    }
}

function setDisplayedRequest(request) {
    var elem = document.getElementById('raw-json-request');
    elem.innerHTML = request;
    elem.className = "prettyprint lang-js";

    PR.prettyPrint();
    resizeGrowDiv();
}

function setDisplayedResponse(response) {
    var elem = document.getElementById('raw-json-response');
    elem.innerHTML = response;
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