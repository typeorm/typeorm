import "reflect-metadata";
import { closeTestingConnections, reloadTestingDatabases, setupSingleTestingConnection } from "../../utils/test-utils";
import { Connection } from "../../../src/connection/Connection";
import { expect } from "chai";
import { RoleEntity } from "./entity/role.entity";
import { UserEntity } from "./entity/user.entity";
import { roles, users } from "./data";
import { createConnection } from "../../../src";


describe("github issues > #7271 Full query formatting and aliases", () => {
    let connection: Connection;
    
    before(async () => {
        const options = setupSingleTestingConnection("postgres", {
            entities: [RoleEntity, UserEntity],
            schemaCreate: true,
            dropSchema: true,
            enabledDrivers: ["postgres"],
        });
  
        if (!options)
            return;
  
        connection = await createConnection(options);
    });
    
    beforeEach(async () => {
        await reloadTestingDatabases([connection]);
        await connection.getRepository(RoleEntity).save(roles)
        await connection.getRepository(UserEntity).save(users);
      });


    after(() => closeTestingConnections([connection]));


    it("should execute full query with parameters as a clean sql", async () => {
        if (!connection) return;


        const qb = connection
            .createQueryFormatter()
            .setQuery(`
                SELECT "users".*, "roles".*
                FROM "users" 
                LEFT JOIN "roles" ON "roles"."id" = "users"."role_id"
                WHERE "users"."nick_name" = :nickName
            `)
            .setParameters({ nickName: 'Mike' })
        
        const row = await qb.getRawOne();

        expect(row).to.be.an('object').that.is.not.empty;
        expect(row).to.have.property('nick_name', 'Mike');
        expect(row).to.have.property('is_admin', true);

    });


    it("should execute full query with table aliases", async () => {
        if (!connection) return;

        const qb = connection
            .createQueryFormatter()
            .setQuery(`
                SELECT user.nickName AS "nickName", role.isAdmin AS "isAdmin"
                FROM &user
                LEFT JOIN &role ON role.id = user.roleId
                WHERE user.nickName = :nickName
            `)
            .setParameters({ nickName: 'Mike' })
            .setAliases({ user: UserEntity, role: RoleEntity });
            
        const row = await qb.getRawOne();

        expect(row).to.be.an('object').that.is.not.empty;
        expect(row).to.have.property('nickName', 'Mike');
        expect(row).to.have.property('isAdmin', true);
    });


    it("should execute full query with column aliases (short aliases)", async () => {
        if (!connection) return;

        const qb = connection
            .createQueryFormatter()
            .setQuery(`
                SELECT &user.nickName, &role.isAdmin
                FROM &user
                LEFT JOIN &role ON role.id = user.roleId
                WHERE user.id = :id
            `)
            .setParameters({ id: 1 })
            .setAliases({ user: UserEntity, role: RoleEntity });
            
        const row = await qb.getRawOne();

        expect(row).to.be.an('object').that.is.not.empty;
        expect(row).to.have.property('nickName', 'Mike');
        expect(row).to.have.property('isAdmin', true);
    });

    it("should execute full query using alias and asterisk for select", async () => {
        if (!connection) return;

        const qb = connection
            .createQueryFormatter()
            .setQuery(`
                SELECT &user.*, &role.*
                FROM &user
                LEFT JOIN &role ON role.id = user.roleId
                WHERE user.id = :id
            `)
            .setParameters({ id: 1 })
            .setAliases({ user: UserEntity, role: RoleEntity });
            
        const row = await qb.getRawOne();

        expect(row).to.be.an('object').that.is.not.empty;
        expect(row).to.have.property('nickName', 'Mike');
        expect(row).to.have.property('isAdmin', true);
    });

    
    it("should execute a query with sub query using aliases", async () => {
        if (!connection) return;

        const qb = connection
            .createQueryFormatter()
            .setQuery(`
                SELECT 
                    COUNT(user.roleId)::INTEGER as count,
                    ARRAY(
                        SELECT &sqUser.nickName 
                        FROM &sqUser 
                        WHERE sqUser.roleId = user.roleId
                    ) as users
                FROM &user 
                GROUP BY user.roleId
            `)
            .setParameters({ id: 1 })
            .addAlias(UserEntity, 'user')
            .addAlias(UserEntity, 'sqUser')

        const rows = await qb.getRawMany();

        expect(rows).to.be.an('array').to.have.lengthOf(2);
        expect(rows[0]).to.have.property('count', 2);
        expect(rows[0]['users']).to.have.members(["Bob", "Mike"]);
    });


    it("should execute a pure insert query", async () => {
        if (!connection) return;

        const insertResults = await connection.createQueryFormatter(`
            INSERT INTO "users" ( email, role_id, password_hash, nick_name )
            VALUES ('666666@test.test', 1, '', 'Jane')
            RETURNING *;
        `).execute();

        expect(insertResults).to.be.an('array').to.have.lengthOf(1);
        expect(insertResults[0]).to.have.property('id', 6);
        expect(insertResults[0]).to.have.property('created_at');
    });


    it("should execute an insert query with parameters", async () => {
        if (!connection) return;

        const insertResults = await connection.createQueryFormatter(`
            INSERT INTO "users" ( email, role_id, password_hash, nick_name )
            VALUES (:email, :roleId, :passwordHash, :nickName)
            RETURNING *;
        `).setParameters({
            email: '666666@test.test',
            roleId:1,
            passwordHash: '',
            nickName: 'Jane'
        }).execute();
        
        expect(insertResults).to.be.an('array').to.have.lengthOf(1);
        expect(insertResults[0]).to.have.property('id', 6);
        expect(insertResults[0]).to.have.property('created_at');
    });


    it("should execute a pure query - exec functions", async () => {
        if (!connection) return;

        const results = await connection.createQueryFormatter(`
            SELECT UPPER(CONCAT('Hello', ' ', 'World')) as "text";
        `).execute();

        expect(results).to.be.an('array').to.have.lengthOf(1);
        expect(results[0]).to.have.property('text', 'HELLO WORLD');
    });
});