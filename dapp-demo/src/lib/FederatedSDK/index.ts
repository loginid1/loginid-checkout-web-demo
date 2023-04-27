import { MessagingService } from "./messaging";
import { defaultOptions, openPopup } from "./popup";

export interface SignupResult {
	token?: string;
}

export class FederatedSDK {
	baseURL = "http://localhost:3000";
	//mMessage: MessagingService;
    mTarget: Window | null = null;
    mMain: HTMLDivElement | null = null;
	constructor(url: string) {
		if (url !== "") {
			this.baseURL = url;
		}
		//this.mMessage = new MessagingService(FidoVaultSDK.baseURL);
	}

	prepareIframe() : Window | null {
		var link = this.baseURL + "/sdk/auth";

		var main = document.createElement("div");

		main.style.display = "block";
		main.style.border = "none";
		main.style.position = "fixed";
		main.style.zIndex = "998";
		main.style.backgroundColor = "#fff";
		main.style.right = "0";
		main.style.top = "16px";
		main.style.boxShadow = "0 4px 8px 0 rgba(0,0,0,0.2)";
		main.style.width = "300px";

		var close = document.createElement("span");
		close.innerHTML = "&times;";
		close.style.zIndex = "999";
		close.style.display = "block";
		close.style.fontSize = "32px";
		close.style.fontWeight = "500";
		close.style.float = "right";
		close.style.color = "#1642DF";
		close.style.position = "relative";
		close.style.padding = "4px";
        close.onclick = function() {
            //main.style.display="none";
            main.remove();
        };

		var iframe = document.createElement("iframe");
		iframe.style.border = "none";
		iframe.style.position = "relative";
		iframe.width = "300px";
		iframe.height = "320px";
		iframe.id = "loginid-auth";
        iframe.allow= "publickey-credentials-get *; ";
        
		iframe.setAttribute("src", link);
		main.appendChild(close);
		main.appendChild(iframe);

		document.body.appendChild(main);
        return iframe.contentWindow;
	}
	/**
	 *
	 *   https://github.com/algorandfoundation/ARCs/blob/main/ARCs/arc-0006.md
	 */

	async signup(): Promise<SignupResult> {

        /*
        if (this.mTarget == null) {
            this.mTarget = this.prepareIframe();
        }
        if (this.mMain != null) {
            this.mMain.style.display = "block";
        }*/
		let mMessage = new MessagingService("*");
        this.mTarget = this.prepareIframe();

        if (this.mTarget == null ) {
            return Promise.reject({message:"no session"});
        }
		let isLoad = await mMessage.pingForResponse(this.mTarget, 20000);
		if (!isLoad) {
			return Promise.reject({ message: "communication timeout" });
		}

		let response = await mMessage.sendMessage(
			this.mTarget,
			JSON.stringify({ data: "hello" }),
			"init"
		);

		let result: SignupResult = JSON.parse(response);
		return Promise.resolve(result);
	}

    async signupNew(): Promise<SignupResult> {
        this.mTarget = openPopup(this.baseURL + "/sdk/auth_p", "auth_new", defaultOptions);
		let mMessage = new MessagingService("*");
		let isLoad = await mMessage.pingForResponse(this.mTarget, 20000);
		if (!isLoad) {
			return Promise.reject({ message: "communication timeout" });
		}

		let response = await mMessage.sendMessage(
			this.mTarget,
			JSON.stringify({ data: "hello" }),
			"init"
		);

		let result: SignupResult = JSON.parse(response);
		return Promise.resolve(result);
    }
}
