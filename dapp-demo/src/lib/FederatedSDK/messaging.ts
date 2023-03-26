export interface Message{
    channel: string;
    data: string;
    id: number;
    type: string;
}

export enum MessageType {
    data="data", ping="ping", error="error"
}

export class MessagingService {

    static channel : string = "wallet-communication-channel";
    targetOrigin : string = "*";
    timeout : number = 1000000;
    requestId : number = 0;
    requestMap = new Map<number, Message>();
    INTERVAL = 200;

    constructor(tOrigin: string) {
        this.targetOrigin = tOrigin;
        this.onMessage();
    }
    getNextRequestId() : number {
        this.requestId = this.requestId + 1;
        return this.requestId ;
    }
    onMessage() {
        window.addEventListener(
            "message",
            (event: MessageEvent) => {
                if (!event.data || typeof event.data !== 'string') {
                    return;
                } else {
                    console.log(event.data);
                    try{
                        let message : Message = JSON.parse(event.data)
                        this.requestMap.set(message.id,message);
                    } catch(error) {
                        // log error?
                        //console.log(error);
                    }
                }

            },
            false
        );
    }


    async sendMessageText( target: Window,  txt: string ) : Promise< string> {

        let nextId = this.getNextRequestId();
        let message : Message = {id: nextId, type:MessageType.data.valueOf(), channel:MessagingService.channel, data: txt };
        target.postMessage(JSON.stringify(message), this.targetOrigin);
        // wait for reply
        let result = await this.waitForResponse(nextId, this.timeout);
        if (result == null) {
            return Promise.reject({message:"timeout"});
        } 
        if (result.type === MessageType.error.valueOf()) {
            return Promise.reject({message:result?.data});
        }
        return Promise.resolve(result.data);
    }
    async sendMessage( target: Window,  txt: string, type: string ) : Promise< string> {

        let nextId = this.getNextRequestId();
        let message : Message = {id: nextId, type:type, channel:MessagingService.channel, data: txt };
        target.postMessage(JSON.stringify(message), this.targetOrigin);
        // wait for reply
        let result = await this.waitForResponse(nextId, this.timeout);
        if (result == null) {
            return Promise.reject({message:"timeout"});
        } 
        if (result.type === MessageType.error.valueOf()) {
            return Promise.reject({message:result?.data});
        }
        return Promise.resolve(result.data);
    }

    async waitForResponse(id: number, timeout: number) : Promise<(Message )> {
        let waitTime = timeout;
        while (waitTime > 0) {
			if (this.requestMap.has(id) ) {
                let message = this.requestMap.get(id)!;
				return Promise.resolve(message);
			} else {
				await new Promise((resolve) => setTimeout(resolve, this.INTERVAL));
			}
            waitTime = waitTime - this.INTERVAL;
		}
        return Promise.reject("timeout");
    }

    // send ping till response
    async pingForResponse(target: Window, timeout: number) : Promise<boolean> {
        let nextId = this.getNextRequestId();
        let message : Message = {id: nextId, type:MessageType.ping.valueOf(), channel:MessagingService.channel, data: "ping" };
        let waitTime = timeout;
        while (waitTime > 0) {
			if (this.requestMap.has(nextId) ) {
				return Promise.resolve(true);
			} else {
                target.postMessage(JSON.stringify(message), this.targetOrigin);
				await new Promise((resolve) => setTimeout(resolve, this.INTERVAL));
			}
            waitTime = waitTime - this.INTERVAL;
		}
        return Promise.resolve(false);
    }
}