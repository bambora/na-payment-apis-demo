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

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.ImageView;
import android.widget.TextView;

import java.util.ArrayList;

import com.bambora.na.androidpay.demo.model.ItemInfo;

/**
 * Created on 15/05/2017.
 */

public class ItemListAdapter extends ArrayAdapter<ItemInfo> {

    private ArrayList<ItemInfo> itemsToPurchase;

    public ItemListAdapter(Context context, ArrayList<ItemInfo> items, ArrayList<ItemInfo> itemsToPurchase) {
        super(context, 0, items);
        this.itemsToPurchase = itemsToPurchase;
    }

    @Override
    public View getView(int position, View convertView, ViewGroup parent) {
        ItemInfo item = getItem(position);

        if (convertView == null) {
            convertView = LayoutInflater.from(getContext()).inflate(R.layout.list_item, parent, false);
        }

        ImageView imageView = (ImageView) convertView.findViewById(R.id.image);
        TextView name = (TextView) convertView.findViewById(R.id.name);
        TextView quantity = (TextView) convertView.findViewById(R.id.quantity);

        imageView.setImageResource(item.imageResourceId);
        name.setText(item.name);
        quantity.setText("" + getCountOfItem(item));

        return convertView;
    }

    private int getCountOfItem(ItemInfo itemToFind) {
        int count = 0;
        for (ItemInfo item : itemsToPurchase) {
            if (item.name.equals(itemToFind.name)) {
                count++;
            }
        }
        return count;
    }

    void addItemToSale(int itemPosition) {
        itemsToPurchase.add(getItem(itemPosition));
        notifyDataSetChanged();
    }
}