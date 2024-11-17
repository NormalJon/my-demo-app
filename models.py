# models.py
from extensions import db

from extensions import db

class LineItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    invoice_number = db.Column(db.String(255))
    vendor = db.Column(db.String(255))
    part_number = db.Column(db.String(255))
    description = db.Column(db.Text)
    invoice_price = db.Column(db.Float, default=0.0)
    status = db.Column(db.String(20), default='Pending')
    found_in_pricebook = db.Column(db.Boolean, default=False)
    
    # Fields from the modal form
    code = db.Column(db.String(31))
    name = db.Column(db.String(255))
    member_price = db.Column(db.Float, default=0.0)
    add_on_price = db.Column(db.Float, default=0.0)
    member_add_on_price = db.Column(db.Float, default=0.0)
    hours = db.Column(db.Float, default=0.0)
    taxable = db.Column(db.Boolean, default=False)
    deduct_job_cost = db.Column(db.Boolean, default=False)
    membership_discount = db.Column(db.Boolean, default=False)
    auto_replenish = db.Column(db.Boolean, default=False)
    exclude_pricebook_wizard = db.Column(db.Boolean, default=False)

    # New fields
    pricebook_price = db.Column(db.Float)
    discrepancy_resolved = db.Column(db.Boolean, default=False)
    discrepancy_action = db.Column(db.String(20))  # 'approved' or 'dismissed'

    def __repr__(self):
        return f'<LineItem {self.part_number}>'


class PricebookItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(50), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(255))
    invoice_price = db.Column(db.Float, nullable=False)
    member_price = db.Column(db.Float)
    add_on_price = db.Column(db.Float)
    member_add_on_price = db.Column(db.Float)
    hours = db.Column(db.Integer)
    vendor = db.Column(db.String(100))
    taxable = db.Column(db.Boolean, default=False)
    deduct_as_job_cost = db.Column(db.Boolean, default=False)
    allow_membership_discounts = db.Column(db.Boolean, default=True)
    auto_replenish = db.Column(db.Boolean, default=False)
    exclude_from_wizard = db.Column(db.Boolean, default=False)
    is_new = db.Column(db.Boolean, default=False)  # Added field

    def __repr__(self):
        return f'<PricebookItem {self.code} - {self.name}>'
