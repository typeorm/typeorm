import {Entity, PrimaryGeneratedColumn, Column, CreateDateColumn} from "../../../../src";

@Entity()
export class Example {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ transformer: {
        to: value => value,
        from: (value: string) => value.toUpperCase(),
    }})
    name: string;

    @CreateDateColumn()
    created: Date;
}
