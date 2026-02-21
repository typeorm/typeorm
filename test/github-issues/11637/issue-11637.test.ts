import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"
import { expect } from "chai"
import {
    Column,
    Entity,
    JoinTable,
    ManyToMany,
    PrimaryGeneratedColumn,
    PrimaryColumn,
} from "../../../src"

@Entity()
class Specialty {
    @PrimaryColumn()
    name!: string

    @ManyToMany(() => Vet, (vet) => vet.specialties)
    vets!: Vet[]
}

@Entity()
class Vet {
    @PrimaryGeneratedColumn()
    id!: number

    @Column()
    name!: string

    @ManyToMany(() => Specialty, (specialty) => specialty.vets, {
        cascade: true,
    })
    @JoinTable({
        name: "vet_specialty",
        joinColumn: {
            name: "vet_id",
            referencedColumnName: "id",
        },
        inverseJoinColumn: {
            name: "specialty_name",
            referencedColumnName: "name",
        },
        synchronize: false,
    })
    specialties!: Specialty[]
}

@Entity("vet_specialty")
class VetSpecialty {
    @PrimaryGeneratedColumn()
    id!: number

    @Column({ name: "vet_id" })
    vetId!: number

    @Column({ name: "specialty_name" })
    specialtyName!: string
}

describe("github issues > #11637 many-to-many relations broken when user-defined junction entity exists", () => {
    let dataSources: DataSource[]

    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [Specialty, Vet, VetSpecialty],
                enabledDrivers: ["sqlite"],
            })),
    )

    beforeEach(() => reloadTestingDatabases(dataSources))

    after(() => closeTestingConnections(dataSources))

    it("should populate junction table with foreign key values when saving many-to-many relation", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const specialtyRepo = dataSource.getRepository(Specialty)
                const vetRepo = dataSource.getRepository(Vet)
                const junctionRepo = dataSource.getRepository(VetSpecialty)

                const dogs = specialtyRepo.create({ name: "dogs" })
                const cats = specialtyRepo.create({ name: "cats" })
                await specialtyRepo.save([dogs, cats])

                const vet = vetRepo.create({
                    name: "Carlos Salazar",
                    specialties: [dogs, cats],
                })
                await vetRepo.save(vet)

                const persistedVet = await vetRepo.findOneOrFail({
                    where: { id: vet.id },
                    relations: { specialties: true },
                })

                expect(persistedVet.specialties).to.have.length(2)

                const junctionRows = await junctionRepo.find()
                expect(junctionRows).to.have.length(2)
                junctionRows.forEach((row) => {
                    expect(row.vetId).to.equal(vet.id)
                    expect(["dogs", "cats"]).to.include(row.specialtyName)
                })
            }),
        ))
})
