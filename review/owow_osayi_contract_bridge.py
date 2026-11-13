#!/usr/bin/env python3
"""Synthetic-only integration of recovered AION and dual reasoning. No IO effects."""
import sys
from pathlib import Path
VOICE=Path('/home/ehigiej2/MONARCH_Offline/data/recovery/AION_COMM_V01_ISOLATED_20261029')
REASON=Path('/home/ehigiej2/MONARCH_Offline/integrations')
sys.path[:0]=[str(VOICE),str(REASON)]
from aion_monarch_bridge_v0_1 import offline_voice_preflight
from founder_outcome_orchestrator_v1 import plan
from dual_reasoning_contract_v1 import reconcile

ROLES={'terry':{'locale':'NIGERIAN_PIDGIN_EDO_PILOT','mission':'SYNTH-TERRY'},
       'osayuki':{'locale':'NIGERIAN_PIDGIN_EDO_PILOT','mission':'SYNTH-OSAYUKI'}}
def connect(role, *, microphone='DENIED', network=False, transcript=None, data_class='SYNTHETIC', reviewer_ids=('architect-synthetic','critic-synthetic')):
    if role not in ROLES or microphone not in ('DENIED','UNAVAILABLE') or type(network) is not bool:
        return {'state':'HOLD','reason':'INPUT_SCOPE_REFUSED','authority':False}
    v=offline_voice_preflight(locale=ROLES[role]['locale'],network_available=network,transcript=transcript,data_class=data_class)
    if v.get('state')!='OFFLINE_ADVISORY_FALLBACK_ONLY' or v.get('authority') is not False or v.get('network') is not False:
        return {'state':'HOLD','reason':v.get('reason','VOICE_PREFLIGHT_REFUSED'),'authority':False,'voice':v}
    p=plan(mission_id=ROLES[role]['mission'],text='build an app for synthetic review only')
    ids=[x['package_id'] for x in p['packages']]
    a={'role':'ARCHITECT','producer_id':reviewer_ids[0],'plan_sha256':p['sha256'],'reviewed_packages':ids}
    c={'role':'CRITIC','producer_id':reviewer_ids[1],'plan_sha256':p['sha256'],'reviewed_packages':ids,'verdict':'PASS','unresolved_findings':[]}
    r=reconcile(p,a,c)
    if r.get('state')!='REVIEWED_PREPARATION_ONLY' or r.get('authority') is not False:
        return {'state':'HOLD','reason':r.get('reason',r.get('state')),'authority':False,'voice':v,'reasoning':r}
    return {'state':'SYNTHETIC_REVIEW_PREPARED','role':role,'voice':v,'reasoning':r,'authority':False,'send':'BLOCKED','network':False,'asr':'NOT_EXECUTED','tts':'NOT_EXECUTED','model_inference':False,'human_review_required':True}