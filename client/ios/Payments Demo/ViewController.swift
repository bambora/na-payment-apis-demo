//
//  ViewController.swift
//  Payments Demo
//
//  Created by Sven Resch on 2016-09-14.
//  Copyright © 2017 Bambora, Inc. All rights reserved.
//

import UIKit
import PassKit
import Alamofire
import MBProgressHUD

class ViewController: UIViewController {
    
    @IBOutlet weak var purchaseTypeSegmentedControl: UISegmentedControl!
    @IBOutlet weak var placeholderView: UIView!
    
    // Mobile Payments Demo Server
    fileprivate let DemoServerURLBase = "http://merchant-api-demo.us-west-2.elasticbeanstalk.com"
    
    // Apple Pay Merchant Identifier
    fileprivate let ApplePayMerchantID = "merchant.com.beanstream.apbeanstream"
    
    // !!! TD backend processor
    // Bambora North America; Supported Payment Networks for Apple Pay
    fileprivate let SupportedPaymentNetworks : [PKPaymentNetwork] = [.visa, .masterCard, .amex, .discover]

    // !!! First Data backend processor
    // Bambora North America; Supported Payment Networks for Apple Pay
    //fileprivate let SupportedPaymentNetworks : [PKPaymentNetwork] = [.visa, .masterCard, .amex, .discover]
    
    var totalTransactionAmount = 0.00
    
    fileprivate var paymentButton: PKPaymentButton!
    fileprivate var paymentAmount: NSDecimalNumber!
    fileprivate var alert: UIAlertController!
    fileprivate var hud: MBProgressHUD!

    override func viewDidLoad() {
        super.viewDidLoad()

        self.paymentButton = PKPaymentButton(paymentButtonType: .buy, paymentButtonStyle: .black)
        
        let pview = placeholderView
        pview?.addSubview(self.paymentButton)
        pview?.backgroundColor = UIColor.clear
        
        self.paymentButton.center = (pview?.convert((pview?.center)!, from: pview?.superview))!
        self.paymentButton.addTarget(self,
                                     action: #selector(ViewController.paymentButtonAction),
                                     for: .touchUpInside)
    }

    // MARK: - Custom action methods
    
    @objc func paymentButtonAction() {
        // Check to make sure payments are supported.
        if !PKPaymentAuthorizationViewController.canMakePayments(usingNetworks: SupportedPaymentNetworks, capabilities: .capability3DS) {
            // Let user know they can not continue with an Apple Pay based transaction...
            let message = "Apple Pay not available on this device with the required card types!"
            let alert = UIAlertController.init(title: "Mobile Payments", message: message, preferredStyle: .alert)
            let okAction = UIAlertAction(title: "OK", style: .default, handler: { (alert: UIAlertAction) in
                self.dismiss(animated: true, completion: nil)
            })
            alert.addAction(okAction)
            self.present(alert, animated: true, completion: nil)
            return
        }
        
        let request = PKPaymentRequest()
        
        request.merchantIdentifier = ApplePayMerchantID
        request.supportedNetworks = SupportedPaymentNetworks
        request.merchantCapabilities = .capability3DS
        
        // Use a currency set to match your Bambora North America Merchant Account
        request.countryCode = "CA" // "US"
        request.currencyCode = "CAD" // "USD"
        
        request.paymentSummaryItems = [
            PKPaymentSummaryItem(label: "1 Golden Egg", amount: NSDecimalNumber(value: totalTransactionAmount), type: .final)
        ]
        
        self.paymentAmount = NSDecimalNumber(value: totalTransactionAmount)
        
        // Request shipping and billing info. 
        // Apple recommends that we should not require these unless absolutely necessary.
        //request.requiredShippingAddressFields = [.email, .postalAddress]
        //request.requiredBillingAddressFields = .postalAddress
        
        
        let authVC = PKPaymentAuthorizationViewController(paymentRequest: request)
        authVC?.delegate = self
        present(authVC!, animated: true, completion: nil)
    }
}

extension ViewController: InventoryTableViewCellDelegate {
    func transactionAmountUpdated(transactionAmount: Double) {
        totalTransactionAmount = transactionAmount
    }
}

