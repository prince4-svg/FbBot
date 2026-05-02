import os
import importlib
from flask import Blueprint


GREEN = '\033[92m'
RESET = '\033[0m'


main_bp = Blueprint('main', __name__)
path = os.path.dirname(__file__)


print()
for file in os.listdir(path):
    if file.endswith('.py') and file != '__init__.py':
        module_name = file[:-3]
        
        try:
            module = importlib.import_module(f'{__name__}.{module_name}')
            
            if hasattr(module, 'bp'):
                main_bp.register_blueprint(module.bp)
                print(f'{GREEN}[Loaded]:{RESET} {module_name}')
                
        except Exception as e:
            print(f'[ERROR importing]: {module_name}: {e}')
			
			
print()			