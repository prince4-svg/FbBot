from flask import Blueprint, request, jsonify
from logger import log
from decimal import getcontext
from wrapper import Decimal


getcontext().prec = 100_000
bp = Blueprint('compare', __name__)


@bp.route('/compare', methods=['POST'])
def compare_route():
    req = request.get_json(force=True, silent=True)
    log(req)
    payload = req.get('data') or {}
    
    a = payload.get('a', '0')
    b = payload.get('b', '0')
    
    try:
        num_a = Decimal(a)
        num_b = Decimal(b)
		
    except:
        return jsonify({'success': False, 'result': 0, 'msg': '⚠️ Invalid numbers'})
    
    if num_a > num_b:
        result = 1
        
    elif num_a < num_b:
        result = -1
        
    else:
        result = 0
    
    return jsonify({'success': True, 'result': result, 'msg': None})