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
  public closeEvent!: () => void;

  constructor(targetOrigin: string) {
    this.targetOrigin = targetOrigin;
    this.handleMessageEvent();
  }

  public async sendMessage(
    target: Window,
    txt: string,
    type: string,
  ): Promise<string> {
    const nextId = this.getNextRequestId();
    const message: Message = {
      id: nextId,
      type: type,
      channel: MessagingService.channel,
      data: txt,
    };

    target.postMessage(JSON.stringify(message), this.targetOrigin);

    // wait for reply
    const result = await this.waitForResponse(nextId, this.timeout);
    if (!result) {
      throw new Error("Timeout");
    }

    if (result.type === MessageType.error.valueOf()) {
      throw new Error(result.data);
    }

    return result.data;
  }

  // send ping till response
  public async pingForResponse(target: Window, timeout: number): Promise<boolean> {
    const messageId = this.getNextRequestId();
    const message: Message = {
      id: messageId,
      type: MessageType.ping.valueOf(),
      channel: MessagingService.channel,
      data: "ping",
    };

    return this.pollForMessage(target, message, timeout).then(() => true).catch(() => false);
  }

  // send ping till response
  public async pingForId(target: Window, timeout: number): Promise<string> {
    const messageId = this.getNextRequestId();
    const message: Message = {
      id: messageId,
      type: MessageType.data.valueOf(),
      channel: MessagingService.channel,
      data: "id",
    };

    const response = await this.pollForMessage(target, message, timeout);
    return response.data;
  }

  private handleMessageEvent() {
    window.addEventListener("message", this.onMessage.bind(this), false);
  }

  private getNextRequestId(): number {
    return ++this.requestId;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private onMessage(event: MessageEvent) {
    const { data, origin } = event;
    if (typeof data !== "string") return;
    if (this.targetOrigin !== "*" && origin !== this.targetOrigin) return;

    try {
      const message: Message = JSON.parse(data);
      this.requestMap.set(message.id, message);

      const isCloseMessage =
        message.type === MessageType.close.valueOf() ||
        message.data === "user cancel";

      if (isCloseMessage) {
        console.log("user cancel");
        this.closeEvent();
      }
    } catch (error) {
      console.error("Failed to parse message event:", error);
    }
  }

  private async waitForResponse(id: number, timeout: number): Promise<Message | null> {
    let remainingTime = timeout;

    while (remainingTime > 0) {
      const message = this.requestMap.get(id);
      if (message) {
        this.requestMap.delete(id);
        return message;
      }
      await this.delay(this.POLL_INTERVAL);
      remainingTime -= this.POLL_INTERVAL;
    }

    return null
  }

  private async pollForMessage(
    target: Window,
    message: Message,
    timeout: number
  ): Promise<Message> {
    let remainingTime = timeout;

    while (remainingTime > 0) {
      if (this.requestMap.has(message.id)) {
        const response = this.requestMap.get(message.id)!;
        this.requestMap.delete(message.id);
        return response;
      }

      target.postMessage(JSON.stringify(message), this.targetOrigin);
      await this.delay(this.POLL_INTERVAL);
      remainingTime -= this.POLL_INTERVAL;
    }

    throw new Error("Timeout");
  }
}
