/*
 * Copyright (c) 2017 - Bambora Inc. <http://dev.na.bambora.com>
 * MIT licensed. Feel free to use and abuse.
 */

(function(window) {
  'use strict';
  var visaCheckoutController = {

    init: function() {
      this.cacheDom();
      console.log('visaCheckoutController.init');
    },

    cacheDom: function() {
      this.spinner = $('#spinner-overlay');
      this.responsePanelSuccess = $('#response-panel-success');
      this.responsePanelFail = $('#response-panel-fail');
      this.responseId = $('#response-id');
      this.responseBank = $('#response-bank');
      this.responseCvv = $('#response-cvv');
      this.responseAvs = $('#response-avs');
      this.responseError = $('#response-error-message');
    },
    makePayment: function(callId) {
      var _this = this;

      var xhr = new XMLHttpRequest();
      var method = 'POST';
      var url = '/visa-checkout/capture';

      var data = JSON.stringify(
        {
          amount: '10.00',
          callId: callId
        },
        undefined,
        2
      );

      xhr.open(method, url, true);
      xhr.onreadystatechange = function() {

        if (xhr.readyState === XMLHttpRequest.DONE) {
          var feedback = {
            success: false,
            message: 'Error. Unable to complete transaction.'
          };

          if (xhr.status === 200) {
            var feedback = JSON.parse(xhr.responseText);
          } else {
            var message = xhr.status + ': ' + JSON.parse(xhr.responseText).message;
            feedback = {success: false, message: message};
          }
          this.updateFeedback(feedback);
        }
      }.bind(_this);

      this.spinner.fadeIn('fast');
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(data);
    },

    updateFeedback: function(feedback) {
      if (feedback.success) {
        this.responseId.text(feedback.id);
        this.responseBank.text(feedback.bank);
        this.responseCvv.text(feedback.cvv);
        this.responseAvs.text(feedback.avs);
        this.showFeedback('success');
      } else {
        this.responseError.text(feedback.message);
        this.showFeedback('error');
      }

      $('html, body').animate({ scrollTop: 0 }, 'slow');
      this.spinner.fadeOut('fast');
    },

    showFeedback: function(type) {
      if (type === 'success') {
        this.responsePanelSuccess.slideDown('fast');
        this.responsePanelFail.slideUp('fast');
      } else {
        this.responsePanelFail.slideDown('fast');
        this.responsePanelSuccess.slideUp('fast');
      }
    }
  };
  visaCheckoutController.init();

  window.onVisaCheckoutReady = function() {
    $('#page-wrapper').removeClass('page-loading');
    $('#spinner-overlay').fadeOut('fast');

    V.init({
      apikey: VISA_CHECKOUT_API_KEY,
      paymentRequest: {
        currencyCode: 'CAD',
        subtotal: '10.00'
      }
    });
    V.on('payment.success', function(payment) {
      visaCheckoutController.makePayment(payment.callid);
    });
    V.on('payment.cancel', function(payment) {
      var feedback = {success: false, message: "Transaction canceled by user."};
      visaCheckoutController.updateFeedback(feedback);
    });
    V.on('payment.error', function(payment, error) {
      var feedback = {success: false, message: payment.message};
      visaCheckoutController.updateFeedback(feedback);
    });
  };

})(window);
