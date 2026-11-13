"""OWOW Benin synthetic workflow: capture -> calculate -> explain -> evidence -> review."""
import hashlib,json,re
from benin_synthetic_commercial_engine import evaluate
from benin_osayi_explanation_orchestrator import explain

def prepare(fixture, candidate=''):
    if not isinstance(fixture,dict) or fixture.get('source')!='SYNTHETIC_FIXTURE':
        raise ValueError('CAPTURE_SCOPE_HOLD')
    if not re.fullmatch(r'BENIN-[A-Z]+-[0-9]{3}',fixture.get('id','')):
        raise ValueError('REQUEST_ID_HOLD')
    if fixture.get('role') not in ('terry','osayuki'):
        raise ValueError('ROLE_HOLD')
    calculation=evaluate(fixture)
    explanation=explain(calculation,candidate)
    if explanation.get('state')!='DETERMINISTIC_FALLBACK' or explanation.get('authority') is not False:
        raise ValueError('EXPLANATION_HOLD')
    missing=['verified_buy_price','verified_sell_price','verified_delivery_cost','verified_other_cost','supplier_identity_and_consent','customer_request_and_consent']
    record={'schema':'BENIN-OWNER-REVIEW-001','request_id':fixture['id'],'role':fixture['role'],
        'stages':['CAPTURED_SYNTHETIC','CALCULATED_SYNTHETIC','EXPLAINED_DETERMINISTIC','EVIDENCE_GAPS_IDENTIFIED','OWNER_REVIEW_DRAFT'],
        'calculation':calculation,'explanation':explanation['text'],
        'missing_evidence':missing,'decision':'OWNER_REVIEW_REQUIRED',
        'authority':False,'crown':'HOLD','transaction':'BLOCKED','external_contact':'BLOCKED',
        'real_customer_data':False,'human_review_required':True}
    canonical=json.dumps(record,sort_keys=True,ensure_ascii=False,separators=(',',':')).encode()
    record['sha256']=hashlib.sha256(canonical).hexdigest()
    return record

def export(fixtures):
    if not isinstance(fixtures,(list,tuple)) or len(fixtures)!=4:raise ValueError('FIXTURE_SET_HOLD')
    records=[prepare(f) for f in fixtures]
    if len(set(r['request_id'] for r in records))!=4:raise ValueError('DUPLICATE_HOLD')
    if sum(r['role']=='terry' for r in records)!=2 or sum(r['role']=='osayuki' for r in records)!=2:
        raise ValueError('ROLE_DISTRIBUTION_HOLD')
    return {'schema':'BENIN-OWNER-REVIEW-SET-001','records':records,'authority':False,'live_data':False}

if __name__=='__main__':
    import sys
    from pathlib import Path
    from benin_synthetic_commercial_engine import SCENARIOS
    if len(sys.argv)!=2:raise SystemExit('USAGE: python3 benin_owner_review_workflow.py NEW_OUTPUT')
    with Path(sys.argv[1]).open('x',encoding='utf8') as f:
        json.dump(export(SCENARIOS),f,indent=2,ensure_ascii=False)