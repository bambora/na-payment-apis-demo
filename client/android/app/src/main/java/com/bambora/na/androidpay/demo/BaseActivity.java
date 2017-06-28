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

import android.graphics.PorterDuff;
import android.os.Bundle;
import android.support.v4.content.ContextCompat;
import android.support.v7.app.AppCompatActivity;
import android.view.View;
import android.widget.AdapterView;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.ListView;
import android.widget.ProgressBar;
import android.widget.RadioGroup;
import android.widget.TextView;

import com.google.android.gms.wallet.fragment.SupportWalletFragment;

import com.squareup.moshi.JsonAdapter;
import com.squareup.moshi.Moshi;
import com.squareup.moshi.Types;

import java.io.IOException;
import java.lang.reflect.Type;
import java.util.ArrayList;
import java.util.List;

import com.bambora.na.androidpay.demo.helpers.WalletUtil;
import com.bambora.na.androidpay.demo.model.ItemInfo;

/**
 * This base activity does all the view binding, and manages all of the non Android Pay UI flows
 * <p>
 * It's been separated out into it's own class to avoid having code unrelated to Android Pay mixed
 * in with the code required to tie everything together.
 * <p>
 * For the Android Pay related code see {@link MainActivity}
 */
public class BaseActivity extends AppCompatActivity {

    private final String SAVED_STATE_ITEMS_TO_PURCHASE = "itemsToPurchase";

    ArrayList<ItemInfo> itemsToPurchase = new ArrayList<>();

    Button buyButton;
    FrameLayout androidPayContainer;
    ProgressBar progressBar;
    TextView androidPayUnavailable;
    TextView saleTotal;
    RadioGroup radioGroup;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        androidPayContainer = (FrameLayout) findViewById(R.id.android_pay_container);
        androidPayUnavailable = (TextView) findViewById(R.id.android_pay_unavailable);
        buyButton = (Button) findViewById(R.id.buy_button);
        progressBar = (ProgressBar) findViewById(R.id.progress_bar);
        saleTotal = (TextView) findViewById(R.id.sale_total);
        radioGroup = (RadioGroup) findViewById(R.id.radio_group);

        buyButton.getBackground().setColorFilter(ContextCompat.getColor(BaseActivity.this, R.color.dark_button), PorterDuff.Mode.MULTIPLY);

        if (savedInstanceState != null) {
            String jsonItems = savedInstanceState.getString(SAVED_STATE_ITEMS_TO_PURCHASE);
            if (jsonItems != null) {
                itemsToPurchase = jsonToItemsToPurchase(jsonItems);
            }
        }

        showNoButtons();
        setupItemsForSale();
    }

    public void setupItemsForSale() {
        final ArrayList<ItemInfo> itemsForSale = new ArrayList<>();

        itemsForSale.add(new ItemInfo("Green Bean", "A Special Bean", 10000000, 0, "CAD", "Some info", R.mipmap.ic_launcher));
        itemsForSale.add(new ItemInfo("Banana", "A Special Banana", 50000000, 0, "CAD", "Some info", R.mipmap.ic_launcher));

        ListView listView = (ListView) findViewById(R.id.list);
        listView.setEnabled(true);

        final ItemListAdapter adapter = new ItemListAdapter(BaseActivity.this, itemsForSale, itemsToPurchase);

        listView.setAdapter(adapter);

        listView.setOnItemClickListener(new AdapterView.OnItemClickListener() {
            @Override
            public void onItemClick(AdapterView<?> parent, View view, int position, long id) {
                //Don't show button until item in cart
                showAndroidPayButton();
                adapter.addItemToSale(position);
                updateSaleTotal();
            }
        });

        updateSaleTotal();
    }

    public long getSaleTotal() {
        long totalPrice = 0;

        for (ItemInfo item : itemsToPurchase) {
            totalPrice += item.getTotalPrice();
        }

        return totalPrice;
    }

    public String getSaleTotalString() {
        return WalletUtil.toDollars(getSaleTotal());
    }

    public void updateSaleTotal() {
        saleTotal.setText("Sale Total: $" + getSaleTotalString());
    }

    public void disableListView() {
        ListView listView = (ListView) findViewById(R.id.list);
        listView.setEnabled(false);
    }

    public void showAndroidPayUnavailable() {
        androidPayUnavailable.setVisibility(View.VISIBLE);
        progressBar.setVisibility(View.INVISIBLE);
    }

    public void showConfirmPurchaseButton() {
        buyButton.setVisibility(View.VISIBLE);
        androidPayContainer.setVisibility(View.GONE);
        progressBar.setVisibility(View.INVISIBLE);
    }

    public void showAndroidPayButton() {
        progressBar.setVisibility(View.INVISIBLE);
        buyButton.setVisibility(View.GONE);
        androidPayContainer.setVisibility(View.VISIBLE);
    }

    public void showNoButtonsOrProgress() {
        buyButton.setVisibility(View.GONE);
        androidPayContainer.setVisibility(View.GONE);
        progressBar.setVisibility(View.INVISIBLE);
    }

    public void showNoButtons() {
        buyButton.setVisibility(View.GONE);
        androidPayContainer.setVisibility(View.GONE);
    }

    public void showProgressBar() {
        buyButton.setVisibility(View.GONE);
        androidPayContainer.setVisibility(View.GONE);
        progressBar.setVisibility(View.VISIBLE);
    }

    public void resetTransaction() {
        final SupportWalletFragment walletFragment = (SupportWalletFragment) getSupportFragmentManager().findFragmentById(R.id.android_pay_card_details);
        if (walletFragment != null) {
            itemsToPurchase.clear();
            showNoButtonsOrProgress();
            setupItemsForSale();
            Animations.animateAndroidPayDetailsRemoval(BaseActivity.this, walletFragment, getSupportFragmentManager());
        }
    }

    public String itemsToPurchaseToJson() {
        JsonAdapter<ArrayList<ItemInfo>> jsonAdapter = getMoshiAdapterForItemsToPurchase();
        return jsonAdapter.toJson(itemsToPurchase);
    }

    public ArrayList<ItemInfo> jsonToItemsToPurchase(String jsonStringToken) {
        JsonAdapter<ArrayList<ItemInfo>> jsonAdapter = getMoshiAdapterForItemsToPurchase();
        ArrayList<ItemInfo> items = new ArrayList<>();

        try {
            items = jsonAdapter.fromJson(jsonStringToken);
        } catch (IOException e) {
            e.printStackTrace();
        }

        return items;
    }

    private JsonAdapter<ArrayList<ItemInfo>> getMoshiAdapterForItemsToPurchase() {
        Moshi moshi = new Moshi.Builder().build();
        Type type = Types.newParameterizedType(List.class, ItemInfo.class);
        return moshi.adapter(type);
    }

    @Override
    public void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        outState.putString(SAVED_STATE_ITEMS_TO_PURCHASE, itemsToPurchaseToJson());
    }
}
