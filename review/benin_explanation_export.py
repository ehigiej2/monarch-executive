"""Export deterministic Benin synthetic explanations, no model promotion."""
import json,sys
from pathlib import Path
from benin_synthetic_commercial_engine import SCENARIOS,evaluate
from benin_osayi_explanation_orchestrator import explain
def generate():
 records=[]
 for fixture in SCENARIOS:
  evaluated=evaluate(fixture)
  result=explain(evaluated,'')
  if result.get('state')!='DETERMINISTIC_FALLBACK' or result.get('authority') is not False or result.get('transaction')!='BLOCKED' or result.get('role')!=evaluated['role']:
   raise ValueError('EXPLANATION_HOLD')
  records.append({'id':evaluated['id'],'role':evaluated['role'],'text':result['text'],'authority':False,'transaction':'BLOCKED','source':'SYNTHETIC_FIXTURE','human_review_required':True})
 return {'schema':'BENIN-EXPLANATIONS-SYNTHETIC-001','records':records,'authority':False}
if __name__=='__main__':
 if len(sys.argv)!=2:raise SystemExit('USAGE: python3 benin_explanation_export.py NEW_FILE')
 dest=Path(sys.argv[1])
 with dest.open('x',encoding='utf8') as f:json.dump(generate(),f,ensure_ascii=False,indent=2)