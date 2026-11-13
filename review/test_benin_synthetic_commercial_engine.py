import unittest
from benin_synthetic_commercial_engine import SCENARIOS,evaluate
class BeninTests(unittest.TestCase):
 def test_four_scenarios(self):
  self.assertEqual(len(SCENARIOS),4)
  for x in SCENARIOS:
   r=evaluate(x)
   self.assertFalse(r['authority'])
   self.assertFalse(r['market_price_verified'])
   self.assertEqual(r['transaction'],'BLOCKED')
 def test_negative_margin_flagged(self):
  x=dict(SCENARIOS[0],sell='100')
  self.assertEqual(evaluate(x)['decision'],'NEGATIVE_MARGIN_REVIEW')
 def test_real_data_refused(self):
  x=dict(SCENARIOS[0],source='LIVE')
  with self.assertRaises(ValueError):evaluate(x)
 def test_negative_cost_refused(self):
  x=dict(SCENARIOS[0],buy='-1')
  with self.assertRaises(ValueError):evaluate(x)
 def test_nan_refused(self):
  x=dict(SCENARIOS[0],sell='NaN')
  with self.assertRaises(ValueError):evaluate(x)
 def test_invalid_role_refused(self):
  x=dict(SCENARIOS[0],role='admin')
  with self.assertRaises(ValueError):evaluate(x)
if __name__=='__main__':unittest.main()