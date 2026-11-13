"""Benin City synthetic Osayi explanation orchestrator: deterministic fallback."""
from benin_explanation_gate import review_explanation

def explain(record, candidate):
    if not isinstance(record,dict) or record.get('source')!='SYNTHETIC_FIXTURE' or record.get('authority') is not False or record.get('crown')!='HOLD' or record.get('transaction')!='BLOCKED' or record.get('market_price_verified') is not False or record.get('role') not in ('terry','osayuki'):
        return {'state':'HOLD','authority':False,'text':'No validated synthetic commercial record available.'}
    check=review_explanation(record,candidate)
    amount=record['net_contribution_ngn']
    if check['reason']=='AMOUNT_SCOPE_HOLD':
        return {'state':'HOLD','authority':False,'text':'Invalid commercial amount.'}
    # Never promote model text into user-visible advice until independent language and safety qualification.
    # The model is evaluated for diagnostics only; the displayed explanation is deterministic.
    try:
        area=str(record['area'])
        sector=str(record['sector'])
        if not area or not sector or len(area)>120 or len(sector)>80 or any(ord(c)<32 for c in area+sector):
            raise ValueError('INVALID_LABEL')
    except (KeyError,TypeError,ValueError):
        return {'state':'HOLD','authority':False,'text':'Invalid commercial scenario.'}
    text=('Na synthetic test for '+sector+' around '+area+'. '
          'Calculator show ₦'+amount+' contribution after listed costs. '
          'No be verified market price or guaranteed profit. '
          'CROWN HOLD: human must review; no payment or action allowed.')
    return {'state':'DETERMINISTIC_FALLBACK','role':record['role'],'text':text,
            'model_candidate_accepted':False,'model_gate_reason':check['reason'],
            'authority':False,'transaction':'BLOCKED','human_review_required':True,
            'data_source':'SYNTHETIC_FIXTURE','live_voice':False}