(function() {
  var tabController = {
    init: function(){
      console.log('tabController.init()');
      this.cacheDom();
      this.addListeners();
    },
    cacheDom: function(){
      console.log('tabController.cacheDom()');
      this.cardBlock = document.getElementById('card-block');
      this.interacBlock = document.getElementById('interac-block');
      this.cardTag = document.getElementById('card-tag');
      this.interacTag = document.getElementById('interac-tag');
    },
    addListeners: function(){
      console.log('tabController.addListeners()');
      this.cardTag.addEventListener('click', this.setPaymentMethod.bind(this));
      this.interacTag.addEventListener('click', this.setPaymentMethod.bind(this));
    },
    setPaymentMethod: function(){
      console.log('tabController.setPaymentMethod()');
      this.cardBlock.classList.toggle('visible');
      this.interacBlock.classList.toggle('visible');
      this.cardTag.classList.toggle('active');
      this.interacTag.classList.toggle('active');
    }
  };
  tabController.init();
})();

(function() {
  // Pre-populate fields
  document.getElementById('amount').value = 100;
  document.getElementById('name').value = 'Jane Doe';
})();

(function() {
  var cardFormController = {
    init: function(){
      console.log('cardFormController.init()');
      this.cacheDom();
      this.addListeners();
      this.getPaymentType();
    },
    cacheDom: function(){
      console.log('cardFormController.cacheDom()');
      this.cardPaymentForm = document.getElementById('cardPaymentForm');
      this.processingScreen = document.getElementById('processing-screen');
      this.success_feedback = document.getElementById('success_feedback');
      this.error_feedback = document.getElementById('error_feedback');
      this.message = error_feedback.getElementsByClassName('error_message')[0];
      this.invoice = this.success_feedback.getElementsByClassName('invoice')[0];
      this.transaction = this.success_feedback.getElementsByClassName('transaction')[0];

    },
    addListeners: function(){
      console.log('cardFormController.addListeners()');
      document.addEventListener('beanstream_payfields_loaded', this.onFieldsInjected.bind(this));
      document.addEventListener('beanstream_payfields_tokenRequested', this.onTokenRequested.bind(this));
      document.addEventListener('beanstream_payfields_tokenUpdated', this.onTokenUpdated.bind(this));
      document.addEventListener('beanstream_payfields_inputValidityChanged', this.onValidityChanged.bind(this));
      this.cardPaymentForm.addEventListener('submit', function preventDefault(e){e.preventDefault();});

    },
    onFieldsInjected: function(){
      console.log('cardFormController.onFieldsInjected()');
      this.number = document.querySelector("[data-beanstream-id='ccNumber']");
      this.expiry = document.querySelector("[data-beanstream-id='ccExp']");
      this.cvv = document.querySelector("[data-beanstream-id='ccCvv']");

    },
    onTokenRequested: function(){
      console.log('cardFormController.onTokenRequested()');
      this.processingScreen.classList.toggle('visible');

    },
    onTokenUpdated: function(e){
      console.log('cardFormController.onTokenUpdated()');
      if(e.eventDetail.success){
        this.makeTokenPayment(e.eventDetail.token);
      } else {
        this.message.innerHTML = e.eventDetail.message;
        this.success_feedback.classList.remove('visible');
        this.error_feedback.classList.add('visible');
        this.processingScreen.classList.toggle('visible');
      }

    },
    onValidityChanged: function(e){
      console.log('cardFormController.onValidityChanged()');
      switch (e.eventDetail.fieldType) {
        case 'number':
          if (e.eventDetail.isValid) {
            this.number.classList.remove('invalid');
          } else {
            this.number.classList.add('invalid');
          }
          break;
        case 'expiry':
          if (e.eventDetail.isValid) {
            this.expiry.classList.remove('invalid');
          } else {
            this.expiry.classList.add('invalid');
          }
          break;
        case 'cvv':
          if (e.eventDetail.isValid) {
            this.cvv.classList.remove('invalid');
          } else {
            this.cvv.classList.add('invalid');
          }
          break;
        default:
          break;
      }
    },
    makeTokenPayment: function(token) {
      console.log('cardFormController.makeTokenPayment()');
      var amount = document.getElementById('amount').value;
      var name = document.getElementById('name').value;

      var xhr = new XMLHttpRequest();
      var method = "POST";
      //var url = "/payment/token";
      var url  = "/payment/3d_secure/token"
      var data = JSON.stringify({
        "name":name,
        "amount":amount,
        "token":token
      });

      xhr.open(method, url, true);
      xhr.onreadystatechange = function () {

        if(xhr.readyState === XMLHttpRequest.DONE && xhr.status === 302) {
          var contents = JSON.parse(xhr.responseText).contents;
          var contents_decoded = decodeURIComponent(contents.replace(/\+/g, '%20'));
          var formStr = contents_decoded.match("<FORM(.*)<\/FORM>");
          document.body.insertAdjacentHTML('afterbegin', formStr);
          document.form1.submit();

        } else if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
          this.invoice.innerHTML = JSON.parse(xhr.responseText).order_number;
          this.transaction.innerHTML = JSON.parse(xhr.responseText).id;
          this.error_feedback.classList.remove('visible');
          this.success_feedback.classList.add('visible');
          this.processingScreen.classList.toggle('visible');

        } else if (xhr.readyState === XMLHttpRequest.DONE) {
          this.message.innerHTML = JSON.parse(xhr.responseText).message;
          this.success_feedback.classList.remove('visible');
          this.error_feedback.classList.add('visible');
          this.processingScreen.classList.toggle('visible');

        }
      }.bind(this);

      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.send(data);
    },
    getPaymentType: function(){
      console.log('cardFormController.getPaymentType()');
      this.paymentType = window.location.href.substr(window.location.href.lastIndexOf('/') + 1);

      // NOTE: We can use the url to determin which payment method to use
      // We put a payment type on different pages - at a minimum we need different pages for Payfields, Hosted Checkout and vanilla payments
    }
  };

  cardFormController.init();
})();

