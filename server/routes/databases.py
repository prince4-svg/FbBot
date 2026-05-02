import os
import sqlite3
from flask import Blueprint, request, jsonify
from logger import log
from typing import TypedDict
from db_handler import handle


bp = Blueprint('databases', __name__)


def get_db_connection(db_name):
    db_folder: str = os.path.join(
        os.path.dirname(__file__), 
        '../databases'
    )
    db_path: str = os.path.join(db_folder, db_name)
    return sqlite3.connect(db_path, check_same_thread=False)


class DataSentType(TypedDict):
    db_name: str
    table: str
    action: str
    data: dict


def check_data_content(data_sent: dict | None) -> DataSentType:
    if not isinstance(data_sent, dict):
        raise TypeError('Data must be JSON Object')
    
    missing: list[str] = [k for k in ('db_name', 'table', 'action', 'data') if k not in data_sent]
    if missing:
        raise KeyError(f'Missing fields: {", ".join(missing)}')
    
    return data_sent


@bp.route('/databases', methods=['POST'])
def databases():
    data_sent: dict = request.get_json(force=True, silent=True)
    log(data_sent)
    
    db_connection: None | sqlite3.Connection = None # Connection not connect
    
    try:
        valid_data: DataSentType = check_data_content(data_sent)
        db_connection = get_db_connection(valid_data['db_name'])
        
        result = handle(
            db_connection, 
            valid_data['table'], 
            valid_data['action'], 
            valid_data['data']
        )
        return jsonify({'success': True, 'data': result})
        
    except (TypeError, KeyError) as err:
        print(f'CAUGHT ERROR: {err}')
        return jsonify({'success': False, 'error': str(err)}), 400
        
    except Exception as err:
        print(f'UNEXPECTED ERROR: {err}')
        return jsonify({'success': False, 'error': 'Internal server error'}), 500
        
    finally:
        if db_connection:
            db_connection.close()