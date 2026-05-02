import re
from flask import Blueprint, request, jsonify
from logger import log
from decimal import getcontext
from wrapper import Decimal


getcontext().prec = 100_000
bp = Blueprint('validate_bet', __name__)


def check_bet(bet: str, bal: str, body1='bet', body2='balance'):
    if not bet:
        return {'valid': False, 'value': 'exit', 'msg': f'⚠️ Enter your {body1}.'}
    
    if bet.lower() == 'all':
        try:
            num_bal = Decimal(bal)
			
        except:
            return {'valid': False, 'value': 'exit', 'msg': f'⚠️ Invalid {body2}'}
			
        if num_bal <= 0:
            return {'valid': False, 'value': 'exit', 'msg': f'⚠️ Not enough {body2}'}
			
        return {'valid': True, 'value': 'all', 'msg': None}
    
    bet_lower = bet.strip().lower()
    
    if 'e' in bet_lower:
        if ',' in bet:
            return {'valid': False, 'value': 'exit', 'msg': f'⚠️ Enter a valid {body1}.'}
			
        if not re.fullmatch(r'\d+(\.\d+)?e\d+', bet_lower):
            return {'valid': False, 'value': 'exit', 'msg': f'⚠️ Enter a valid {body1}.'}
    else:
        if '.' in bet:
            return {'valid': False, 'value': 'exit', 'msg': '⚠️ Use whole number for literal number.'}
        
        if len(bet.strip().replace(',', '')) > 7:
            if not re.fullmatch(r'^\d{1,3}(,\d{3})*$|^\d+$', bet):
                return {'valid': False, 'value': 'exit', 'msg': '⚠️ Use whole number for literal number.'}
				
            return {'valid': False, 'value': 'exit', 'msg': '⚠️ Use e notation for big bet.'}
        
        if not re.fullmatch(r'^\d{1,3}(,\d{3})*$|^\d+$', bet):
            return {'valid': False, 'value': 'exit', 'msg': '⚠️ Use whole number for literal number.'}
    
    try:
        num_bet = Decimal(bet.strip().replace(',', ''))
        num_bal = Decimal(bal)
		
    except:
        return {'valid': False, 'value': 'exit', 'msg': f'⚠️ Please enter a valid and positive {body1}'}
    
    if num_bet <= 0:
        return {'valid': False, 'value': 'exit', 'msg': f'⚠️ Please enter a valid and positive {body1}'}
    
    if num_bet > num_bal:
        return {'valid': False, 'value': 'exit', 'msg': f'⚠️ Not enough {body2}'}
    
    value_str = f"{num_bet:.2e}" if num_bet >= 1000 else str(num_bet)
    return {'valid': True, 'value': value_str, 'msg': None}


@bp.route('/validate_bet', methods=['POST'])
def validate_bet():
    req = request.get_json(force=True, silent=True)
    log(req)
    payload = req.get('data') or {}
    result = check_bet(
        bet=payload.get('userBet', ''),
        bal=payload.get('userBal', ''),
        body1=payload.get('body1', 'bet'),
        body2=payload.get('body2', 'balance')
    )
    return jsonify(result)