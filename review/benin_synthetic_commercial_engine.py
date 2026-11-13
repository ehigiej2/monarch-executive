#!/usr/bin/env python3
"""Benin City synthetic commercial-intelligence fixtures. Offline, no authority."""
import json
from decimal import Decimal
from pathlib import Path

SCENARIOS = (
 {"id":"BENIN-TRADER-001","role":"terry","area":"Ring Road, Benin City","sector":"provisions","product":"synthetic carton of provisions","buy":"12000","sell":"15500","delivery":"900","other":"500","qty":4,"source":"SYNTHETIC_FIXTURE"},
 {"id":"BENIN-REPAIR-002","role":"terry","area":"Sapele Road, Benin City","sector":"home maintenance","product":"synthetic plumbing service job","buy":"18000","sell":"28000","delivery":"2500","other":"1500","qty":1,"source":"SYNTHETIC_FIXTURE"},
 {"id":"BENIN-HAUL-003","role":"osayuki","area":"Lagos Street, Benin City","sector":"transport","product":"synthetic goods delivery","buy":"6000","sell":"10000","delivery":"1200","other":"800","qty":2,"source":"SYNTHETIC_FIXTURE"},
 {"id":"BENIN-FARM-004","role":"osayuki","area":"Okada–Benin corridor","sector":"agriculture","product":"synthetic farm produce batch","buy":"23000","sell":"29000","delivery":"4200","other":"1400","qty":3,"source":"SYNTHETIC_FIXTURE"}
)
def evaluate(x):
 if x.get('source')!='SYNTHETIC_FIXTURE' or x.get('role') not in ('terry','osayuki'):
  raise ValueError('SOURCE_OR_ROLE_HOLD')
 if type(x.get('qty')) is not int or not 1<=x['qty']<=100:
  raise ValueError('QUANTITY_HOLD')
 amounts=[Decimal(x[k]) for k in ('buy','sell','delivery','other')]
 if any(not a.is_finite() or a<0 for a in amounts):
  raise ValueError('AMOUNT_HOLD')
 buy,sell,delivery,other=amounts
 margin=(sell-buy-delivery-other)*x['qty']
 return {'id':x['id'],'role':x['role'],'area':x['area'],'sector':x['sector'],
 'source':'SYNTHETIC_FIXTURE','net_contribution_ngn':str(margin),
 'decision':'REVIEW_ONLY' if margin>0 else 'NEGATIVE_MARGIN_REVIEW',
 'crown':'HOLD','authority':False,'market_price_verified':False,
 'transaction':'BLOCKED','human_review_required':True}
def main():
 data=[evaluate(x) for x in SCENARIOS]
 print(json.dumps({'schema':'BENIN-COMMERCIAL-SYNTHETIC-001','records':data,'live_data':False,'authority':False},indent=2))
if __name__=='__main__':main()