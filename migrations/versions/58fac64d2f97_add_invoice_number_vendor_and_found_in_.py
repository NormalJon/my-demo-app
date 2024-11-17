# migrations/versions/58fac64d2f97_add_invoice_number_vendor_and_found_in_.py
from alembic import op
import sqlalchemy as sa

# Revision identifiers, used by Alembic.
revision = '58fac64d2f97'
down_revision = 'ea6d26014a14'
branch_labels = None
depends_on = None

def upgrade():
    with op.batch_alter_table('line_item', schema=None) as batch_op:
        # Add 'invoice_number' with default 'UNKNOWN'
        batch_op.add_column(sa.Column(
            'invoice_number',
            sa.String(length=50),
            nullable=False,
            server_default='UNKNOWN'
        ))
        # Add 'vendor' with default 'UNKNOWN'
        batch_op.add_column(sa.Column(
            'vendor',
            sa.String(length=100),
            nullable=False,
            server_default='UNKNOWN'
        ))
        # Add 'found_in_pricebook' with default True (1)
        batch_op.add_column(sa.Column(
            'found_in_pricebook',
            sa.Boolean(),
            nullable=False,
            server_default=sa.text('1')
        ))
    
    # Optionally, remove server_default after migration if not needed
    # This step ensures that future inserts must explicitly provide these fields
    with op.batch_alter_table('line_item', schema=None) as batch_op:
        batch_op.alter_column('invoice_number', server_default=None)
        batch_op.alter_column('vendor', server_default=None)
        batch_op.alter_column('found_in_pricebook', server_default=None)

def downgrade():
    with op.batch_alter_table('line_item', schema=None) as batch_op:
        batch_op.drop_column('found_in_pricebook')
        batch_op.drop_column('vendor')
        batch_op.drop_column('invoice_number')
