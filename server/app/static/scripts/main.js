(function (window) {
  'use strict';

  $(document).ready(function () {
    $('#page-wrapper').removeClass('page-loading');
    $('#spinner-overlay').hide();
  });

  /*
  // workaround to hide Custom Checkout load glitch in UI
  $('iframe[name="bambora-card-number-iframe"]').ready(function () {

    $('iframe[name="bambora-card-number-iframe"]').on("load",function () {

     setTimeout(function (){
       $('#page-wrapper').removeClass('page-loading');
       $('#spinner-overlay').fadeOut('fast');
     }, 100);
    });
  });
  */

})(window);
