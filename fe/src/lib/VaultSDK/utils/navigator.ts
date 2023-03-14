import { NavigatorError } from "./errors";
import { base64ToBuffer } from "./encoding";

export const createCredential = async (options: CredentialCreationOptions): Promise<PublicKeyCredential> => {
    try {
        const credential = await navigator.credentials.create(options);
        if (credential !== null) {
            return <PublicKeyCredential> credential;
        }
    } catch (e) {
        throw new NavigatorError();
    }
    throw new NavigatorError();
}

export const getCredential = async (options: CredentialRequestOptions): Promise<PublicKeyCredential> => {
    try {
        const credential = await navigator.credentials.get(options);
        if (credential !== null) {
            return <PublicKeyCredential> credential;
        }
    } catch (e) {
        console.log("failed navigator", e);
        throw new NavigatorError();
    }
    throw new NavigatorError();
}

export const convertCredentialDescriptor = (credential: { [key: string]: any }): PublicKeyCredentialDescriptor => {
    const desc = <PublicKeyCredentialDescriptor>{
        id: base64ToBuffer(credential.id),
        type: credential.type,
    };
    if (credential.transports) {
        desc.transports = credential.transports;
    }
    return desc;
}
