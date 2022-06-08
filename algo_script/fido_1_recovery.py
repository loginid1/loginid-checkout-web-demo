from pyteal import *
from fido_util import *


def fido_signature(fido2_pk1x,fido2_pk1y,recovery_pk):

    sig1 = Arg(0)
    sig2 = Arg(1)
    clientData = Arg(2)
    authData = Arg(3)
    server_challenge = Arg(4)
    tx_b64 = Arg(5)


    return (
        If(verify_fido(fido2_pk1x,fido2_pk1y,sig1, sig2, clientData, authData, server_challenge,tx_b64))
        .Then(Int(1)) # exit success if fido2_pk1 successful
        .ElseIf(verify_recovery(recovery_pk,sig1))
        .Then(Int(1)) # exit success if recovery successful
        .Else(Int(0)) # exit fail
    )



if __name__ == "__main__":
    #fido_1_x   = "LC6oXWgQnlg9b1eBFPQ54TG+e3g6q5j/thLOA6OWfRY="
    #fido_1_y   = "S3I3dWk1WCJrHoYFilN4Jy1TsdSgVPSHMLZ7tyrQIbk="
    fido_1_x   = "FIDO1111XXXX"
    fido_1_y   = "FIDO1111YYYY"
    recovery_template = "XQWXNV7XXLCOWY5TKIKKSDAEEIN7J4FRF3SQJ4GES4KL43TGDT2FXY7UVI"

    program = fido_signature(
        fido_1_x,fido_1_y, recovery_template
    )
    print(compileTeal(program, mode=Mode.Signature, version=5))
