# cleanup.py
from app import app
from extensions import db
from models import LineItem

def delete_entries_with_none_values():
    with app.app_context():
        # Query for LineItems where invoice_number, vendor, or part_number is None
        entries_to_delete = LineItem.query.filter(
            (LineItem.invoice_number == None) |
            (LineItem.vendor == None) |
            (LineItem.part_number == None)
        ).all()
        
        if entries_to_delete:
            for entry in entries_to_delete:
                db.session.delete(entry)
            db.session.commit()
            print(f"Deleted {len(entries_to_delete)} entries with None values.")
        else:
            print("No entries with None values found.")

if __name__ == '__main__':
    delete_entries_with_none_values()
