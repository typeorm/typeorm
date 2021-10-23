import {Entity, PrimaryGeneratedColumn, Column} from "../../../../src";

@Entity()
export class User {
    @PrimaryGeneratedColumn({ type: "integer" })
    id: number;
    
    @Column()
    name: string;
}
