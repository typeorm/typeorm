import { Chat } from "./Chat";
import { User } from "./User";
import { Recipient } from "./Recipient";
export declare enum MessageType {
    TEXT = 0,
    LOCATION = 1,
    PICTURE = 2
}
export interface MessageConstructor {
    sender?: User;
    content?: string;
    type?: MessageType;
    recipients?: Recipient[];
    holders?: User[];
    chat?: Chat;
}
export declare class Message {
    constructor({ sender, content, type, recipients, holders, chat }?: MessageConstructor);
    id: number;
    sender: User;
    content: string;
    createdAt: number;
    type: MessageType;
    recipients: Recipient[];
    holders: User[];
    chat: Chat;
}
