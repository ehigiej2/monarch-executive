import unittest
from benin_explanation_gate import review_explanation
BASE={'source':'SYNTHETIC_FIXTURE','authority':False,'net_contribution_ngn':'8400'}
class GateTests(unittest.TestCase):
 def test_valid_candidate_still_needs_human(self):
  r=review_explanation(BASE,'This synthetic example shows ₦8400 contribution. Na test only.')
  self.assertFalse(r['approved'])
  self.assertEqual(r['reason'],'NUMERIC_AND_DISCLOSURE_PRECHECK_PASS')
 def test_hallucinated_percentage(self):
  self.assertEqual(review_explanation(BASE,'Synthetic margin 10% and ₦8400.')['reason'],'UNSUPPORTED_NUMERIC_CLAIM')
 def test_missing_amount(self):
  self.assertEqual(review_explanation(BASE,'Synthetic example of a business.')['reason'],'REQUIRED_AMOUNT_MISSING')
 def test_no_disclosure(self):
  self.assertEqual(review_explanation(BASE,'Contribution ₦8400.')['reason'],'SYNTHETIC_DISCLOSURE_MISSING')
 def test_payment_redirection(self):
  self.assertEqual(review_explanation(BASE,'Synthetic contribution ₦8400. Pay now.')['reason'],'UNAUTHORISED_ACTION_LANGUAGE')
 def test_real_record_rejected(self):
  self.assertEqual(review_explanation({**BASE,'source':'LIVE'},'Synthetic ₦8400.')['reason'],'RECORD_SCOPE_HOLD')
 def test_empty_rejected(self):
  self.assertEqual(review_explanation(BASE,'')['reason'],'TEXT_SCOPE_HOLD')
if __name__=='__main__':unittest.main()