# populate.py
from app import app
from extensions import db
from models import LineItem

def populate_sample_data():
    with app.app_context():
        sample_items = [
            LineItem(
                invoice_number='INV1001',
                vendor='Vendor A',
                part_number='P001',
                description='Product A Description',
                price=200.00,
                found_in_pricebook=False
            ),
            LineItem(
                invoice_number='INV1001',
                vendor='Vendor A',
                part_number='P002',
                description='Product B Description',
                price=600.00,
                found_in_pricebook=False  # Not found
            ),
            LineItem(
                invoice_number='INV1002',
                vendor='Vendor B',
                part_number='P003',
                description='Product C Description',
                price=150.00,
                found_in_pricebook=False
            ),
            LineItem(
                invoice_number='INV1003',
                vendor='Vendor C',
                part_number='P004',
                description='Product D Description',
                price=300.00,
                found_in_pricebook=False  # Not found
            ),
            # Add more items as needed
        ]

        db.session.add_all(sample_items)
        db.session.commit()
        print("Sample data added successfully.")

if __name__ == '__main__':
    populate_sample_data()
