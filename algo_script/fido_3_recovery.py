from pyteal import *
from inlineasm import *

def verify_fido(pk_x,pk_y,sig_r,sig_s,clientData,authData,server_challenge,nonce, tx_b64):
    decode_tx = InlineAssembly("base64_decode URLEncoding", tx_b64, type = TealType.bytes)
    compute_challenge = Sha256(Concat(tx_b64,nonce,server_challenge))
    extract_challenge = InlineAssembly("json_ref JSONString", clientData, Bytes("challenge"), type = TealType.bytes)
    padded_extract_challenge = Concat(extract_challenge,Bytes("="))
    decode_challenge = InlineAssembly("base64_decode URLEncoding", padded_extract_challenge, type = TealType.bytes)
    message = Sha256(Concat(authData, Sha256(clientData)))
    # verify ecdsa
    verify = InlineAssembly("ecdsa_verify Secp256r1", message,  sig_r, sig_s, Bytes("base64", pk_x),Bytes("base64",pk_y),   type=TealType.uint64)
    return And( Txn.tx_id() == decode_tx, decode_challenge == compute_challenge, verify)

def verify_recovery(public_key, signature):
    ## recovery for rekeying operation
    #return And(Txn.rekey_to() != Global.zero_address() , Ed25519Verify(Txn.tx_id(), signature, Addr(public_key)))
    return Ed25519Verify(Txn.tx_id(), signature, Addr(public_key))

def fido_signature(fido_pk1x,fido_pk1y,fido_pk2x, fido_pk2y, fido_pk3x, fido_pk3y, recovery_pk):

    sig1 = Arg(0)
    sig2 = Arg(1)
    clientData = Arg(2)
    authData = Arg(3)
    server_challenge = Arg(4)
    nonce = Arg(5)
    tx_b64 = Arg(6)


    return (
        If(verify_fido(fido_pk1x,fido_pk1y,sig1, sig2, clientData, authData, server_challenge,nonce,tx_b64))
        .Then(Int(1)) # exit success if fido_pk1 successful
        .ElseIf(verify_fido(fido_pk2x,fido_pk2y,sig1, sig2, clientData, authData, server_challenge,nonce,tx_b64))
        .Then(Int(1)) # exit success if fido2_pk2 successful
        .ElseIf(verify_fido(fido_pk3x,fido_pk3y,sig1, sig2, clientData, authData, server_challenge,nonce,tx_b64))
        .Then(Int(1)) # exit success if fido_pk3 successful
        .ElseIf(verify_recovery(recovery_pk,sig1))
        .Then(Int(1)) # exit success if recovery successful
        .Else(Int(0)) # exit fail
    )



if __name__ == "__main__":
    fido_1_x   = "FIDO1111XXXX"
    fido_1_y   = "FIDO1111YYYY"
    fido_2_x   = "FIDO2222XXXX"
    fido_2_y   = "FIDO2222YYYY"
    fido_3_x   = "FIDO3333XXXX"
    fido_3_y   = "FIDO3333YYYY"
    recovery_template = "XQWXNV7XXLCOWY5TKIKKSDAEEIN7J4FRF3SQJ4GES4KL43TGDT2FXY7UVI"
    #recovery_template = "RECOVERY"

    program = fido_signature(
        fido_1_x,fido_1_y, fido_2_x, fido_2_y, fido_3_x, fido_3_y, recovery_template
    )
    print(compileTeal(program, mode=Mode.Signature, version=5))
