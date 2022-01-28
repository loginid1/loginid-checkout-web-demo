import utils from "../utils";

export class Browser {
    /**
     * Detect if FIDO2 supported
     * @returns {Promise<boolean>}
     * */
    async isFido2Supported(): Promise<boolean>  {
        try {
            if (!window.PublicKeyCredential || !window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
                return false;
            }
            return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        } catch (err) {
            return false;
        }
    }

    /**
     * Handler to abstract the interaction with AuthID iFrame flow for Proof and Verify.
     * @returns {Promise<void>}
     * */
    async authidIframeHandler(element: HTMLElement, src: string): Promise<void> {
        return await utils.authidIframeHandler(element, src);
    }
}

export default Browser;
