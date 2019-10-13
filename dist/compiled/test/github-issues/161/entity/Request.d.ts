import { Ticket } from "./Ticket";
export declare class Request {
    id: number;
    owner: string;
    type: string;
    success: boolean;
    ticket: Ticket;
}
