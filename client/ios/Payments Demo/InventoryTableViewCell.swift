//
//  InventoryTableViewCell.swift
//  Payments Demo
//
//  Created by Sven Resch on 2016-09-14.
//  Copyright © 2017 Bambora, Inc. All rights reserved.
//

import UIKit

protocol InventoryTableViewCellDelegate {
    func transactionAmountUpdated(transactionAmount: Double)
}

@IBDesignable
class InventoryTableViewCell: UITableViewCell, UITextFieldDelegate {
    
    @IBOutlet weak var amountField: UITextField!
    
    var itemAmount: Int = 0
    var delegate: InventoryTableViewCellDelegate?

    override func awakeFromNib() {
        super.awakeFromNib()
        self.imageView?.image = UIImage.init(named: "golden-egg")
        self.textLabel?.text = "1 Golden Egg"
        self.amountField.placeholder = "$0.00"
        self.amountField.delegate = self
        self.addDoneButtonOnKeyboard()
    }
    
    func textField(_ textField: UITextField, shouldChangeCharactersIn range: NSRange, replacementString string: String) -> Bool {
        if let digit = Int(string) {
            let rootViewController = self.window!.rootViewController
            itemAmount = itemAmount * 10 + digit
            
            if itemAmount > 1_000_000_000_00 {
                let alertController = UIAlertController(title: "Please enter an amount less than 1 billion", message: nil, preferredStyle: .alert)
                
                alertController.addAction(UIAlertAction(title: "Dismiss", style: UIAlertAction.Style.default))
                
                rootViewController?.present(alertController, animated: true, completion: nil)
                
                amountField.text = ""
                itemAmount = 0
            }
            amountField.text = updateAmount()
        }
        
        if string == "" {
            itemAmount = itemAmount/10
            amountField.text = updateAmount()
        }
        
        return false
    }
    
    func updateAmount() -> String? {
        let formatter = NumberFormatter()
        formatter.numberStyle = NumberFormatter.Style.currency
        
        let amount = Double(itemAmount/100) + Double(itemAmount%100)/100
        delegate?.transactionAmountUpdated(transactionAmount: amount)
        
        return formatter.string(from: NSNumber(value: amount))
    }
    
    func addDoneButtonOnKeyboard()
    {
        let doneToolbar: UIToolbar = UIToolbar(frame: CGRect(x: 0, y: 0, width: 320, height: 50))
        doneToolbar.barStyle = UIBarStyle.default
      
        let flexSpace = UIBarButtonItem(barButtonSystemItem: UIBarButtonItem.SystemItem.flexibleSpace, target: nil, action: nil)
        let done: UIBarButtonItem = UIBarButtonItem(title: "Done", style: UIBarButtonItem.Style.done, target: self, action: #selector(self.doneButtonAction))
      
      var items = [UIBarButtonItem]()
      items.append(flexSpace)
      items.append(done)
      
      doneToolbar.items = items
      doneToolbar.sizeToFit()
      
      self.amountField.inputAccessoryView = doneToolbar
    }
    
    @objc func doneButtonAction()
    {
      self.amountField.resignFirstResponder()
    }
}
