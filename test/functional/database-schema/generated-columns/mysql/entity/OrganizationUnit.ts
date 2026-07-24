import { Entity, Column, PrimaryGeneratedColumn } from "../../../../../../src"

@Entity("organization_unit", { database: "avocaty" })
export default class OrganizationUnit {
    @PrimaryGeneratedColumn()
    id: number

    @Column("json", { name: "metadata" })
    metadata: any

    @Column({
        name: "subscription_type",
        nullable: true,
        length: 255,
        generatedType: "VIRTUAL",
        asExpression: `json_unquote(json_extract(\`metadata\`, _utf8mb4'$.subscriptionType'))`,
        collation: "utf8mb4_general_ci",
    })
    subscriptionType?: string
}
