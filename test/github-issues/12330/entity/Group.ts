import { Entity, OneToMany, PrimaryColumn } from "../../../../src"
import { ClientView } from "./ClientView"

@Entity()
export class Group {
    @PrimaryColumn()
    id: number

    @OneToMany(() => ClientView, (client) => client.group)
    currentClients: ClientView[]
}
