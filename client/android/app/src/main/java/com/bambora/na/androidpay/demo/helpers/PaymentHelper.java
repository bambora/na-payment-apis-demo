package com.bambora.na.androidpay.demo.helpers;

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

import com.bambora.na.androidpay.demo.model.PaymentRequest;
import com.bambora.na.androidpay.demo.model.PaymentResponse;
import okhttp3.OkHttpClient;
import okhttp3.logging.HttpLoggingInterceptor;
import retrofit2.Call;
import retrofit2.Retrofit;
import retrofit2.converter.moshi.MoshiConverterFactory;
import retrofit2.http.Body;
import retrofit2.http.POST;

/**
 * Created on 16/05/2017.
 */

public class PaymentHelper {

    // For a sample Payment APIs Server implementation check out:
    // https://github.com/bambora/na-payment-apis-demo
    private static String baseURL = "https://your.payment.server.com";

    public interface PaymentService {
        @POST("/payment/mobile/process/android-pay")
        Call<PaymentResponse> processPayment(@Body PaymentRequest request);
    }

    public static PaymentService getPaymentService() {
        HttpLoggingInterceptor interceptor = new HttpLoggingInterceptor();
        interceptor.setLevel(HttpLoggingInterceptor.Level.BODY);
        OkHttpClient client = new OkHttpClient.Builder().addInterceptor(interceptor).build();

        Retrofit retrofit = new Retrofit.Builder()
                .client(client)
                .baseUrl(baseURL)
                .addConverterFactory(MoshiConverterFactory.create())
                .build();

        return retrofit.create(PaymentService.class);
    }
}
