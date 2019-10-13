import { Chat } from "./Chat";
import { Message } from "./Message";
import { Recipient } from "./Recipient";
export interface UserConstructor {
    username?: string;
    password?: string;
    name?: string;
    picture?: string;
    phone?: string;
}
export declare class User {
    constructor({ username, password, name, picture, phone }?: UserConstructor);
    id: number;
    username: string;
    password: string;
    name: string;
    picture?: string;
    phone?: string;
    allTimeMemberChats: Chat[];
    listedMemberChats: Chat[];
    actualGroupMemberChats: Chat[];
    adminChats: Chat[];
    holderMessages: Message[];
    ownerChats: Chat[];
    senderMessages: Message[];
    recipients: Recipient[];
}
