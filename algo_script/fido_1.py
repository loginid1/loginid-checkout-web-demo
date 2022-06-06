from pyteal import *
from fido_util import *


def fido_signature(fido2_pk1x,fido2_pk1y):

    sig1 = Arg(0)
    sig2 = Arg(1)
    clientData = Arg(2)
    authData = Arg(3)
    server_challenge = Arg(4)
    tx_b64 = Arg(5)


    return (
        If(verify_fido(fido2_pk1x,fido2_pk1y,sig1, sig2, clientData, authData, server_challenge,tx_b64))
        .Then(Int(1)) # exit success if fido2_pk1 successful
        .Else(Int(0)) # exit fail
    )



if __name__ == "__main__":
    fido_1_x   = "FIDO1111XXXX"
    fido_1_y   = "FIDO1111YYYY"

    program = fido_signature(
        fido_1_x,fido_1_y 
    )
    print(compileTeal(program, mode=Mode.Signature, version=5))
