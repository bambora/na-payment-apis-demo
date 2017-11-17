/*
 * Copyright (c) 2017 - Bambora Inc. <http://dev.na.bambora.com>
 * MIT licensed. Feel free to use and abuse.
 */

 (function() {
   'use strict';
   var checkoutController = {
     init: function() {
       this.addListeners();
       $('#page-wrapper').removeClass('page-loading');
       $('#spinner-overlay').fadeOut('fast');
     },
     addListeners: function() {
       if (document.getElementById('form-checkout') !== null) {
         document
           .getElementById('form-checkout')
           .addEventListener('submit', this.onSubmit.bind(this));
       }
     },
     onSubmit: function(event) {
       event.preventDefault();
       $('#spinner-overlay').fadeIn('fast');
       this.processOrder();
     },
     toggleProcessingScreen: function() {
       var processingScreen = document.getElementById('processing-screen');
       if (processingScreen) {
         processingScreen.classList.toggle('visible');
       }
     },
     processOrder: function() {
       var amount = '10.00';
       var name = document.getElementById('checkout-name').value;
       var postal = document.getElementById('checkout-postal-code').value;

       var xhr = new XMLHttpRequest();
       var method = 'POST';
       var url = '/checkout/redirect';

       var data = JSON.stringify(
         {
           name: name,
           amount: amount,
           postal: postal
         },
         undefined,
         2
       );

       xhr.open(method, url, true);
       xhr.onreadystatechange = function() {
         if (xhr.readyState === XMLHttpRequest.DONE) {
           if (xhr.status === 200) {
             location = JSON.parse(xhr.responseText).redirect_url;
           }
         }
       }.bind(this);

       xhr.setRequestHeader('Content-Type', 'application/json');
       xhr.send(data);
     }
   };

   checkoutController.init();
 })();
