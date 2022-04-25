export interface Message{
    channel: string;
    message: string;
    method?: string;
    id?: string;
}

export class MessagingService {
    static origin = window.location.origin;
    static channel = "wallet-communication-channel";
    static checkWindow(){
        if(window.opener != null) {
            window.addEventListener("unload", (ev) => 
            {  
                ev.preventDefault();
                MessagingService.sendMessage(window.opener,<Message>{channel:MessagingService.channel,message:"window-closed"});
            });
        }  
    }
    static windowLoadConfirmation(target : Window ){
        window.opener.postMessage(<Message>{channel:MessagingService.channel,message:"window-opened"}, MessagingService.origin);
    }

    /*
    static sendMessage(target: Window , message:Message, origin: string) {
        target.postMessage(JSON.stringify(message), origin)
    }*/

    static sendMessage(target: Window , message:Message ) {
        target.postMessage(JSON.stringify(message), MessagingService.origin);
    }

    static onMessage(target: Window, handler: (ev:Message)=>any) {
        window.addEventListener(
            'message',
            (event: MessageEvent) => {
                if (!event.data || typeof event.data !== 'string') {
                    return;
                }
                try{

                    let message : Message = JSON.parse(event.data)
                    if(message.method === "status") {
                        target.postMessage(JSON.stringify(message), MessagingService.origin);
                    } else {
                        handler(message);
                    }
                } catch(error) {
                    // log error?
                }

            },
            false
        );
    }
}