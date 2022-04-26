export interface Message{
    channel: string;
    message: string;
    method?: string;
    id?: string;
    origin: string;
}

export class MessagingService {
    static origin = window.location.origin;
    static channel = "wallet-communication-channel";
    

    /*
    static sendMessage(target: Window , message:Message, origin: string) {
        target.postMessage(JSON.stringify(message), origin)
    }*/

    static sendMessage(target: Window , message:Message ) {
        target.postMessage(JSON.stringify(message), MessagingService.origin);
    }

    static onMessage(target: Window, handler: (ev:Message)=>any) {
        window.addEventListener(
            "message",
            (event: MessageEvent) => {
                if (!event.data || typeof event.data !== 'string') {
                    return;
                } else {

                    try{

                        let message : Message = JSON.parse(event.data)
                        if(message.method === "status") {
                            target.postMessage(JSON.stringify(message), MessagingService.origin);
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