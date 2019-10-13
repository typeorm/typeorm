import { BaseEntity } from "../../../../src";
import { Contact } from "./Contact";
export declare class Person extends BaseEntity {
    id: number;
    contact: Contact;
    status: string;
}
