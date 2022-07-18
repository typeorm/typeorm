import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { BaseEntity } from "typeorm/repository/BaseEntity"

@Entity()
export class Foo extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number
}
