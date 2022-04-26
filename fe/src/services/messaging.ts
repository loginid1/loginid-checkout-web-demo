export interface Message{
    channel: string;
    message: string;
    method?: string;
    id?: string;
    origin: string;
}

export class MessagingService {
    origin : string = window.location.origin;
    channel : string = "wallet-communication-channel";

    target : Window;
    constructor(targetWindow: Window) {
        this.target = targetWindow;
    }

    /*
    static sendMessage(target: Window , message:Message, origin: string) {
        target.postMessage(JSON.stringify(message), origin)
    }*/

    sendErrorMessage( error: string ) {
        let message : Message = {channel:this.channel, message: error, method: "error",origin: this.origin};
        this.target.postMessage(JSON.stringify(message), this.origin);
    }

    sendMessage( message:Message ) {
        this.target.postMessage(JSON.stringify(message), this.origin);
    }

    onMessage(handler: (ev:Message)=>any) {
        window.addEventListener(
            "message",
            (event: MessageEvent) => {
                if (!event.data || typeof event.data !== 'string') {
                    return;
                } else {

                    try{

                        let message : Message = JSON.parse(event.data)
                        if(message.method === "status") {
                            this.target.postMessage(JSON.stringify(message), this.origin);
                        } else {
                            message.origin = event.origin;
                            handler(message);
                        }
                    } catch(error) {
                        // log error?
                    }
                }

            },
            false
        );
    }
}