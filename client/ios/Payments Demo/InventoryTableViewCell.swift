//
//  InventoryTableViewCell.swift
//  Payments Demo
//
//  Created by Sven Resch on 2016-09-14.
//  Copyright © 2017 Bambora, Inc. All rights reserved.
//

import UIKit

@IBDesignable
class InventoryTableViewCell: UITableViewCell {

    required init?(coder aDecoder: NSCoder) {
        super.init(coder: aDecoder)
        
        setup()
    }
    
    override init(style: UITableViewCell.CellStyle, reuseIdentifier: String?) {
        super.init(style: style, reuseIdentifier: reuseIdentifier)
        
        setup()
    }
    
    func setup() {
        self.imageView?.image = UIImage.init(named: "golden-egg")
        self.textLabel?.text = "1 Golden Egg"
    }
    
}
