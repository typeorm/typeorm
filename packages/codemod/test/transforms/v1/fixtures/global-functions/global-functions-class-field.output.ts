// Class field initializer — `conn = createConnection()` sits inside a
// class body, not inside a Statement or VariableDeclaration. The TODO
// walk must recognize `ClassProperty` / `PropertyDefinition` as a host
// so the removed-API TODO lands on the class field itself.
class UserService {
    // TODO(typeorm-v1): `createConnection()` was removed — instantiate a `DataSource` and call `.initialize()` instead: `const dataSource = new DataSource(options); await dataSource.initialize()`
    conn = createConnection({ type: "postgres" })
}
