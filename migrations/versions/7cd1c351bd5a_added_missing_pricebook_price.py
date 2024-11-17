"""Added missing pricebook price

Revision ID: 7cd1c351bd5a
Revises: 9adcea3eb28a
Create Date: 2024-11-17 13:46:29.024

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '7cd1c351bd5a'
down_revision = '9adcea3eb28a'
branch_labels = None
depends_on = None


def upgrade():
    # Add the new column with a server default and set nullable to False
    op.add_column('pricebook_item', sa.Column('pricebook_price', sa.Float(), server_default='0.0', nullable=False))
    # If you need to remove the server default after setting the default values
    with op.batch_alter_table('pricebook_item') as batch_op:
        batch_op.alter_column('pricebook_price', server_default=None)


def downgrade():
    # Remove the column on downgrade
    op.drop_column('pricebook_item', 'pricebook_price')
