import sqlite3
import re
from typing import TypedDict, Any, Literal


ALLOWED_TABLES: set[str] = {'users', 'products', 'orders'}
IDENTIFIER_REGEX = re.compile(r'^[a-zA-Z_][a-zA-Z0-9_]*$')


class ColumnDef(TypedDict):
    name: str
    type: Literal['TEXT', 'INTEGER', 'REAL', 'BLOB', 'NUMERIC']
    primary_key: bool
    not_null: bool


class CreateDataTypes(TypedDict):
    columns: list[ColumnDef]


class InsertDataTypes(TypedDict):
    columns: tuple[str,...] | list[str]
    values: tuple[Any,...] | list[Any]


class UpdateDataTypes(TypedDict, total=False):
    columns: tuple[str,...] | list[str]
    condition: str
    values: tuple[Any,...] | list[Any]


class GetDataTypes(TypedDict, total=False):
    columns: tuple[str,...] | list[str]
    condition: str
    values: tuple[Any,...] | list[Any]
    fetch_state: str


def sanitize_identifier(name: str) -> str:
    if not IDENTIFIER_REGEX.match(name):
        raise ValueError(f"Invalid identifier: {name}")
    return name


def validate_table(table_name: str) -> str:
    clean = sanitize_identifier(table_name)
    if clean not in ALLOWED_TABLES:
        raise ValueError(f"Table '{clean}' not allowed")
    return clean


def validate_condition_values(condition: str, values: tuple | list, action: str) -> None:
    if condition.strip() and condition.count('?') == 0:
        raise ValueError(f'[{action}] condition must use? placeholders, not direct values')

    placeholder_count = condition.count('?')
    if placeholder_count!= len(values):
        raise ValueError(f'[{action}] Mismatch: {placeholder_count}? but {len(values)} values')


def build_column_def(col: ColumnDef) -> str:
    name = sanitize_identifier(col['name'])
    col_type = col['type']
    pk = ' PRIMARY KEY' if col.get('primary_key', False) else ''
    nn = ' NOT NULL' if col.get('not_null', False) else ''
    return f"{name} {col_type}{pk}{nn}"


def create(action: str, db: sqlite3.Connection, table_name: str, data: CreateDataTypes) -> str:
    try:
        cursor = db.cursor()
        table = validate_table(table_name)
        columns_raw = data['columns']

        if not isinstance(columns_raw, list) or not columns_raw:
            raise ValueError(f'[{action}] columns must be non-empty list')

        columns_def = [build_column_def(c) for c in columns_raw]
        columns_sql = ', '.join(columns_def)

        cursor.execute(f"CREATE TABLE IF NOT EXISTS {table} ({columns_sql})")
        db.commit()
        return 'success'

    except Exception as e:
        raise Exception(f'[{action}] Error: ({type(e).__name__}) {str(e)}')


def insert(action: str, db: sqlite3.Connection, table_name: str, data: InsertDataTypes) -> str:
    try:
        cursor = db.cursor()
        table = validate_table(table_name)
        columns_raw = data['columns']
        values = data['values']

        columns = [sanitize_identifier(c) for c in columns_raw]
        columns_str = ', '.join(columns)
        values_placeholder = ', '.join(['?' for _ in values])

        if len(columns)!= len(values):
            raise ValueError(f'[{action}] columns count!= values count')

        cursor.execute(
            f"INSERT INTO {table} ({columns_str}) VALUES ({values_placeholder})",
            values
        )
        db.commit()
        return 'success'

    except Exception as e:
        raise Exception(f'[{action}] Error: ({type(e).__name__}) {str(e)}')


def update(action: str, db: sqlite3.Connection, table_name: str, data: UpdateDataTypes) -> str:
    try:
        if 'columns' not in data or 'values' not in data:
            raise Exception(f'[{action}] "columns" and "values" are required.')

        cursor = db.cursor()
        table = validate_table(table_name)
        columns_raw = data['columns']
        condition = data.get('condition', '')
        values = list(data['values'])

        columns = [sanitize_identifier(c) for c in columns_raw]
        set_clause = ', '.join([f'{c} =?' for c in columns])

        validate_condition_values(condition, values[len(columns):], action)

        sql = f"UPDATE {table} SET {set_clause} {condition}"
        cursor.execute(sql, values)
        db.commit()
        return 'success'

    except Exception as e:
        raise Exception(f'[{action}] Error: ({type(e).__name__}) {str(e)}')


def get(action: str, db: sqlite3.Connection, table_name: str, data: GetDataTypes) -> tuple | list[tuple] | None:
    try:
        cursor = db.cursor()
        table = validate_table(table_name)
        columns_raw = data.get('columns', [])
        condition = data.get('condition', '')
        values = data.get('values', ())
        fetch_state = data.get('fetch_state', 'ONE').upper()

        columns = [sanitize_identifier(c) for c in columns_raw] if columns_raw else []
        columns_str = ', '.join(columns) or '*'

        validate_condition_values(condition, values, action)

        sql = f"SELECT {columns_str} FROM {table} {condition}"
        cursor.execute(sql, values)

        return cursor.fetchone() if fetch_state == 'ONE' else cursor.fetchall()

    except Exception as e:
        raise Exception(f'[{action}] Error: ({type(e).__name__}) {str(e)}')


def handle(db: sqlite3.Connection, table_name: str, action: str, data: dict) -> tuple | list[tuple] | str | None:
    if not isinstance(data, dict):
        raise Exception('[db_func] Parameter <data> must be a type of dictionary')

    action_upper = action.upper()
    actions_map = {
        'INSERT': insert,
        'UPDATE': update,
        'CREATE': create,
        'GET': get
    }

    if action_upper not in actions_map:
        raise Exception(f'[db_func] Parameter <action> must be in {", ".join(actions_map)}')

    return actions_map[action_upper](action_upper, db, table_name, data)