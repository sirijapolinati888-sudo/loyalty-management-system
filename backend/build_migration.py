import alembic.autogenerate
from alembic.migration import MigrationContext
from alembic.autogenerate import render_python_code
from sqlalchemy import create_engine
import app.models.entities
from app.db.session import Base

engine = create_engine('sqlite:///:memory:')
conn = engine.connect()
mc = MigrationContext.configure(conn)
m = alembic.autogenerate.produce_migrations(mc, Base.metadata)
up_code = render_python_code(m.upgrade_ops)
down_code = render_python_code(m.downgrade_ops)

header = '"""0001_initial_schema\n\nRevision ID: 0001_initial_schema\nRevises: None\nCreate Date: 2026-11-14\n"""\n'
imports = "from typing import Sequence, Union\nfrom alembic import op\nimport sqlalchemy as sa\n\n"
vars_decl = "revision: str = '0001_initial_schema'\ndown_revision: Union[str, None] = None\nbranch_labels: Union[str, Sequence[str], None] = None\ndepends_on: Union[str, Sequence[str], None] = None\n\n"
funcs = f"def upgrade() -> None:\n{up_code}\n\n\ndef downgrade() -> None:\n{down_code}\n"

with open('alembic/versions/0001_initial_schema.py', 'w', encoding='utf-8') as f:
    f.write(header + imports + vars_decl + funcs)

print('SUCCESS')

