"""Fail-closed Osayi synthetic commercial explanation gate."""
import re

def review_explanation(record, candidate):
    base={'authority':False,'crown':'HOLD','approved':False,'human_review_required':True,'transaction':'BLOCKED'}
    if not isinstance(record,dict) or record.get('source')!='SYNTHETIC_FIXTURE' or record.get('authority') is not False:
        return dict(base,reason='RECORD_SCOPE_HOLD')
    amount=record.get('net_contribution_ngn')
    if not isinstance(amount,str) or not re.fullmatch(r'-?[0-9]+(?:\.[0-9]+)?',amount):
        return dict(base,reason='AMOUNT_SCOPE_HOLD')
    if not isinstance(candidate,str) or len(candidate)>800 or not candidate.strip():
        return dict(base,reason='TEXT_SCOPE_HOLD')
    # Do not rely on model-produced figures; forbid any numeric claim not in the source.
    numeric=re.findall(r'(?<!\w)[-]?[0-9][0-9,]*(?:\.[0-9]+)?%?',candidate)
    allowed=amount.replace(',','')
    for number in numeric:
        normalized=number.replace(',','')
        if normalized!=allowed:
            return dict(base,reason='UNSUPPORTED_NUMERIC_CLAIM')
    if allowed not in candidate.replace(',',''):
        return dict(base,reason='REQUIRED_AMOUNT_MISSING')
    if not re.search(r'(?i)synthetic|fictional|illustrative|test only',candidate):
        return dict(base,reason='SYNTHETIC_DISCLOSURE_MISSING')
    if re.search(r'(?i)pay now|send money|transfer funds|approved to pay|guaranteed profit',candidate):
        return dict(base,reason='UNAUTHORISED_ACTION_LANGUAGE')
    # Pidgin quality and factual fidelity still require a separate human-language review.
    return dict(base,reason='NUMERIC_AND_DISCLOSURE_PRECHECK_PASS',approved=False,
                language_quality='UNKNOWN',factual_quality='HUMAN_REVIEW_REQUIRED')