extension ViewController: PKPaymentAuthorizationViewControllerDelegate {
    
    // Executes a process payment request on our Merchant Server
    func paymentAuthorizationViewController(_ controller: PKPaymentAuthorizationViewController, didAuthorizePayment payment: PKPayment, completion: @escaping (PKPaymentAuthorizationStatus) -> Void) {
        // Get payment data from the token and Base64 encode it
        let token = payment.token
        let paymentData = token.paymentData
        let b64TokenStr = paymentData.base64EncodedString(options: NSData.Base64EncodingOptions(rawValue: 0))
        
        let transactionType = self.purchaseTypeSegmentedControl.selectedSegmentIndex == 0 ? "purchase" : "pre-auth"
        
        var parameters = [
            "amount": self.paymentAmount ?? 1.00,
            "transaction-type": transactionType,
            "payment-token": b64TokenStr
        ] as [String : Any]

        // Get shipping and billing address fields
        if let shippingContact = payment.shippingContact {
            if let email = shippingContact.emailAddress {
                print("shipping email: \(email)")
            }
            
            if let dict = self.convertToAddressDictionary(contact: shippingContact) {
                parameters["shipping"] = dict
            }
        }
        
        if let billingContact = payment.billingContact {
            if let dict = self.convertToAddressDictionary(contact: billingContact) {
                parameters["billing"] = dict
            }
        }
        
        print("payment parameters: \(parameters)")
        
        self.hud = MBProgressHUD.showAdded(to: self.view, animated: true)

        Alamofire.request(DemoServerURLBase + "/payment/mobile/process/apple-pay", method: .post, parameters: parameters, encoding: JSONEncoding.default).responseJSON {
            response in

            if let _ = self.hud {
                self.hud.hide(animated: true)
            }

            var successFlag = false
            var status = "Payment was not processed"
            var json: NSDictionary! = nil

            if let result = response.result.value {
                json = result as! NSDictionary
                print("JSON: \(json)")
            }

            let statusCode = response.response?.statusCode
                        
            if statusCode == 200 {
                successFlag = true
                status = "Payment processed successfully"
            }
            else {
                print("process transaction request error: \(statusCode ?? -1)")
                if let _ = json, let message = json["message"] as! String? {
                    status = message
                }
                else if response.result.isFailure {
                    status = response.result.debugDescription
                }
            }
            
            self.alert = UIAlertController.init(title: "Mobile Payments", message: status, preferredStyle: .alert)
            let okAction = UIAlertAction(title: "OK", style: .default, handler: { (alert: UIAlertAction) in
                self.dismiss(animated: true, completion: nil)
            })
            self.alert.addAction(okAction)
            
            if successFlag {
                completion(.success)
            }
            else {
                completion(.failure)
            }
        }
    }
    
    func paymentAuthorizationViewControllerDidFinish(_ controller: PKPaymentAuthorizationViewController) {
        controller.dismiss(animated: true, completion: nil)
        
        if let _ = self.hud {
            self.hud.hide(animated: true)
        }

        if let _ = self.alert {
            self.present(alert, animated: true, completion: nil)
            self.alert = nil
        }
    }
    
    // Returns a dictionary if address info is found else returns nil.
    private func convertToAddressDictionary(contact: PKContact) -> [String:String]? {
        var addressDictionary: [String:String] = Dictionary()
        
        if let address = contact.postalAddress {
            addressDictionary["address_line1"] = address.street
            addressDictionary["province"] = address.state
            addressDictionary["city"] = address.city
            addressDictionary["country"] = address.country
            addressDictionary["postal_code"] = address.postalCode
        }
        
        if let email = contact.emailAddress {
            addressDictionary["email_address"] = email
        }

        /*
         // Converts to JSON Data
        do {
            let json = try JSONSerialization.data(withJSONObject: addressDictionary, options: .prettyPrinted)
            return json
        } catch {
            print(error.localizedDescription)
        }
         */
        
        if addressDictionary.count > 0 {
            return addressDictionary
        }
        else {
            return nil
        }
    }
}
