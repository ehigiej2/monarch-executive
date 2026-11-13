import unittest
from owow_osayi_contract_bridge import connect

class IntegrationTests(unittest.TestCase):
    def test_roles(self):
        for role in ('terry','osayuki'):
            with self.subTest(role=role):
                result=connect(role)
                self.assertEqual(result['state'],'SYNTHETIC_REVIEW_PREPARED')
                self.assertFalse(result['authority'])
                self.assertFalse(result['network'])
                self.assertFalse(result['model_inference'])
                self.assertEqual(result['voice']['asr'],'NOT_EXECUTED')
                self.assertEqual(result['reasoning']['crown_decision'],'HOLD')
    def test_unknown_role(self):
        self.assertEqual(connect('admin')['state'],'HOLD')
    def test_mic_requested(self):
        self.assertEqual(connect('terry',microphone='ACTIVE')['state'],'HOLD')
    def test_real_transcript(self):
        self.assertEqual(connect('terry',transcript='private')['state'],'HOLD')
    def test_private_data(self):
        self.assertEqual(connect('terry',data_class='PRIVATE')['state'],'HOLD')
    def test_self_review(self):
        self.assertEqual(connect('terry',reviewer_ids=('same','same'))['state'],'HOLD')
    def test_invalid_network_shape(self):
        self.assertEqual(connect('terry',network='yes')['state'],'HOLD')

if __name__=='__main__':
    unittest.main()
