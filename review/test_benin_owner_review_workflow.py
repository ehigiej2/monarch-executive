import unittest
from benin_owner_review_workflow import prepare,export
from benin_synthetic_commercial_engine import SCENARIOS
class OwnerReviewTests(unittest.TestCase):
 def test_complete_review_set(self):
  result=export(SCENARIOS)
  self.assertEqual(len(result['records']),4)
  for r in result['records']:
   self.assertEqual(len(r['stages']),5)
   self.assertEqual(r['decision'],'OWNER_REVIEW_REQUIRED')
   self.assertFalse(r['authority'])
   self.assertEqual(r['transaction'],'BLOCKED')
   self.assertEqual(len(r['sha256']),64)
   self.assertEqual(len(r['missing_evidence']),6)
 def test_repeatable(self):
  self.assertEqual(export(SCENARIOS),export(SCENARIOS))
 def test_real_data_rejected(self):
  with self.assertRaises(ValueError):prepare({**SCENARIOS[0],'source':'LIVE'})
 def test_duplicate_rejected(self):
  with self.assertRaises(ValueError):export([SCENARIOS[0]]*4)
 def test_invalid_id_rejected(self):
  with self.assertRaises(ValueError):prepare({**SCENARIOS[0],'id':'../../bad'})
 def test_unbalanced_roles_rejected(self):
  with self.assertRaises(ValueError):export([SCENARIOS[0],SCENARIOS[1],{**SCENARIOS[2],'role':'terry'},SCENARIOS[3]])
if __name__=='__main__':unittest.main()