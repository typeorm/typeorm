import { Message } from "./Message";
import { User } from "./User";
export interface ChatConstructor {
    name?: string;
    picture?: string;
    allTimeMembers?: User[];
    listingMembers?: User[];
    actualGroupMembers?: User[];
    admins?: User[];
    owner?: User;
    messages?: Message[];
}
export declare class Chat {
    constructor({ name, picture, allTimeMembers, listingMembers, actualGroupMembers, admins, owner, messages }?: ChatConstructor);
    id: number;
    name?: string;
    picture?: string;
    allTimeMembers: User[];
    listingMembers: User[];
    actualGroupMembers?: User[];
    admins?: User[];
    owner?: User;
    messages: Message[];
}
