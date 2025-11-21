import "reflect-metadata"
import { expect } from "chai"
import { DataSource } from "../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { Company } from "./entity/Company"

describe("persistence > save should not set undefined on unmodified properties", () => {
    let connections: DataSource[]
    before(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should not set undefined on properties that were not modified during save", () =>
        Promise.all(
            connections.map(async (connection) => {
                const company = new Company()
                company.name = "Acme"
                company.description = "A great company"
                
                // Save the entity
                const savedCompany = await connection.manager.save(company)
                
                // Load it back
                const loadedCompany = await connection.manager.findOne(Company, {
                    where: { id: savedCompany.id },
                })
                
                // Modify only the name
                loadedCompany!.name = "Acme modified"
                
                // Save again
                const updatedCompany = await connection.manager.save(loadedCompany!)
                
                // The description should still be "A great company", not undefined
                expect(updatedCompany.description).to.equal("A great company")
                
                // Check that only name was modified, not description
                expect(updatedCompany.name).to.equal("Acme modified")
                
                // Verify the saved company does not have undefined for description
                expect(updatedCompany.description).to.not.be.undefined
                
                // Additional test: modify only name without loading from DB first
                const company2 = new Company()
                company2.name = "Acme2"
                company2.description = "Another company"
                const saved2 = await connection.manager.save(company2)
                
                // Now modify only the name
                saved2.name = "Acme2 modified"
                const updated2 = await connection.manager.save(saved2)
                
                // Description should still be "Another company"
                expect(updated2.description).to.equal("Another company")
                expect(updated2.name).to.equal("Acme2 modified")
                
                // Test ES2022 specific scenario: entity created with all fields undefined
                // then some fields set, then saved
                const company3 = new Company()
                // With ES2022 class field declarations, uninitialized fields are set to undefined by default
                // Result: { id: undefined, name: undefined, description: undefined }
                company3.name = "Acme3"
                // Now only name is set, description is still undefined
                const saved3 = await connection.manager.save(company3)
                
                // After save, name should be set, id should be generated,
                // but description should be null (from database) not undefined
                expect(saved3.name).to.equal("Acme3")
                expect(saved3.id).to.not.be.undefined
                // description is nullable, so it should be null from database
                expect(saved3.description).to.be.null
            }),
        ))
})
