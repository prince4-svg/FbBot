from flask import Blueprint, request, jsonify
from logger import log
from decimal import getcontext
from wrapper import Decimal


getcontext().prec = 100_000
bp = Blueprint('calculate', __name__)


def format_num(result) -> str:
    if result == 0:
        return "0"
    
    if result <= 1_000_000:
        num = result.normalize()
        if num == num.to_integral_value():
            return f"{int(num):,}"
			
        else:
            return f"{num:,}"
    
    return f"{result:.2e}"


def calculate(bal: str, operation: str, offset: str):
    try:
        num_bal = Decimal(bal)
        num_offset = Decimal(offset)
		
    except:
        return {'success': False, 'value': None, 'msg': '⚠️ Invalid numbers'}
    
    if operation == 'add':
        result = num_bal + num_offset
		
    elif operation == 'sub':
        result = num_bal - num_offset
		
    elif operation == 'mul':
        result = num_bal * num_offset
		
    elif operation == 'div':
        if num_offset == 0:
            return {'success': False, 'value': None, 'msg': '⚠️ Division by zero'}
			
        result = num_bal // num_offset
		
    else:
        return {'success': False, 'value': None, 'msg': '⚠️ Invalid operation'}
    
    if result < 0:
        result = RealDecimal(0)
    
    value_str = format_num(result)  # ← Ayos na name
    return {'success': True, 'value': value_str, 'msg': None}


@bp.route('/calculate', methods=['POST'])
def calculate_route():
    req = request.get_json(force=True, silent=True)
    log(req)
	
    payload = req.get('data') or {}
    result = calculate(
        bal=payload.get('bal', '0'),
        operation=payload.get('operation', 'add'),
        offset=payload.get('offset', '0')
    )
    return jsonify(result)