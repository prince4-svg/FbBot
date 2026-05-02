from decimal import Decimal as RealDecimal


def Decimal(num):
    clean = str(num).strip().replace(',', '')
    return RealDecimal(clean)