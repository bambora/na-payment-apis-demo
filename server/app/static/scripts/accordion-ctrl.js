/*
 * Copyright (c) 2017 - Bambora Inc. <http://dev.na.bambora.com>
 * MIT licensed. Feel free to use and abuse.
 */

(function() {
  'use strict';
  var accordionController = {
    init: function() {
      this.cacheDom();
      this.addListeners();
    },

    cacheDom: function() {
      var panels = $('#payment-panels');
      this.expandableBlocks = panels.find('.message-content');
      this.radios = panels.find('input:radio');
    },

    addListeners: function() {
      var _this = this;
      $('.message-title').on('click', this.slide.bind(_this));
    },

    slide: function(event) {
      var panel = $(event.target).parents('.message');
      var panelContent = panel.find('.message-content');
      var radio = panel.find('input:radio')[0];

      if (panelContent.is(':visible')) {
        // close current panel if expanded
        panelContent.slideUp('fast');
        radio.checked = false;
      } else {
        // collapse any open panels and expanded current panel
        for (var i = 0; i < this.radios.length; i++) {
          this.radios[i].checked = false;
        }
        radio.checked = true;

        this.expandableBlocks.slideUp('fast');
        panelContent.slideDown('fast');
      }

      // prevent event from propagating to radio button
      return false;
    }
  };

  accordionController.init();
})();
