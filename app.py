# app.py
from flask import Flask, render_template, request, jsonify, redirect, url_for
from extensions import db, migrate
import os
from models import LineItem, PricebookItem  # Import PricebookItem model

app = Flask(__name__)

# Ensure instance folder exists
if not os.path.exists(app.instance_path):
    os.makedirs(app.instance_path)

# Update the database URI to correctly reference the instance folder
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(app.instance_path, 'app.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize extensions with the app
db.init_app(app)
migrate.init_app(app, db)

from models import LineItem  # Import after initializing db and migrate

@app.route('/')
def dashboard():
    # Gather statistics
    invoices_scanned = LineItem.query.count()
    items_added = PricebookItem.query.count()
    pricing_corrections = LineItem.query.filter(
    LineItem.discrepancy_resolved == True,
    LineItem.discrepancy_action == 'approved'
    ).count()


    # Additional data for charts
    invoices_completed = LineItem.query.filter_by(status='Approved').count()
    invoices_pending = LineItem.query.filter_by(status='Pending').count()

    new_items = PricebookItem.query.filter(PricebookItem.is_new == True).count()
    existing_items = PricebookItem.query.filter(PricebookItem.is_new == False).count()

    # Notifications
    not_found_items = LineItem.query.filter_by(found_in_pricebook=False).all()

    # Manual Review
    manual_review_invoices = LineItem.query.filter_by(status='Pending').all()

    return render_template('dashboard.html',
                           invoices_scanned=invoices_scanned,
                           items_added=items_added,
                           pricing_corrections=pricing_corrections,
                           invoices_completed=invoices_completed,
                           invoices_pending=invoices_pending,
                           new_items=new_items,
                           existing_items=existing_items,
                           not_found_items=not_found_items,
                           manual_review_invoices=manual_review_invoices)

@app.route('/approve/<int:item_id>', methods=['POST'])
def basic_approve_item(item_id):
    item = LineItem.query.get_or_404(item_id)
    if item.status == 'Pending':
        item.status = 'Approved'
        db.session.commit()
        return jsonify({'status': 'success', 'message': 'Item approved successfully.'})
    return jsonify({'status': 'error', 'message': 'Item already processed.'}), 400


@app.route('/deny/<int:item_id>', methods=['POST'])
def deny_item(item_id):
    item = LineItem.query.get_or_404(item_id)
    if item.status == 'Pending':
        item.status = 'Denied'
        db.session.commit()
        return jsonify({'status': 'success', 'message': 'Item denied.'})
    return jsonify({'status': 'error', 'message': 'Item already processed.'}), 400

@app.route('/bulk_action', methods=['POST'])
def bulk_action():
    action = request.form.get('action')
    item_ids = request.form.getlist('item_ids[]')
    if action not in ['approve', 'deny']:
        return jsonify({'status': 'error', 'message': 'Invalid action.'}), 400
    
    items = LineItem.query.filter(LineItem.id.in_(item_ids)).all()
    for item in items:
        if action == 'approve' and item.status == 'Pending':
            item.status = 'Approved'
        elif action == 'deny' and item.status == 'Pending':
            item.status = 'Denied'
    db.session.commit()
    return jsonify({'status': 'success', 'message': f'Items {action}d successfully.'})

@app.route('/submit_approvals', methods=['POST'])
def submit_approvals():
    approved_items = LineItem.query.filter_by(status='Approved').all()
    # Integrate with your CRM system here
    # Example:
    # for item in approved_items:
    #     crm_api.add_line_item(item.part_number, item.description, item.invoice_priceprice)
    return jsonify({'status': 'success', 'message': 'Approved items submitted to CRM.'})

@app.route('/pricebook_items')
def pricebook_items():
    items = PricebookItem.query.all()
    return render_template('pricebook_items.html', items=items)

@app.route('/manual_review')
def manual_review():
    manual_review_invoices = LineItem.query.filter_by(status='Pending').all()
    return render_template('manual_review.html', manual_review_invoices=manual_review_invoices)

@app.route('/line_items')
def line_items():
    # Gather data for the new page routing logic
    total = LineItem.query.count()
    approved = LineItem.query.filter_by(status='Approved').count()
    denied = LineItem.query.filter_by(status='Denied').count()
    pending = LineItem.query.filter_by(status='Pending').count()
    not_found_items = LineItem.query.filter_by(found_in_pricebook=False).all()
    line_items = LineItem.query.all()

    return render_template('pricebook_builder.html',
                           total=total,
                           approved=approved,
                           denied=denied,
                           pending=pending,
                           not_found_items=not_found_items,
                           line_items=line_items)


@app.route('/settings')
def settings():
    # Render a settings page
    return render_template('settings.html')

@app.route('/logout')
def logout():
    # Handle user logout, redirect to login or dashboard
    return redirect(url_for('dashboard'))

@app.route('/invoices')
def invoices():
    # Render invoices page (if applicable)
    return render_template('invoices.html')

@app.route('/pricebook_builder')
def pricebook_builder():
    # Fetch necessary data for pricebook builder
    line_items = LineItem.query.all()
    not_found_items = LineItem.query.filter_by(found_in_pricebook=False).all()
    total = len(line_items)
    approved = len([item for item in line_items if item.status == 'Approved'])
    denied = len([item for item in line_items if item.status == 'Denied'])
    pending = len([item for item in line_items if item.status == 'Pending'])
    return render_template('pricebook_builder.html', line_items=line_items, not_found_items=not_found_items, total=total, approved=approved, denied=denied, pending=pending)

@app.route('/line_items/approve/<int:item_id>', methods=['POST'])
def line_item_approve(item_id):
    item = LineItem.query.get_or_404(item_id)
    if item.status == 'Pending':
        # Update fields based on form data
        item.code = request.form.get('code', item.code)
        item.name = request.form.get('name', item.name)
        item.description = request.form.get('description', item.description)
        item.invoice_price = float(request.form.get('price', item.invoice_price))
        item.member_price = float(request.form.get('member_price', item.member_price or item.invoice_price))
        item.add_on_price = float(request.form.get('add_on_price', item.add_on_price or item.invoice_price))
        item.member_add_on_price = float(request.form.get('member_add_on_price', item.member_add_on_price or item.invoice_price))
        item.hours = float(request.form.get('hours', item.hours or 0.0))
        item.taxable = 'taxable' in request.form
        item.deduct_job_cost = 'deduct_job_cost' in request.form
        item.membership_discount = 'allow_membership_discounts' in request.form
        item.auto_replenish = 'auto_replenish' in request.form
        item.exclude_pricebook_wizard = 'exclude_pricebook_wizard' in request.form

        item.status = 'Approved'
        db.session.commit()
        return jsonify({'status': 'success', 'message': 'Line item approved and updated successfully.'})
    return jsonify({'status': 'error', 'message': 'Item already processed.'}), 400

@app.cli.command('update_null_values')
def update_null_values():
    with app.app_context():
        # Update price fields
        LineItem.query.filter(LineItem.invoice_price == None).update({LineItem.invoice_price: 0.0})
        LineItem.query.filter(LineItem.member_price == None).update({LineItem.member_price: LineItem.invoice_price})
        LineItem.query.filter(LineItem.add_on_price == None).update({LineItem.add_on_price: LineItem.invoice_price})
        LineItem.query.filter(LineItem.member_add_on_price == None).update({LineItem.member_add_on_price: LineItem.invoice_price})
        LineItem.query.filter(LineItem.hours == None).update({LineItem.hours: 0.0})
        db.session.commit()
        print("Updated NULL numeric fields to default values")

@app.route('/pricing_update')
def pricing_update():
    # Query for items with discrepancies that are not yet resolved
    discrepancies = LineItem.query.filter(
        LineItem.discrepancy_resolved == False,
        LineItem.invoice_price != LineItem.pricebook_price
    ).all()

    # Calculate the price difference for each item (if not stored in the model)
    for item in discrepancies:
        item.price_difference = item.invoice_price - item.pricebook_price

    return render_template('pricing_update.html', discrepancies=discrepancies)

@app.route('/pricing_update/approve', methods=['POST'])
def approve_discrepancy():
    item_ids = request.form.getlist('item_ids[]')
    items = LineItem.query.filter(LineItem.id.in_(item_ids)).all()

    for item in items:
        # Update the pricebook price
        pricebook_item = PricebookItem.query.filter_by(part_number=item.part_number).first()
        if pricebook_item:
            pricebook_item.price = item.invoice_price
            item.pricebook_price = item.invoice_price  # Update the item's pricebook price
        # Mark discrepancy as resolved
        item.discrepancy_resolved = True
        db.session.add(item)
        db.session.add(pricebook_item)
    db.session.commit()
    return jsonify({'status': 'success', 'message': 'Discrepancies approved and prices updated.'})

@app.route('/pricing_update/dismiss', methods=['POST'])
def dismiss_discrepancy():
    item_ids = request.form.getlist('item_ids[]')
    items = LineItem.query.filter(LineItem.id.in_(item_ids)).all()

    for item in items:
        # Mark discrepancy as resolved without changing the pricebook
        item.discrepancy_resolved = True
        db.session.add(item)
    db.session.commit()
    return jsonify({'status': 'success', 'message': 'Discrepancies dismissed.'})
    


if __name__ == '__main__':
    app.run(debug=True)
