package com.bambora.na.androidpay.demo.model;

/*
 MIT License (MIT)
 Copyright (c) 2017 - Bambora Inc. <https://developer.na.bambora.com>

 Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
 documentation files (the "Software"), to deal in the Software without restriction, including without limitation
 the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
 to permit persons to whom the Software is furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all copies or substantial portions of
 the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
 THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 SOFTWARE.
 */

import com.squareup.moshi.Json;

/**
 * The request which will be sent to your server.
 * The request should be modified to match your servers requirements to process/record payments.
 */
public class PaymentRequest {

    private String amount;
    private String email;
    @Json(name = "payment-token")
    private String paymentToken;
    @Json(name = "transaction-type")
    private String transactionType;

    public PaymentRequest(String transactionType, String amount, String paymentToken, String email) {
        this.amount = amount;
        this.paymentToken = paymentToken;
        this.transactionType = transactionType;
        this.email = email;
    }
}
