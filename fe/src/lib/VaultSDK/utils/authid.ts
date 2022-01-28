type KYCType = "verify" | "proof" | "both";

interface IKYCPages {
    isSuccessful: boolean;
    isFinalPage: boolean;
    action: KYCType;
}

interface IKYCPagesMapping {
    [key: string]: IKYCPages;
}

/**
 * Mapping of page names to actions and results.
 */
const pages: IKYCPagesMapping = {
    "verifiedPage": <IKYCPages>{ isSuccessful: true, isFinalPage: true, action: "both"},
    "defaultFailedPage": <IKYCPages>{ isSuccessful: false, isFinalPage: true, action: "both"},
    "livenessErrorPage": <IKYCPages>{ isSuccessful: false, isFinalPage: false, action: "both"},
    "networkErrorPage": <IKYCPages>{ isSuccessful: false, isFinalPage: false, action: "both"},
    "QRCodePage": <IKYCPages>{ isSuccessful: false, isFinalPage: true, action: "both"},
    "requestTimeoutPage": <IKYCPages>{ isSuccessful: false, isFinalPage: false, action: "both"},
    "standardErrorPage": <IKYCPages>{ isSuccessful: false, isFinalPage: true, action: "both"},
    "transactionNotValidPage": <IKYCPages>{ isSuccessful: false, isFinalPage: true, action: "both"},
    "transactionMaxAttemptsPage": <IKYCPages>{ isSuccessful: false, isFinalPage: true, action: "both"},
    "videoDeviceNotFoundPage": <IKYCPages>{ isSuccessful: false, isFinalPage: true, action: "both"},

    "docScanResolutionTooLowPage": <IKYCPages>{ isSuccessful: false, isFinalPage: true, action: "proof"},
    "docScanWasmTimeoutPage": <IKYCPages>{ isSuccessful: false, isFinalPage: false, action: "proof"},
    "documentFailedNonMobilePage": <IKYCPages>{ isSuccessful: false, isFinalPage: false, action: "proof"},
    "documentFailedPage": <IKYCPages>{ isSuccessful: false, isFinalPage: false, action: "proof"},

    "verifiedMatchFailPage": <IKYCPages>{ isSuccessful: false, isFinalPage: true, action: "verify"},
    "verifyDeclinedPage": <IKYCPages>{ isSuccessful: false, isFinalPage: true, action: "verify"},
}

/**
 * Handler to abstract the interaction with AuthID iFrame flow for Proof and Verify.
 */
export const authidIframeHandler = async (element: HTMLElement, src: string): Promise<void> => {
    // Create the iFrame element
    const iframe = document.createElement("iframe");
    iframe.src = src;
    iframe.frameBorder = "0";
    iframe.allow = "fullscreen *;camera *;";
    iframe.style.position = "absolute";
    iframe.style.top = "0px";
    iframe.style.left = "0px";
    iframe.style.width = "100%";
    iframe.style.height = "100%";

    // Creates an event promisse to handle the `message` listener
    let eventResolve: (value: any) => void, eventReject: (reason?: any) => void;
    const event = new Promise((resolve, reject) => {
        eventResolve = resolve;
        eventReject = reject;
    });

    // Add event listener to the window to capture `message` events
    window.addEventListener("message", function handler (event: MessageEvent) {
        const page: IKYCPages = pages[event.data.pageName]

        // In case we don't have information about the page.
        if (!page) {
            this.removeEventListener("message", handler, false);
            element.removeChild(iframe);
            return eventReject(new Error("pageUndefined"));
        }

        // Unsuccessful final page case
        if (!page.isSuccessful && page.isFinalPage) {
            this.removeEventListener("message", handler, false);
            element.removeChild(iframe);
            return eventReject(new Error(event.data.pageName));
        }

        // Successful final page case
        if (page.isSuccessful && page.isFinalPage) {
            this.removeEventListener("message", handler, false);
            element.removeChild(iframe);
            return eventResolve(event.data);
        } 
    }, false);

    // Append the iFrame to the given element
    element.appendChild(iframe);
    await event;
}

export default authidIframeHandler;
