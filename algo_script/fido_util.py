#!/usr/bin/python3
from pyteal import *
from inlineasm import *

def verify_fido(pk_x,pk_y,sig_r,sig_s,clientData,authData,server_challenge,tx_b64):
    decode_tx = InlineAssembly("base64_decode URLEncoding", tx_b64, type = TealType.bytes)
    compute_challenge = Sha256(Concat(tx_b64,server_challenge))
    extract_challenge = InlineAssembly("json_ref JSONString", clientData, Bytes("challenge"), type = TealType.bytes)
    #padded_extract_challenge = Concat(extract_challenge,Bytes("="))
    #decode_challenge = InlineAssembly("base64_decode URLEncoding", padded_extract_challenge, type = TealType.bytes)
    decode_challenge = InlineAssembly("base64_decode URLEncoding", extract_challenge, type = TealType.bytes)
    message = Sha256(Concat(authData, Sha256(clientData)))
    # verify ecdsa
    verify = InlineAssembly("ecdsa_verify Secp256r1", message,  sig_r, sig_s, Bytes("base64", pk_x),Bytes("base64",pk_y),   type=TealType.uint64)
    return And( Txn.tx_id() == decode_tx, decode_challenge == compute_challenge, verify)

def verify_recovery(public_key, signature):
    return Ed25519Verify(Txn.tx_id(), signature, Addr(public_key))