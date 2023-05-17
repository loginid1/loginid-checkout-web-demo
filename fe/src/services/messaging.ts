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
                        if(message.type === MessageType.ping.toString()) {
                            if (event.source !=null && event.source as Window ){
                                this.target = event.source as Window;
                                (event.source as Window).postMessage(JSON.stringify(message),"*" );
                            } else {
                                this.target.postMessage(JSON.stringify(message), "*");
                            }
                        } else {
                            handler(message, event.origin);
                        }
                    } catch(error) {
                        // log error?
                        console.log("error :" ,error, event.data)
                    }
                }

            },
            false
        );
    }

}