import { CreateDateColumn, Entity, ManyToOne } from "@typeorm/core";
import { Message } from "./Message";
import { User } from "./User";

export interface RecipientConstructor {
    user?: User;
    message?: Message;
    receivedAt?: number;
    readAt?: number;
}

@Entity()
export class Recipient {
    @ManyToOne(type => User, user => user.recipients, {primary: true})
    user: User;
    @ManyToOne(type => Message, message => message.recipients, {primary: true})
    message: Message;
    @CreateDateColumn()
    receivedAt: number;
    @CreateDateColumn()
    readAt: number;

    constructor({user, message, receivedAt, readAt}: RecipientConstructor = {}) {
        if (user) {
            this.user = user;
        }
        if (message) {
            this.message = message;
        }
        if (receivedAt) {
            this.receivedAt = receivedAt;
        }
        if (readAt) {
            this.readAt = readAt;
        }
    }
}
