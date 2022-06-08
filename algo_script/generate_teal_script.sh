version=2
python3 fido_1.py > fido_1.template${version}.teal
sed -i .bak "s/version 5/version 7/g" fido_1.template${version}.teal
cp fido_1.template${version}.teal ../api/services/algo/scripts/


python3 fido_2.py > fido_2.template${version}.teal
sed -i .bak "s/version 5/version 7/g" fido_2.template${version}.teal
cp fido_2.template${version}.teal ../api/services/algo/scripts/

python3 fido_3.py > fido_3.template${version}.teal
sed -i .bak "s/version 5/version 7/g" fido_3.template${version}.teal
cp fido_3.template${version}.teal ../api/services/algo/scripts/



python3 fido_1_recovery.py > fido_1_recovery.template${version}.teal
sed -i .bak "s/version 5/version 7/g" fido_1_recovery.template${version}.teal
sed -i .bak "s/XQWXNV7XXLCOWY5TKIKKSDAEEIN7J4FRF3SQJ4GES4KL43TGDT2FXY7UVI/RRRRR55555RRRRR55555RRRRR55555RRRRR55555RRRRR5555522224444/g" fido_1_recovery.template${version}.teal
cp fido_1_recovery.template${version}.teal ../api/services/algo/scripts/


python3 fido_2_recovery.py > fido_2_recovery.template${version}.teal
sed -i .bak "s/version 5/version 7/g" fido_2_recovery.template${version}.teal
sed -i .bak "s/XQWXNV7XXLCOWY5TKIKKSDAEEIN7J4FRF3SQJ4GES4KL43TGDT2FXY7UVI/RRRRR55555RRRRR55555RRRRR55555RRRRR55555RRRRR5555522224444/g" fido_2_recovery.template${version}.teal
cp fido_2_recovery.template${version}.teal ../api/services/algo/scripts/

python3 fido_3_recovery.py > fido_3_recovery.template${version}.teal
sed -i .bak "s/version 5/version 7/g" fido_3_recovery.template${version}.teal
sed -i .bak "s/XQWXNV7XXLCOWY5TKIKKSDAEEIN7J4FRF3SQJ4GES4KL43TGDT2FXY7UVI/RRRRR55555RRRRR55555RRRRR55555RRRRR55555RRRRR5555522224444/g" fido_3_recovery.template${version}.teal
cp fido_3_recovery.template${version}.teal ../api/services/algo/scripts/
