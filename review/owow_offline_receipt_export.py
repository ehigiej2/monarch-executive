#!/usr/bin/env python3
"""Offline-only, bounded receipt export from recovered AION and reasoning contracts.

Usage: python3 review/owow_offline_receipt_export.py --output NEW_DIRECTORY
No server, no browser bridge, no production writes. This is a build-time snapshot.
"""
import argparse
import hashlib
import json
from pathlib import Path
from owow_osayi_contract_bridge import connect

FIELDS=('state','role','authority','network','asr','tts','model_inference','human_review_required')
def receipts():
    output={}
    for role in ('terry','osayuki'):
        result=connect(role)
        if result.get('state')!='SYNTHETIC_REVIEW_PREPARED' or result.get('authority') is not False or result.get('network') is not False:
            raise ValueError('INTEGRATION_HOLD')
        if result.get('voice',{}).get('asr')!='NOT_EXECUTED' or result.get('reasoning',{}).get('crown_decision')!='HOLD':
            raise ValueError('CONTRACT_HOLD')
        safe={key:result[key] for key in FIELDS}
        safe['voice_state']=result['voice']['state']
        safe['reasoning_state']=result['reasoning']['state']
        safe['crown']='HOLD'
        safe['source']='RECOVERED_LOCAL_CONTRACTS'
        safe['kind']='BUILD_TIME_SYNTHETIC_SNAPSHOT'
        output[role]=safe
    return output

def export(output_dir):
    target=Path(output_dir)
    if target.exists(): raise FileExistsError('REFUSE_OVERWRITE')
    result=receipts()
    target.mkdir(parents=True)
    for role,receipt in result.items():
        data=json.dumps(receipt,sort_keys=True,indent=2)+'\n'
        (target/(role+'-synthetic-contract-receipt.json')).write_text(data,encoding='utf-8')
    return {role:hashlib.sha256((target/(role+'-synthetic-contract-receipt.json')).read_bytes()).hexdigest() for role in result}

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--output',required=True)
    args=parser.parse_args()
    print(json.dumps({'sha256':export(args.output),'authority':False,'network':False},sort_keys=True))
