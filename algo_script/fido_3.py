from pyteal import *
from fido_util import *

def fido_signature(fido_pk1x,fido_pk1y,fido_pk2x, fido_pk2y, fido_pk3x, fido_pk3y):

    sig1 = Arg(0)
    sig2 = Arg(1)
    clientData = Arg(2)
    authData = Arg(3)
    server_challenge = Arg(4)
    tx_b64 = Arg(5)


    return (
        If(verify_fido(fido_pk1x,fido_pk1y,sig1, sig2, clientData, authData, server_challenge,tx_b64))
        .Then(Int(1)) # exit success if fido_pk1 successful
        .ElseIf(verify_fido(fido_pk2x,fido_pk2y,sig1, sig2, clientData, authData, server_challenge,tx_b64))
        .Then(Int(1)) # exit success if fido2_pk2 successful
        .ElseIf(verify_fido(fido_pk3x,fido_pk3y,sig1, sig2, clientData, authData, server_challenge,tx_b64))
        .Then(Int(1)) # exit success if fido_pk3 successful
        .Else(Int(0)) # exit fail
    )



if __name__ == "__main__":
    fido_1_x   = "FIDO1111XXXX"
    fido_1_y   = "FIDO1111YYYY"
    fido_2_x   = "FIDO2222XXXX"
    fido_2_y   = "FIDO2222YYYY"
    fido_3_x   = "FIDO3333XXXX"
    fido_3_y   = "FIDO3333YYYY"
    #recovery_template = "RECOVERY"

    program = fido_signature(
        fido_1_x,fido_1_y, fido_2_x, fido_2_y, fido_3_x, fido_3_y
    )
    print(compileTeal(program, mode=Mode.Signature, version=5))
