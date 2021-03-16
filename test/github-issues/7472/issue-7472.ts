import "reflect-metadata";
import {Connection} from "../../../src/connection/Connection";
import {closeTestingConnections, createTestingConnections} from "../../utils/test-utils";
import {Post} from "./entity/Post";

// This creates a role test_role which, which will be used to check that the RLSes defined in `makePolicy` work correctly.
const prepTest = async(connection: Connection) =>{
    await becomeAdmin(connection);

    await connection.query("DROP OWNED BY test_role");
    await connection.query("DROP ROLE IF EXISTS test_role");
    await connection.query("CREATE ROLE test_role WITH login nobypassrls PASSWORD 'test_role'");

    await connection.query("ALTER DEFAULT PRIVILEGES GRANT ALL PRIVILEGES ON TABLES TO test_role");
    await connection.query("ALTER DEFAULT PRIVILEGES GRANT ALL PRIVILEGES ON FUNCTIONS TO test_role");
    await connection.query("ALTER DEFAULT PRIVILEGES GRANT ALL PRIVILEGES ON SEQUENCES TO test_role");
    await connection.query("ALTER DEFAULT PRIVILEGES GRANT ALL PRIVILEGES ON TYPES TO test_role");
    
    await connection.query("GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO test_role");
    await connection.query("GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO test_role");
    await connection.query("GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO test_role");

    await releaseAdmin(connection);
};

// Calling this makes the connection bypass RLS policies.
const becomeAdmin = async(connection: Connection)=>{
    await connection.query("RESET SESSION AUTHORIZATION");
};

// Calling this makes the connection subject to RLS policies
const releaseAdmin = async(connection: Connection)=>{
    await connection.query("SET SESSION AUTHORIZATION test_role");
};


// As there is currently no way to define a row level security policy,
// We make a helper function here to do the set up for us.
const makePolicy = async(connection: Connection) => {
    await connection.query("RESET SESSION AUTHORIZATION");
    await connection.query(`ALTER TABLE "post" ENABLE ROW LEVEL SECURITY`); 
    await connection.query(`ALTER TABLE "post" FORCE ROW LEVEL SECURITY`);
    await connection.query(`DROP POLICY IF EXISTS my_policy ON "post"`);
    await connection.query(`CREATE POLICY my_policy ON "post" FOR ALL ` +
        `USING (current_setting('myVar.isAdmin', true)='true' OR owner=current_setting('myVar.user', true))`
    );
    await connection.query(`SET SESSION AUTHORIZATION test_role`);
};

describe("github issues -> #7472 Add ability for entitymanager and query builder to set session variables. This PR is only for postgresql support.", () => {

    let connections: Connection[];

    before(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["postgres"],
            schema: "public",
            schemaCreate: true,
            dropSchema: true,
            logging: true,
        });
        await prepTest(connections[0]);
    });
    beforeEach(async () => {
        await makePolicy(connections[0]);
    });
    after(() => closeTestingConnections(connections));

    it("should correctly select ONLY accessible data when session variables set the user to different users", async () => {
        const connection = connections[0];
        const em = connection.createEntityManager();
        const alice = "alice", bob = "bob";
        
        await becomeAdmin(connection);
        await em.save([
            em.create(Post, {id: 1, owner: alice}),
            em.create(Post, {id: 2, owner: bob})
        ]);
        await releaseAdmin(connection);
        
        await em.find(Post, {sessionVariables: {myVar: {user: alice}}, transaction:false}).should.rejected;

        await em.find(Post, {sessionVariables: {myVar: {user: alice}}}).should.become([{id:1, owner: alice}]);
        await em.find(Post, {sessionVariables: {myVar: {user: bob}}}).should.become([{id:2, owner: bob}]);

        await em.findOne(Post, 1, {sessionVariables: {myVar: {user: alice}}}).should.become({id:1, owner: alice});
        await em.findOne(Post, 1, {sessionVariables: {myVar: {user: bob}}}).should.become(undefined);
        
        await em.find(Post, {
            sessionVariables: {
                myVar: {isAdmin: true},
            },
            order: {id: "ASC"},
        }).should.become([{id:1, owner: alice}, {id:2, owner: bob}]);
        
        // Querying without specifying any session variables is expected to return no rows,
        // as postgres is effectively checking `owner = ""` for all rows (which is false for all rows.)
        await em.find(Post, {order: {id: "ASC"}}).should.become([]);
    });

    it("should correctly delete ONLY accessible data when session variables set the user to different users", async () => {
        const connection = connections[0];
        const em = connection.createEntityManager();
        const alice = "alice", bob = "bob";

        await becomeAdmin(connection);
        await em.save([
            em.create(Post, {id: 1, owner: alice}),
            em.create(Post, {id: 2, owner: bob})
        ]);
        await releaseAdmin(connection);

        // Deleting without setting any session vars/config params should not delete any rows (due to our RLS policy)
        await em.createQueryBuilder().delete().from(Post, "post").execute();
        await becomeAdmin(connection);
        await em.find(Post, {order: {id: "ASC"}}).should.become([{id:1, owner: alice}, {id:2, owner: bob}]);
        await releaseAdmin(connection);

        // Check again, using EntityManager.
        await em.remove(Post, {id: 1, owner: alice} as Post, {sessionVariables: {myVar: {user: bob}}});
        await becomeAdmin(connection);
        await em.find(Post, {order: {id: "ASC"}}).should.become([{id:1, owner: alice}, {id:2, owner: bob}]);
        await releaseAdmin(connection);
        
        // Delete ""everything"" from Post as alice. Bob should remain, as alice can't see bob's row.
        await em.createQueryBuilder().setSessionVariables({myVar: {user: alice}}).delete().from(Post, "post").execute();
        await becomeAdmin(connection);
        await em.find(Post, {order: {id: "ASC"}}).should.become([{id:2, owner: bob}]);
        await releaseAdmin(connection);

        // Deleting 'alice' again shouldn't change the db entries.
        await em.createQueryBuilder().setSessionVariables({myVar: {user: alice}}).delete().from(Post, "post").execute();
        await becomeAdmin(connection);
        await em.find(Post, {order: {id: "ASC"}}).should.become([{id:2, owner: bob}]);
        await releaseAdmin(connection);

        await em.remove(Post, {id: 2, owner: bob} as Post, {sessionVariables: {myVar: {user: bob}}});
        await becomeAdmin(connection);
        await em.find(Post).should.become([]);
        await releaseAdmin(connection);
    });

    it("should correctly update ONLY accessible data when session variables set the user to different users", async () => {
        const connection = connections[0];
        const em = connection.createEntityManager();
        const alice = "alice", bob = "bob";
        
        await becomeAdmin(connection);
        await em.save([
            em.create(Post, {id: 1, owner: alice}),
            em.create(Post, {id: 2, owner: bob})
        ]);
        await releaseAdmin(connection);
        
        // Updating without setting any session vars/config params should not modify any rows (due to our RLS policy)
        await em.createQueryBuilder().update(Post, {owner: "fail"}).execute();
        await becomeAdmin(connection);
        await em.find(Post, {order: {id: "ASC"}}).should.become([{id:1, owner: alice}, {id:2, owner: bob}]);
        await releaseAdmin(connection);

        await em.createQueryBuilder().setSessionVariables({myVar: {user: alice}}).update(Post, {id: 3}).execute();
        await becomeAdmin(connection);
        await em.find(Post, {order: {id: "ASC"}}).should.become([{id:2, owner: bob}, {id:3, owner: alice}]);
        await releaseAdmin(connection);
    });
});
