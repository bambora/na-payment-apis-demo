(function() {
  // Tab controls
  var cardBlock = document.getElementById('card-block');
  var interacBlock = document.getElementById('interac-block');
  var cardTag = document.getElementById('card-tag');
  var interacTag = document.getElementById('interac-tag');

  function setPaymentMethod() {
    cardBlock.classList.toggle('visible');
    interacBlock.classList.toggle('visible');
    cardTag.classList.toggle('active');
    interacTag.classList.toggle('active');
  }

  if (document.addEventListener) {
    cardTag.addEventListener('click', setPaymentMethod);
    interacTag.addEventListener('click', setPaymentMethod);
  } else if (document.attachEvent) {
    cardTag.attachEvent('onclick', setPaymentMethod);
    interacTag.attachEvent('onclick', setPaymentMethod);
  }
})();

(function() {
  // Pre-populate invoice value
  function makeUniqueInvoiceId() {
    console.log('makeUniqueInvoiceId');
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < 32; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
  }

  document.getElementById('invoice').value = makeUniqueInvoiceId();
})();

(function() {
  // Payfields logic
  var number;
  var expiry;
  var cvv;
  var processingScreen = document.getElementById('processing-screen');

  if (document.addEventListener) {
    document.addEventListener('beanstream_payfields_loaded', onFieldsInjected);
    document.addEventListener('beanstream_payfields_tokenRequested', onTokenRequested);
    document.addEventListener('beanstream_payfields_tokenUpdated', onTokenUpdated);
    document.addEventListener('beanstream_payfields_inputValidityChanged', onValidityChanged);
    document.getElementById('cardPaymentForm').addEventListener('submit', preventDefault);
  } else if (document.attachEvent) {
    document.attachEvent('beanstream_payfields_loaded', onFieldsInjected);
    document.attachEvent('beanstream_payfields_tokenRequested', onTokenRequested);
    document.attachEvent('beanstream_payfields_tokenUpdated', onTokenUpdated);
    document.attachEvent('beanstream_payfields_inputValidityChanged', onValidityChanged);
    document.getElementById('cardPaymentForm').attachEvent('onSubmit', preventDefault);
  }

  function preventDefault(e) {
    e.preventDefault();
  }

  function onFieldsInjected() {
    console.log('onFieldsInjected');
    number = document.querySelector("[data-beanstream-id='ccNumber']");
    expiry = document.querySelector("[data-beanstream-id='ccExp']");
    cvv = document.querySelector("[data-beanstream-id='ccCvv']");
  }

  function onValidityChanged(e) {
    switch (e.eventDetail.fieldType) {
      case 'number':
        if (e.eventDetail.isValid) {
          number.classList.remove('invalid');
        } else {
          number.classList.add('invalid');
        }
        break;
      case 'expiry':
        if (e.eventDetail.isValid) {
          expiry.classList.remove('invalid');
        } else {
          expiry.classList.add('invalid');
        }
        break;
      case 'cvv':
        if (e.eventDetail.isValid) {
          cvv.classList.remove('invalid');
        } else {
          cvv.classList.add('invalid');
        }
        break;
      default:
        break;
    }

  }

  function onTokenRequested() {
    console.log('onTokenRequested');
    processingScreen.classList.toggle('visible');
  }

  function onTokenUpdated(e) {
    console.log('onTokenUpdated');

    if(e.eventDetail.success){
      makeTokenPayment(e.eventDetail.token);
    } else {
      var success_feedback = document.getElementById('success_feedback');
      var error_feedback = document.getElementById('error_feedback');
      var message = error_feedback.getElementsByClassName('error_message')[0];
      message.innerHTML = e.eventDetail.message;
      success_feedback.classList.remove('visible');
      error_feedback.classList.add('visible');
      processingScreen.classList.toggle('visible');
    }
  }

  function makeTokenPayment(token) {
    console.log('makeTokenPayment');

    var invoice = document.getElementById('invoice').value;
    var amount = document.getElementById('amount').value;
    var name = document.getElementById('name').value;

    var xhr = new XMLHttpRequest();
    var method = "POST";
    //var url = "/payment/token";
    var url  = "/payment/3d_secure/token"
    var data = JSON.stringify({
      "order_number":invoice,
      "name":name,
      "amount":amount,
      "token":token
    });

    xhr.open(method, url, true);
    xhr.onreadystatechange = function () {
      if(xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
        var success_feedback = document.getElementById('success_feedback');
        var error_feedback = document.getElementById('error_feedback');
        var invoice = success_feedback.getElementsByClassName('invoice')[0];
        var transaction = success_feedback.getElementsByClassName('transaction')[0];
        invoice.innerHTML = JSON.parse(xhr.responseText).order_number;
        transaction.innerHTML = JSON.parse(xhr.responseText).id;
        error_feedback.classList.remove('visible');
        success_feedback.classList.add('visible');
        processingScreen.classList.toggle('visible');

      } else if (xhr.readyState === XMLHttpRequest.DONE) {
        var success_feedback = document.getElementById('success_feedback');
        var error_feedback = document.getElementById('error_feedback');
        var message = error_feedback.getElementsByClassName('error_message')[0];
        message.innerHTML = JSON.parse(xhr.responseText).message;
        success_feedback.classList.remove('visible');
        error_feedback.classList.add('visible');
        processingScreen.classList.toggle('visible');
      }
    };
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(data);
  }

})();

(function() {
  // Interac logic
  var processingScreen = document.getElementById('processing-screen');

  if (document.addEventListener) {
    document.getElementById('interacPaymentForm').addEventListener('submit', onSubmit);
  } else if (document.attachEvent) {
    document.getElementById('interacPaymentForm').attachEvent('onSubmit', onSubmit);
  }

  function onSubmit(e) {
    console.log('onSubmit');
    e.preventDefault();
    makeInteracPayment();
  }

  function makeInteracPayment() {
    console.log('makeInteracPayment');
    processingScreen.classList.toggle('visible');

    var invoice = document.getElementById('invoice').value;
    var amount = document.getElementById('amount').value;

    var xhr = new XMLHttpRequest();
    var method = "POST";
    var url = "/payment/interac";
    var data = JSON.stringify({
      "order_number":invoice,
      "amount":amount
    });

    xhr.open(method, url, true);
    xhr.onreadystatechange = function () {
      if(xhr.readyState === XMLHttpRequest.DONE && xhr.status === 302) {
        var contents = JSON.parse(xhr.responseText).contents;
        var contents_decoded = decodeURIComponent(contents.replace(/\+/g, '%20'));
        var formStr = contents_decoded.match("<FORM(.*)<\/FORM>");

        document.body.insertAdjacentHTML('afterbegin', formStr);
        document.frmIOnline.submit();

      } else if (xhr.readyState === XMLHttpRequest.DONE) {
        console.log('xhr.status: ', xhr.status);
        console.log('JSON.parse(xhr.responseText): ', JSON.parse(xhr.responseText));
        var success_feedback = document.getElementById('success_feedback');
        var error_feedback = document.getElementById('error_feedback');
        var message = error_feedback.getElementsByClassName('error_message')[0];
        message.innerHTML = JSON.parse(xhr.responseText).message;
        success_feedback.classList.remove('visible');
        error_feedback.classList.add('visible');
        processingScreen.classList.toggle('visible');
      }
    };
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(data);

  }

})();