(function() {
  var interacFormController = {
    init: function(){
      console.log('interacFormController.init()');
      this.cacheDom();
      this.addListeners();
    },
    cacheDom: function(){
      console.log('interacFormController.cacheDom()');
      this.processingScreen = document.getElementById('processing-screen');
      this.success_feedback = document.getElementById('success_feedback');
      this.error_feedback = document.getElementById('error_feedback');
      this.message = error_feedback.getElementsByClassName('error_message')[0];

    },
    addListeners: function(){
      console.log('interacFormController.addListeners()');
      document.getElementById('interacPaymentForm').addEventListener('submit', this.onSubmit.bind(this));

    },
    onSubmit: function(e){
      console.log('interacFormController.onSubmit()');
      e.preventDefault();
      this.makeInteracPayment();

    },
    makeInteracPayment: function(e){
      console.log('interacFormController.makeInteracPayment()');
      this.processingScreen.classList.toggle('visible');
      var amount = document.getElementById('amount').value;

      var xhr = new XMLHttpRequest();
      var method = "POST";
      var url = "/payment/interac";
      var data = JSON.stringify({ "amount": amount });

      xhr.open(method, url, true);

      xhr.onreadystatechange = function () {
        if(xhr.readyState === XMLHttpRequest.DONE && xhr.status === 302) {
          var contents = JSON.parse(xhr.responseText).contents;
          var contents_decoded = decodeURIComponent(contents.replace(/\+/g, '%20'));
          var formStr = contents_decoded.match("<FORM(.*)<\/FORM>");
          document.body.insertAdjacentHTML('afterbegin', formStr);
          document.frmIOnline.submit();

        } else if (xhr.readyState === XMLHttpRequest.DONE) {
          this.message.innerHTML = JSON.parse(xhr.responseText).message;
          this.success_feedback.classList.remove('visible');
          this.error_feedback.classList.add('visible');
          this.processingScreen.classList.toggle('visible');

        }
      }.bind(this);

      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.send(data);
    }
  };

  interacFormController.init();
})();
