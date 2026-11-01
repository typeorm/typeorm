import { Entity, PrimaryGeneratedColumn } from "../../../../src"

@Entity()
export class Application {
    @PrimaryGeneratedColumn("uuid")
    id: string
}
