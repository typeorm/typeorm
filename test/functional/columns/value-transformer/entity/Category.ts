import { Column, ValueTransformer, Entity, PrimaryGeneratedColumn } from "../../../../../src";
import { lowercase, encrypt } from "./User";

const trim: ValueTransformer = {    
    to: (entityValue: string) => {
        return entityValue.trim();
    },
    from: (databaseValue: string) => {
        return databaseValue;
    }
};

@Entity()
export class Category {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({transformer: [lowercase, trim, encrypt]})
    description: string;
}