import { Column, Entity, PrimaryGeneratedColumn } from "../../../../src"

@Entity({
    name: "message",
})
export class Message {
    @PrimaryGeneratedColumn()
    id: number

    // create a vector embedding with 5 dimensions
    @Column("vector", { length: 5 })
    embedding: string;
}
