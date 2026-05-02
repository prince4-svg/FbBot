from decimal import InvalidOperation
from flask import request, Blueprint
from logger import log
from wrapper import Decimal


MAX_BAL = Decimal('1e1000')
bp = Blueprint('get_whole', __name__)


@bp.route('/get_whole', methods=['POST'])
def get_whole():
    try:
        data = request.json
        log(data)
		
        bal = Decimal(str(data['data']['bal']))
        if bal > MAX_BAL:
            return {'success': False, 'exit': True}, 400
			
        value = int(bal)
        return {'value': f"{value:,}", 'success': True, 'exit': False}
		
    except:
        return {'value': '0', 'success': False, 'exit': False}, 400