/*
 * Copyright (c) 2017 - Bambora Inc. <http://dev.na.bambora.com>
 * MIT licensed. Feel free to use and abuse.
 */

(function() {
  'use strict';
  var fundsTransferCtrl = {
    init: function() {
      this.cacheDom();
      this.addListeners();
    },

    cacheDom: function() {
      this.panels = $('.container').find('.message-content');
      this.form = $('#form-funds-transfer');
      this.transitNumber = this.form.find('#transit-number');
      this.institutionNumber = this.form.find('#institution-number');
      this.accountNumber = this.form.find('#account-number');
      this.spinner = $('#spinner-overlay');
      this.responsePanelSuccess = $('#response-panel-success');
      this.responsePanelFail = $('#response-panel-fail');
    },

    addListeners: function() {
      var _this = this;
      this.form.on('submit', this.onSubmit.bind(_this));
    },

    onSubmit: function(event) {
      event.preventDefault();

      var data = JSON.stringify(
        {
          name: 'Jane Doe',
          amount: '10.00',
          accountNumber: this.accountNumber.val(),
          institutionNumber: this.institutionNumber.val(),
          transitNumber: this.transitNumber.val()
        },
        undefined,
        2
      );

      this.authorizeTransfer(data);

      this.spinner.fadeIn('fast');
    },

    authorizeTransfer: function(data) {
      var _this = this;

      var xhr = new XMLHttpRequest();
      var method = 'POST';
      var url = '/payment/funds-transfer';

      xhr.open(method, url, true);
      xhr.onreadystatechange = function() {
        if (xhr.readyState === XMLHttpRequest.DONE) {
          var feedback = {
            success: false,
            message: 'Error. Unable to complete transaction.'
          };

          if (xhr.status === 200) {
            var response = JSON.parse(xhr.responseText);

            if (response.success) {
              feedback = {
                success: true,
                id: response.batch_id + '-' + response.trans_id
              };
            }
          }

          this.updateFeedback(feedback);
        }
      }.bind(_this);

      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(data);
    },

    updateFeedback: function(feedback) {
      if (feedback.success) {
        this.responsePanelSuccess.find('#response-id').text(feedback.id);
        this.responsePanelSuccess.slideDown('fast');
        this.responsePanelFail.slideUp('fast');
      } else {
        this.responsePanelFail.find('#response-error-message').text(feedback.message);
        this.responsePanelFail.slideDown('fast');
        this.responsePanelSuccess.slideUp('fast');
      }

      $('html, body').animate({ scrollTop: 0 }, 'slow');
      this.spinner.fadeOut('fast');
    }
  };

  fundsTransferCtrl.init();
})();
