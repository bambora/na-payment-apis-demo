/*
 * Copyright (c) 2017 - Bambora Inc. <http://dev.na.bambora.com>
 * MIT licensed. Feel free to use and abuse.
 */

(function() {
  'use strict';
  var paymentCardCtrl = {
    init: function() {
      this.cacheDom();
      this.initCustomCheckout();
      this.addListeners();
    },

    initCustomCheckout: function() {
      this.customCheckout = customcheckout();

      var options = {};
      options.style = {};
      options.style.base = {
        padding: '13px 15px 13px',
        fontSize: '16px',
        color: 'rgba(30, 30, 30, 1)',
        fontFamily: '"Fakt Pro", "HelveticaNeue-Light",  \
                    "Helvetica Neue Light", "Helvetica Neue", Helvetica, \
                    Arial, "Lucida Grande", sans-serif',
      };

      options.placeholder = 'Card number';
      var cardNumber = this.customCheckout.create('card-number', options);
      cardNumber.mount('#card-number');

      options.placeholder = 'MM / YY';
      var cardNumber = this.customCheckout.create('expiry', options);
      cardNumber.mount('#expiry');

      options.placeholder = 'CVC';
      var cardNumber = this.customCheckout.create('cvv', options);
      cardNumber.mount('#cvv');
    },

    cacheDom: function() {
      this.panels = $('.container').find('.message-content');
      this.form = $('#form-payment-card');
      this.spinner = $('#spinner-overlay');
      this.responsePanelSuccess = $('#response-panel-success');
      this.responsePanelFail = $('#response-panel-fail');
      this.responseId = this.responsePanelSuccess.find('#response-id');
      this.responseBank = this.responsePanelSuccess.find('#response-bank');
      this.responseCvv = this.responsePanelSuccess.find('#response-cvv');
      this.responseAvs = this.responsePanelSuccess.find('#response-avs');
      this.responseError = this.responsePanelFail.find('#response-error-message');
    },

    addListeners: function() {
      var _this = this;
      this.form.on('submit', this.onSubmit.bind(_this));

      this.customCheckout.on('complete', function(event) {
        var formGroup = $('#' + event.field).parents('.form-group');
        var icon = formGroup.find('.feedback-icon');
        formGroup.find('.feedback-message').text('');
        icon.removeClass('icon-invalid');
        icon.addClass('icon-valid');
      });

      this.customCheckout.on('error', function(event) {
        var formGroup = $('#' + event.field).parents('.form-group');
        var icon = formGroup.find('.feedback-icon');
        formGroup.find('.feedback-message').text(event.message);
        icon.removeClass('icon-valid');
        icon.addClass('icon-invalid');
      });
    },

    onSubmit: function(event) {
      event.preventDefault();
      var _this = this;
      this.spinner.fadeIn('fast');
      this.customCheckout.createToken(
        function(result) {
          if (result.error) {
            if (result.error.type !== 'TokenizationValidationFailed') {
              this.updateFeedback({ success: false, message: result.error.message });
            } else {
              this.spinner.fadeOut('fast');
            }
          } else {
            this.makePayment(result.token);
          }
        }.bind(_this)
      );
    },

    makePayment: function(token) {
      var _this = this;

      var xhr = new XMLHttpRequest();
      var method = 'POST';
      var url = '/payment/card';

      var data = JSON.stringify(
        {
          name: 'Jane Doe',
          amount: '10.00',
          token: token
        },
        undefined,
        2
      );

      xhr.timeout = 2000;
      xhr.open(method, url, true);
      xhr.onreadystatechange = function() {

        if (xhr.readyState === XMLHttpRequest.DONE) {
          var feedback = {
            success: false,
            message: 'Error. Unable to complete transaction.'
          };

          if (xhr.status === 200) {
            var response = JSON.parse(xhr.responseText);

            var feedback = {
              success: true,
              id: response.id,
              bank: response.message_id,
              cvv: response.card.cvd_result,
              avs: response.card.avs.id
            };
          } else if (xhr.status === 302) {
            // this card card requirs 3D Secure authorization
            // we extract the form element (with ID form1) from the html response and append it ot the DOM
            // we then submit the form to redirect the user to the bank for authorization
            var contents = JSON.parse(xhr.responseText).contents;
            var contents_decoded = decodeURIComponent(
              contents.replace(/\+/g, '%20')
            );
            var formStr = contents_decoded.match('<FORM(.*)</FORM>')[0];
            document.body.insertAdjacentHTML('afterbegin', formStr);
            document.form1.submit();
            return;
          } else {
            var message = xhr.status + ': ' + JSON.parse(xhr.responseText).message;
            feedback = {success: false, message: message};
          }
          this.updateFeedback(feedback);
        }
      }.bind(_this);

      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(data);
    },

    updateFeedback: function(feedback) {
      if (feedback.success) {
        this.responseId[0].value = feedback.id;
        this.responseBank[0].value = feedback.bank;
        this.responseCvv[0].value = feedback.cvv;
        this.responseAvs[0].value = feedback.avs;
        this.responsePanelSuccess.slideDown('fast');
        this.responsePanelFail.slideUp('fast');
        document.getElementById('response-id').focus();
      } else {
        this.responseError[0].value = feedback.message;
        this.responsePanelFail.slideDown('fast');
        this.responsePanelSuccess.slideUp('fast');
        document.getElementById('response-error-message').focus();
      }

      $('html, body').animate({ scrollTop: 0 }, 'slow');
      this.spinner.fadeOut('fast');
    }
  };

  paymentCardCtrl.init();
})();
