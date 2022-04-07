from pyteal import *
from inlineasm import *

def verify_fido(pk_x,pk_y,sig_r,sig_s,clientData,authData,server_challenge):
    compute_challenge = Sha256(Concat(Txn.tx_id(),Txn.lease(),server_challenge))
    extract_challenge = InlineAssembly("json_ref JSONString", clientData, Bytes("challenge"), type = TealType.bytes)
    padded_extract_challenge = Concat(extract_challenge,Bytes("="))
    decode_challenge = InlineAssembly("base64_decode URLEncoding", padded_extract_challenge, type = TealType.bytes)
    message = Sha256(Concat(authData, Sha256(clientData)))
    # verify ecdsa
    verify = InlineAssembly("ecdsa_verify Secp256r1", message,  sig_r, sig_s, Bytes("base64", pk_x),Bytes("base64",pk_y),   type=TealType.uint64)
    return And( decode_challenge == compute_challenge, verify)

def verify_recovery(public_key, signature):
    return And(Txn.type_enum() == TxnType.KeyRegistration , Ed25519Verify(Txn.tx_id(), signature, Addr(public_key)))

def fido_signature(fido2_pk1x,fido2_pk1y,recovery_pk):

    sig1 = Arg(0)
    sig2 = Arg(1)
    clientData = Arg(2)
    authData = Arg(3)
    server_challenge = Arg(4)


    return (
        If(verify_fido(fido2_pk1x,fido2_pk1y,sig1, sig2, clientData, authData, server_challenge))
        .Then(Int(1)) # exit success if fido2_pk1 successful
        .ElseIf(verify_recovery(recovery_pk,sig1))
        .Then(Int(1)) # exit success if recovery successful
        .Else(Int(0)) # exit fail
    )



if __name__ == "__main__":
    fido_1_x   = "LC6oXWgQnlg9b1eBFPQ54TG+e3g6q5j/thLOA6OWfRY="
    fido_1_y   = "S3I3dWk1WCJrHoYFilN4Jy1TsdSgVPSHMLZ7tyrQIbk="
    recovery_template = "XQWXNV7XXLCOWY5TKIKKSDAEEIN7J4FRF3SQJ4GES4KL43TGDT2FXY7UVI"

    program = fido_signature(
        fido_1_x,fido_1_y, recovery_template
    )
    print(compileTeal(program, mode=Mode.Signature, version=5))
