/*
 *   Copyright (c) 2025 LoginID Inc
 *   All rights reserved.
 *
 *   Licensed under the Apache License, Version 2.0 (the "License");
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
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

  /**
   * Send a message to the target window and wait for a response.
   *
   * @param target Target window to send the message to
   * @param txt Message body
   * @param type Message type
   * @returns Response message data
   */
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

  /**
   * Sends ping messages repeatedly to check if the target responds within a timeout.
   *
   * @param target Target window to send ping to
   * @param timeout Timeout in milliseconds
   * @returns true if a response was received, false otherwise
   */
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

  /**
   * Sends a message requesting an ID and waits for the response.
   *
   * @param target Target window to send the request to
   * @param timeout Timeout in milliseconds
   * @returns The received ID as a string
   */
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

  /**
   * Registers a message event listener to process incoming messages.
   */
  private handleMessageEvent() {
    window.addEventListener("message", this.onMessage.bind(this), false);
  }

  /**
   * Generates a new unique message request ID.
   *
   * @returns Next request ID number
   */
  private getNextRequestId(): number {
    return ++this.requestId;
  }

  /**
   * Utility to delay execution by a specified number of milliseconds.
   *
   * @param ms Delay in milliseconds
   * @returns Promise that resolves after the delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Processes an incoming message event and updates the request map.
   *
   * @param event MessageEvent object
   */
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

  /**
   * Waits for a response with the specified ID within the given timeout.
   *
   * @param id Message ID to wait for
   * @param timeout Timeout duration in milliseconds
   * @returns Message if received, null if timed out
   */
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

    return null;
  }

  /**
   * Sends a message repeatedly until a response with the same ID is received or the timeout is reached.
   *
   * @param target Target window to communicate with
   * @param message Message to send
   * @param timeout Timeout duration in milliseconds
   * @returns Response message
   */
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
