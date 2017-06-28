package com.bambora.na.androidpay.demo;

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


import android.app.Activity;
import android.content.Intent;
import android.support.annotation.NonNull;
import android.support.v4.app.FragmentTransaction;
import android.support.v4.content.ContextCompat;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.Toast;

import com.google.android.gms.common.ConnectionResult;
import com.google.android.gms.common.api.BooleanResult;
import com.google.android.gms.common.api.GoogleApiClient;
import com.google.android.gms.common.api.ResultCallback;
import com.google.android.gms.wallet.FullWallet;
import com.google.android.gms.wallet.FullWalletRequest;
import com.google.android.gms.wallet.IsReadyToPayRequest;
import com.google.android.gms.wallet.MaskedWallet;
import com.google.android.gms.wallet.MaskedWalletRequest;
import com.google.android.gms.wallet.PaymentMethodToken;
import com.google.android.gms.wallet.Wallet;
import com.google.android.gms.wallet.WalletConstants;
import com.google.android.gms.wallet.fragment.SupportWalletFragment;
import com.google.android.gms.wallet.fragment.WalletFragmentInitParams;
import com.google.android.gms.wallet.fragment.WalletFragmentMode;
import com.google.android.gms.wallet.fragment.WalletFragmentOptions;
import com.google.android.gms.wallet.fragment.WalletFragmentStyle;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;

import com.bambora.na.androidpay.demo.helpers.PaymentHelper;
import com.bambora.na.androidpay.demo.helpers.WalletUtil;
import com.bambora.na.androidpay.demo.model.PaymentRequest;
import com.bambora.na.androidpay.demo.model.PaymentResponse;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * This activity showcases how to handle all the Android Pay specific required calls and UI flows
 * <p>
 * To keep the Android Pay flow as concise and easy to follow as possible, all the non Android Pay UI code has been
 * moved into the {@link BaseActivity}
 */
public class MainActivity extends BaseActivity implements GoogleApiClient.OnConnectionFailedListener {
    private static final String TAG = "MainActivity";

    private static final int REQUEST_CODE_MASKED_WALLET = 1001;
    private static final int REQUEST_CODE_CHANGE_MASKED_WALLET = 1002;
    private static final int REQUEST_CODE_RESOLVE_LOAD_FULL_WALLET = 1004;

    private final String SAVED_STATE_MASKED_WALLET = "maskedWallet";
    private final String SAVED_STATE_ANDROID_PAY_AVAILABLE = "androidPayAvailable";

    private GoogleApiClient googleApiClient;
    private MaskedWallet maskedWallet;

    private boolean androidPayAvailable = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        //Step 1: Create the Google API Client
        googleApiClient = new GoogleApiClient.Builder(this)
                .addApi(Wallet.API, new Wallet.WalletOptions.Builder()
                        .setEnvironment(Constants.WALLET_ENVIRONMENT)
                        .build())
                .enableAutoManage(this, this)
                .build();

        buyButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                //Step 5: Request the full wallet once they confirm the purchase
                confirmPurchase();
            }
        });

        if (savedInstanceState == null) {
            //Step 2: Check if Android Pay is available
            checkIfAndroidPayIsAvailable();
        } else {
            //Restore the current state of app
            androidPayAvailable = savedInstanceState.getBoolean(SAVED_STATE_ANDROID_PAY_AVAILABLE, false);
            maskedWallet = savedInstanceState.getParcelable(SAVED_STATE_MASKED_WALLET);

            //Restoring the state of the button if Android pay is still available
            if (androidPayAvailable) {
                if (itemsToPurchase.size() > 0 && maskedWallet == null) {
                    showAndroidPayButton();
                } else if (itemsToPurchase.size() > 0 && maskedWallet != null) {
                    disableListView();
                    showConfirmPurchaseButton();
                } else {
                    showNoButtonsOrProgress();
                }
            } else {
                checkIfAndroidPayIsAvailable();
            }
        }
    }

    @Override
    public void onResume() {
        super.onResume();

        /*
        Running this in onResume since the  Wallet.Payments.isReadyToPay does not return if the screen is turned off
        This resulted in the app not functioning when pushing a build while the screen was off
        */

        checkIfAndroidPayIsAvailable();
    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent data) {
        // retrieve the error code, if available
        int errorCode = -1;
        if (data != null) {
            errorCode = data.getIntExtra(WalletConstants.EXTRA_ERROR_CODE, -1);
        }
        switch (requestCode) {
            case REQUEST_CODE_MASKED_WALLET:
                //Step 4: Show the masked wallet details after they click the Android Pay button
                handleRequestCodeMaskedWallet(resultCode, data, errorCode);
                break;

            case REQUEST_CODE_CHANGE_MASKED_WALLET:
                //Step 4.5: Update the masked wallet details if they change their selection
                if (resultCode == Activity.RESULT_OK && data != null && data.hasExtra(WalletConstants.EXTRA_MASKED_WALLET)) {
                    maskedWallet = data.getParcelableExtra(WalletConstants.EXTRA_MASKED_WALLET);
                }
                break;

            case REQUEST_CODE_RESOLVE_LOAD_FULL_WALLET:
                //Step 6: Process the full wallet response
                handleRequestCodeResolveLoadFullWallet(resultCode, data);
                break;

            case WalletConstants.RESULT_ERROR:
                Log.d(TAG, "onActivityResult:RESULT_ERROR:");
                handleError(errorCode);
                break;

            default:
                super.onActivityResult(requestCode, resultCode, data);
                break;
        }
    }

    private void checkIfAndroidPayIsAvailable() {

        if (!androidPayAvailable) {

            /*
            Use this to specify the card types you would like to accept

            IsReadyToPayRequest isReadyToPayRequest = IsReadyToPayRequest.newBuilder()
            .addAllowedCardNetwork(PaymentInstrumentType.AMEX)
            .addAllowedCardNetwork(PaymentInstrumentType.MASTER_CARD)
            .addAllowedCardNetwork(PaymentInstrumentType.VISA)
            .build();
            */

            IsReadyToPayRequest isReadyToPayRequest = IsReadyToPayRequest.newBuilder().build();

            Wallet.Payments.isReadyToPay(googleApiClient, isReadyToPayRequest).setResultCallback(
                    new ResultCallback<BooleanResult>() {
                        @Override
                        public void onResult(@NonNull BooleanResult booleanResult) {
                            if (booleanResult.getStatus().isSuccess()) {
                                if (booleanResult.getValue()) {
                                    Log.d(TAG, "isReadyToPay:true");
                                    androidPayAvailable = true;
                                    progressBar.setVisibility(View.INVISIBLE);

                                    //Step 3: Load the Android Pay Wallet Buy Button
                                    loadWalletBuyButton();
                                } else {
                                    Log.d(TAG, "isReadyToPay:false:" + booleanResult.getStatus());
                                    showAndroidPayUnavailable();
                                }
                            } else {
                                // Error making isReadyToPay call
                                showAndroidPayUnavailable();
                                Log.e(TAG, "isReadyToPay:" + booleanResult.getStatus());
                            }
                        }
                    });
        }
    }

    private void loadWalletBuyButton() {
        //Define the style for the buy button
        WalletFragmentStyle walletFragmentStyle = new WalletFragmentStyle()
                .setBuyButtonText(WalletFragmentStyle.BuyButtonText.BUY_WITH)
                .setBuyButtonAppearance(WalletFragmentStyle.BuyButtonAppearance.ANDROID_PAY_DARK)
                .setBuyButtonWidth(WalletFragmentStyle.Dimension.MATCH_PARENT)
                .setBuyButtonHeight((int) getResources().getDimension(R.dimen.button_height_android_pay));

        //Set up the wallet options
        WalletFragmentOptions walletFragmentOptions = WalletFragmentOptions.newBuilder()
                .setEnvironment(Constants.WALLET_ENVIRONMENT)
                .setFragmentStyle(walletFragmentStyle)
                .setTheme(WalletConstants.THEME_LIGHT)
                .setMode(WalletFragmentMode.BUY_BUTTON)
                .build();

        SupportWalletFragment walletFragment = SupportWalletFragment.newInstance(walletFragmentOptions);

        MaskedWalletRequest maskedWalletRequest = WalletUtil.createMaskedWalletRequest(
                itemsToPurchase,
                getString(R.string.public_key));

        WalletFragmentInitParams.Builder startParamsBuilder = WalletFragmentInitParams.newBuilder()
                .setMaskedWalletRequest(maskedWalletRequest)
                .setMaskedWalletRequestCode(REQUEST_CODE_MASKED_WALLET);

        walletFragment.initialize(startParamsBuilder.build());

        getSupportFragmentManager().beginTransaction()
                .replace(R.id.android_pay_container, walletFragment)
                .commit();

    }

    private void confirmPurchase() {
        showProgressBar();
        requestFullWallet();
    }

    private void requestFullWallet() {
        FullWalletRequest fullWalletRequest = WalletUtil.createFullWalletRequest(itemsToPurchase,
                maskedWallet.getGoogleTransactionId());

        Wallet.Payments.loadFullWallet(googleApiClient, fullWalletRequest,
                REQUEST_CODE_RESOLVE_LOAD_FULL_WALLET);
    }

    private void showPaymentSelectionDetails() {
        //Disable the list view once the android pay flow has begun
        disableListView();

        //Define the style for the wallet details
        WalletFragmentStyle walletFragmentStyle = new WalletFragmentStyle()
                .setMaskedWalletDetailsBackgroundColor(ContextCompat.getColor(MainActivity.this, R.color.bambora_purple))
                .setMaskedWalletDetailsButtonBackgroundColor(ContextCompat.getColor(MainActivity.this, R.color.dark_button))
                .setMaskedWalletDetailsButtonTextAppearance(ContextCompat.getColor(MainActivity.this, R.color.light_text));

        //Set up the wallet options
        WalletFragmentOptions walletFragmentOptions = WalletFragmentOptions.newBuilder()
                .setEnvironment(Constants.WALLET_ENVIRONMENT)
                .setTheme(WalletConstants.THEME_LIGHT)
                .setMode(WalletFragmentMode.SELECTION_DETAILS)
                .setFragmentStyle(walletFragmentStyle)
                .build();

        SupportWalletFragment walletFragment = SupportWalletFragment.newInstance(walletFragmentOptions);

        // Now initialize the Wallet Fragment
        WalletFragmentInitParams.Builder startParamsBuilder = WalletFragmentInitParams.newBuilder()
                .setMaskedWallet(maskedWallet)
                .setMaskedWalletRequestCode(REQUEST_CODE_CHANGE_MASKED_WALLET);

        walletFragment.initialize(startParamsBuilder.build());

        //Animate the wallet details into view
        FragmentTransaction fragmentTransaction = getSupportFragmentManager().beginTransaction();
        fragmentTransaction.setCustomAnimations(R.anim.enter_from_top, R.anim.exit_to_top);
        fragmentTransaction.replace(R.id.android_pay_card_details, walletFragment);
        fragmentTransaction.commit();
    }

    private void handleRequestCodeMaskedWallet(int resultCode, Intent data, int errorCode) {
        switch (resultCode) {
            case Activity.RESULT_OK:
                if (data != null) {
                    Log.d(TAG, "onActivityResult:RESULT_OK:");
                    maskedWallet = data.getParcelableExtra(WalletConstants.EXTRA_MASKED_WALLET);
                    showConfirmPurchaseButton();
                    showPaymentSelectionDetails();
                }
                break;

            case Activity.RESULT_CANCELED:
                break;

            default:
                Log.d(TAG, "onActivityResult:DEFAULT:");
                handleError(errorCode);
                break;
        }
    }

    private void handleRequestCodeResolveLoadFullWallet(int resultCode, Intent data) {

        switch (resultCode) {
            case Activity.RESULT_OK:
                if (data != null && data.hasExtra(WalletConstants.EXTRA_FULL_WALLET)) {
                    FullWallet fullWallet = data.getParcelableExtra(WalletConstants.EXTRA_FULL_WALLET);
                    //Step 7 - Process the payment against the payment server.
                    fetchTransactionStatus(fullWallet);
                } else if (data != null && data.hasExtra(WalletConstants.EXTRA_MASKED_WALLET)) {

                    //Update the masked wallet details
                    //NOTE: Have not found a scenario where this would trigger, but the condition was in Googles sample app
                    maskedWallet = data.getParcelableExtra(WalletConstants.EXTRA_MASKED_WALLET);
                    showPaymentSelectionDetails();
                    showConfirmPurchaseButton();
                }
                break;

            default:
                Toast.makeText(MainActivity.this, "Could not get full wallet", Toast.LENGTH_LONG).show();
                showConfirmPurchaseButton();
                break;
        }
    }

    private void fetchTransactionStatus(FullWallet fullWallet) {
        PaymentMethodToken token = fullWallet.getPaymentMethodToken();
        if (token != null) {
            Log.d(TAG, "PaymentMethodToken:" + token.getToken().replace('\n', ' '));
            processPayment(createPaymentRequest(fullWallet));
        } else {
            Log.d(TAG, "PaymentMethodToken: null");
            Toast.makeText(MainActivity.this, "Token null, transaction cancelled.", Toast.LENGTH_LONG).show();
            resetTransaction();
        }
    }

    private PaymentRequest createPaymentRequest(FullWallet fullWallet) {
        String transactionType = radioGroup.getCheckedRadioButtonId() == R.id.radio_purchase ? "purchase" : "pre-auth";
        String encodedToken = WalletUtil.getEncodedPaymentToken(fullWallet);
        return new PaymentRequest(transactionType, getSaleTotalString(), encodedToken, fullWallet.getEmail());
    }

    /**
     * This method is where the actual payment processing happens.
     *
     * @param request payment request to be sent to the flask server
     */
    private void processPayment(PaymentRequest request) {

        PaymentHelper.PaymentService service = PaymentHelper.getPaymentService();
        service.processPayment(request).enqueue(new Callback<PaymentResponse>() {
            @Override
            public void onResponse(Call<PaymentResponse> call, Response<PaymentResponse> response) {
                if (response.body() != null) {
                    String msg = response.body().getPaymentStatus();
                    if (msg == null) {
                        msg = response.message();
                    }
                    Toast.makeText(MainActivity.this, msg, Toast.LENGTH_LONG).show();
                } else {
                    try {
                        JSONObject error = new JSONObject(response.errorBody().string());
                        Toast.makeText(MainActivity.this, "Error:" + error.getString("error") + "\n" + error.getString("message"), Toast.LENGTH_LONG).show();
                    } catch (JSONException | IOException e) {
                        e.printStackTrace();
                    }
                }
                resetTransaction();
            }

            @Override
            public void onFailure(Call<PaymentResponse> call, Throwable t) {
                Toast.makeText(MainActivity.this, t.getLocalizedMessage(), Toast.LENGTH_LONG).show();
                resetTransaction();
            }
        });
    }

    @Override
    public void resetTransaction() {
        maskedWallet = null;
        super.resetTransaction();
    }

    protected void handleError(int errorCode) {
        switch (errorCode) {
            case WalletConstants.ERROR_CODE_SPENDING_LIMIT_EXCEEDED:
                Toast.makeText(this, "Exceeded Spending Limit", Toast.LENGTH_LONG).show();
                break;
            case WalletConstants.ERROR_CODE_INVALID_PARAMETERS:
            case WalletConstants.ERROR_CODE_AUTHENTICATION_FAILURE:
            case WalletConstants.ERROR_CODE_BUYER_ACCOUNT_ERROR:
            case WalletConstants.ERROR_CODE_MERCHANT_ACCOUNT_ERROR:
            case WalletConstants.ERROR_CODE_SERVICE_UNAVAILABLE:
            case WalletConstants.ERROR_CODE_UNSUPPORTED_API_VERSION:
            case WalletConstants.ERROR_CODE_UNKNOWN:
            default:
                // unrecoverable error
                String errorMessage = "Google wallet Unavailable error:" + "\n" + errorCode;
                Toast.makeText(this, errorMessage, Toast.LENGTH_LONG).show();
                break;
        }
    }

    @Override
    public void onConnectionFailed(@NonNull ConnectionResult connectionResult) {
        Log.e(TAG, "onConnectionFailed:" + connectionResult.getErrorMessage());
        Toast.makeText(this, "Google Play Services error", Toast.LENGTH_SHORT).show();
    }

    @Override
    public void onBackPressed() {
        SupportWalletFragment mWalletFragment = (SupportWalletFragment) getSupportFragmentManager().findFragmentById(R.id.android_pay_card_details);
        if (mWalletFragment != null) {
            resetTransaction();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    public void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        outState.putParcelable(SAVED_STATE_MASKED_WALLET, maskedWallet);
        outState.putBoolean(SAVED_STATE_ANDROID_PAY_AVAILABLE, androidPayAvailable);
    }
}
