export interface Message{
    channel: string;
    data: string;
    type: string;
    id: number;
}

enum MessageType {
    data="data", ping="ping", error="error"
}

export class MessagingService {
    origin : string = "*";
    channel : string = "wallet-communication-channel";
    id : number = 0;
    target : Window;
    constructor(targetWindow: Window ) {
        this.target = targetWindow;
    }

    /*
    static sendMessage(target: Window , message:Message, origin: string) {
        target.postMessage(JSON.stringify(message), origin)
    }*/

    sendErrorMessage( error: string ) {
        let message : Message = {channel:this.channel, data: error, id:this.id, type: "error"};
        this.target.postMessage(JSON.stringify(message), this.origin);
    }

    sendMessage( message:Message ) {
        this.target.postMessage(JSON.stringify(message), this.origin);
    }


    sendMessageText(txt: string ) {
        let message : Message = {channel:this.channel, id:this.id , data: txt, type:"data" };
        this.target.postMessage(JSON.stringify(message), this.origin);
    }

    onMessage(handler: (ev:Message, origin: string)=>any) {
        window.addEventListener(
            "message",
            (event: MessageEvent) => {
                if (!event.data || typeof event.data !== 'string') {
                    return;
                } else {

                    try{
                        let message : Message = JSON.parse(event.data)
                        console.log("message: " + event.data);
                        if(message.type === MessageType.ping.toString()) {
                            console.log(message.id);
                            this.target.postMessage(JSON.stringify(message), event.origin);
                        } else {
                            handler(message, event.origin);
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