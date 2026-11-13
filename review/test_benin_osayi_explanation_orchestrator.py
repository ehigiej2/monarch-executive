import unittest
from benin_osayi_explanation_orchestrator import explain
from benin_synthetic_commercial_engine import SCENARIOS,evaluate
class ExplanationTests(unittest.TestCase):
 def test_four_role_scoped_fallbacks(self):
  for fixture in SCENARIOS:
   result=explain(evaluate(fixture),'Unsupported synthetic 10% margin')
   self.assertEqual(result['state'],'DETERMINISTIC_FALLBACK')
   self.assertEqual(result['role'],fixture['role'])
   self.assertFalse(result['model_candidate_accepted'])
   self.assertIn('CROWN HOLD',result['text'])
   self.assertIn('₦'+evaluate(fixture)['net_contribution_ngn'],result['text'])
 def test_model_candidate_not_promoted_even_when_numeric_check_passes(self):
  result=explain(evaluate(SCENARIOS[0]),'Synthetic contribution ₦8400.')
  self.assertEqual(result['model_gate_reason'],'NUMERIC_AND_DISCLOSURE_PRECHECK_PASS')
  self.assertFalse(result['model_candidate_accepted'])
  self.assertNotEqual(result['text'],'Synthetic contribution ₦8400.')
 def test_real_record_hold(self):
  r=evaluate(SCENARIOS[0]);r['source']='LIVE'
  self.assertEqual(explain(r,'anything')['state'],'HOLD')
 def test_authority_hold(self):
  r=evaluate(SCENARIOS[0]);r['authority']=True
  self.assertEqual(explain(r,'anything')['state'],'HOLD')
 def test_malformed_labels_hold(self):
  r=evaluate(SCENARIOS[0]);r['area']='Bad\nArea'
  self.assertEqual(explain(r,'anything')['state'],'HOLD')
if __name__=='__main__':unittest.main()