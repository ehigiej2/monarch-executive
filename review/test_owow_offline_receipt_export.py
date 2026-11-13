import unittest
from unittest.mock import patch
from pathlib import Path
import tempfile
from owow_offline_receipt_export import receipts,export

class OfflineReceiptTests(unittest.TestCase):
    def test_both_roles_and_no_authority(self):
        data=receipts()
        self.assertEqual(set(data),{'terry','osayuki'})
        for role,item in data.items():
            self.assertEqual(item['role'],role)
            self.assertEqual(item['state'],'SYNTHETIC_REVIEW_PREPARED')
            self.assertEqual(item['crown'],'HOLD')
            self.assertFalse(item['authority'])
            self.assertFalse(item['network'])
            self.assertFalse(item['model_inference'])
            self.assertEqual(item['asr'],'NOT_EXECUTED')
            self.assertEqual(item['tts'],'NOT_EXECUTED')
            self.assertTrue(item['human_review_required'])
            self.assertEqual(item['kind'],'BUILD_TIME_SYNTHETIC_SNAPSHOT')
    def test_export_refuses_overwrite(self):
        with tempfile.TemporaryDirectory() as root:
            target=Path(root)/'receipts'
            hashes=export(target)
            self.assertEqual(set(hashes),{'terry','osayuki'})
            self.assertEqual(len(list(target.glob('*.json'))),2)
            with self.assertRaises(FileExistsError): export(target)
    def test_contract_failure_prevents_output(self):
        with tempfile.TemporaryDirectory() as root:
            target=Path(root)/'receipts'
            with patch('owow_offline_receipt_export.connect',return_value={'state':'HOLD','authority':False}):
                with self.assertRaises(ValueError): export(target)
            self.assertFalse(target.exists())
if __name__=='__main__':unittest.main()
