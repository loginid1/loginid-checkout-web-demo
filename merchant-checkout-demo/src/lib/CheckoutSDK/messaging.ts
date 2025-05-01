/*
 *   Copyright (c) 2025 LoginID Inc
 *   All rights reserved.

 *   Licensed under the Apache License, Version 2.0 (the "License");
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at

 *   http://www.apache.org/licenses/LICENSE-2.0

 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 */

export interface Message {
  channel: string;
  data: string;
  id: number;
  type: string;
}

export enum MessageType {
  data = "data",
  ping = "ping",
  error = "error",
  close = "close",
}

export class MessagingService {
  static channel: string = "checkout-communication-channel";
  private targetOrigin: string = "*";
  private timeout: number = 10000000;
  private requestId: number = 0;
  private requestMap = new Map<number, Message>();
  private readonly POLL_INTERVAL = 200;
  private closeEvent!: () => void;

  constructor(tOrigin: string) {
    this.targetOrigin = tOrigin;
    this.onMessage();
  }

  getNextRequestId(): number {
    this.requestId = this.requestId + 1;
    return this.requestId;
  }

  onMessage() {
    window.addEventListener(
      "message",
      (event: MessageEvent) => {
        if (!event.data || typeof event.data !== "string") {
          return;
        } else if (
          this.targetOrigin !== "*" &&
          event.origin !== this.targetOrigin
        ) {
          return;
        } else {
          try {
            let message: Message = JSON.parse(event.data);
            this.requestMap.set(message.id, message);
            if (
              message.type === MessageType.close.valueOf() ||
              message.data === "user cancel"
            ) {
              console.log("user cancel");
              this.closeEvent();
            }
          } catch (error) {
            // log error?
            console.log(error);
          }
        }
      },
      false,
    );
  }

  async sendMessage(
    target: Window,
    txt: string,
    type: string,
  ): Promise<string> {
    let nextId = this.getNextRequestId();
    let message: Message = {
      id: nextId,
      type: type,
      channel: MessagingService.channel,
      data: txt,
    };
    target.postMessage(JSON.stringify(message), this.targetOrigin);
    // wait for reply
    let result = await this.waitForResponse(nextId, this.timeout);
    if (result == null) {
      return Promise.reject({ message: "timeout" });
    }
    if (result.type === MessageType.error.valueOf()) {
      return Promise.reject({ message: result?.data });
    }
    return Promise.resolve(result.data);
  }

  async waitForResponse(id: number, timeout: number): Promise<Message> {
    let waitTime = timeout;
    while (waitTime > 0) {
      if (this.requestMap.has(id)) {
        let message = this.requestMap.get(id)!;
        return Promise.resolve(message);
      } else {
        await new Promise((resolve) => setTimeout(resolve, this.POLL_INTERVAL));
      }
      waitTime = waitTime - this.POLL_INTERVAL;
    }
    return Promise.reject("timeout");
  }

  // send ping till response
  async pingForResponse(target: Window, timeout: number): Promise<boolean> {
    let nextId = this.getNextRequestId();
    let message: Message = {
      id: nextId,
      type: MessageType.ping.valueOf(),
      channel: MessagingService.channel,
      data: "ping",
    };
    let waitTime = timeout;
    while (waitTime > 0) {
      if (this.requestMap.has(nextId)) {
        return Promise.resolve(true);
      } else {
        target.postMessage(JSON.stringify(message), this.targetOrigin);
        await new Promise((resolve) => setTimeout(resolve, this.POLL_INTERVAL));
      }
      waitTime = waitTime - this.POLL_INTERVAL;
    }
    return Promise.resolve(false);
  }

  // send ping till response
  async pingForId(target: Window, timeout: number): Promise<string> {
    let nextId = this.getNextRequestId();
    let message: Message = {
      id: nextId,
      type: MessageType.data.valueOf(),
      channel: MessagingService.channel,
      data: "id",
    };
    let waitTime = timeout;
    while (waitTime > 0) {
      if (this.requestMap.has(nextId)) {
        let message = this.requestMap.get(nextId)!;
        return Promise.resolve(message.data);
      } else {
        target.postMessage(JSON.stringify(message), this.targetOrigin);
        await new Promise((resolve) => setTimeout(resolve, this.POLL_INTERVAL));
      }
      waitTime = waitTime - this.POLL_INTERVAL;
    }
    return Promise.reject("timeout");
  }
}
