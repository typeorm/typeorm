import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm"
import { Cliente } from "./cliente"

@Entity()
export class TipoCliente {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ name: "tipo" })
    descricao: string

    @OneToMany(() => Cliente, (c) => c.tipo)
    clientes: Cliente[]
}
