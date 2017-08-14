/*
 * Copyright (c) 2017 - Bambora Inc. <http://dev.na.bambora.com>
 * MIT licensed. Feel free to use and abuse.
 */

(function() {
  'use strict';

  var interacFormController = {
    init: function() {
      this.cacheDom();
      this.addListeners();
    },

    cacheDom: function() {
      this.panels = $('.container').find('.message-content');
      this.form = $('#form-funds-transfer');
      this.spinner = $('#spinner-overlay');
      this.responsePanelSuccess = $('#response-panel-success');
      this.responsePanelFail = $('#response-panel-fail');
      this.responseId = this.responsePanelSuccess.find('#response-id');
      this.responseError = this.responsePanelFail.find('#response-error-message');
    },

    addListeners: function() {
      var _this = this;
      $('#form-interac').on('submit', this.onSubmit.bind(_this));

    },

    onSubmit: function(e) {
      e.preventDefault();
      var data = JSON.stringify({
        'amount': '10.00'
      });
      this.makePayment(data);
    },

    makePayment: function(data) {
      var _this = this;

      var xhr = new XMLHttpRequest();
      var method = 'POST';
      var url = '/payment/interac';

      xhr.open(method, url, true);
      xhr.onreadystatechange = function() {

        if (xhr.readyState === XMLHttpRequest.DONE) {
          var feedback = {
            success: false,
            message: 'Error. Unable to complete transaction.'
          };

          if (xhr.status === 302) {
            // this card card requirs 3D Secure authorization
            // we extract the form element (with ID form1) from the html response and append it ot the DOM
            // we then submit the form to redirect the user to the bank for authorization
            var contents = JSON.parse(xhr.responseText).contents;
            var contents_decoded = decodeURIComponent(
              contents.replace(/\+/g, '%20')
            );
            var formStr = contents_decoded.match('<FORM(.*)</FORM>')[0];
            document.body.insertAdjacentHTML('afterbegin', formStr);
            document.frmIOnline.submit();
          } else {
            var message = xhr.status + ': ' + JSON.parse(xhr.responseText).message;
            feedback = {success: false, message: message};
            this.updateFeedback(feedback);
          }
        }
      }.bind(_this);

      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(data);
    },

    updateFeedback: function(feedback) {
      this.responseError.text(feedback.message);
      this.responsePanelFail.slideDown('fast');
      this.responsePanelSuccess.slideUp('fast');

      $('html, body').animate({ scrollTop: 0 }, 'slow');
      this.spinner.fadeOut('fast');
    }
  };

  interacFormController.init();
})();
