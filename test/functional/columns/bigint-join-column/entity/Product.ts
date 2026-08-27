import { Entity, OneToMany, PrimaryGeneratedColumn } from "../../../../../src"
import { License } from "./License"

@Entity("products_bigint_jc")
export class Product {
    @PrimaryGeneratedColumn({ type: "bigint" })
    id: string

    @OneToMany(() => License, (license) => license.product)
    licenses: License[]
}
