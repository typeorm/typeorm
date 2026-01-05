# SAP HANA

## Installation

TypeORM relies on `@sap/hana-client` for establishing the database connection:

```shell
npm install @sap/hana-client
```

If you are using TypeORM 0.3.25 or earlier, `hdb-pool` is also required for managing the pool.

## Data Source Options

See [Data Source Options](../data-source/2-data-source-options.md) for the common data source options.

-   `host` - The hostname of the SAP HANA server. For example, `"localhost"`.
-   `port` - The port number of the SAP HANA server. For example, `30015`.
-   `username` - The username to connect to the SAP HANA server. For example, `"SYSTEM"`.
-   `password` - The password to connect to the SAP HANA server. For example, `"password"`.
-   `database` - The name of the database to connect to. For example, `"HXE"`.
-   `encrypt` - Whether to encrypt the connection. For example, `true`.
-   `sslValidateCertificate` - Whether to validate the SSL certificate. For example, `true`.
-   `key`, `cert` and `ca` - Private key, public certificate and certificate authority for the encrypted connection.
-   `pool` — Connection pool configuration object:
    -   `maxConnectedOrPooled` (number) — Max active or idle connections in the pool (default: 10).
    -   `maxPooledIdleTime` (seconds) — Time before an idle connection is closed (default: 30).
    -   `pingCheck` (boolean) — Whether to validate connections before use (default: false).
    -   `poolCapacity` (number) — Maximum number of connections to be kept available (default: no limit).

See the official documentation of SAP HANA Client for more details as well as the `extra` properties: [Node.js Connection Properties](https://help.sap.com/docs/SAP_HANA_CLIENT/f1b440ded6144a54ada97ff95dac7adf/4fe9978ebac44f35b9369ef5a4a26f4c.html).

## Column Types

SAP HANA 2.0 and SAP HANA Cloud support slightly different data types. Check the SAP Help pages for more information:

-   [SAP HANA 2.0 Data Types](https://help.sap.com/docs/SAP_HANA_PLATFORM/4fe29514fd584807ac9f2a04f6754767/20a1569875191014b507cf392724b7eb.html?locale=en-US)
-   [SAP HANA Cloud Data Types](https://help.sap.com/docs/hana-cloud-database/sap-hana-cloud-sap-hana-database-sql-reference-guide/data-types)

TypeORM's `SapDriver` supports `tinyint`, `smallint`, `integer`, `bigint`, `smalldecimal`, `decimal`, `real`, `double`, `date`, `time`, `seconddate`, `timestamp`, `boolean`, `char`, `nchar`, `varchar`, `nvarchar`, `text`, `alphanum`, `shorttext`, `array`, `varbinary`, `blob`, `clob`, `nclob`, `st_geometry`, `st_point`, `real_vector` and `half_vector`. Some of these data types have been deprecated or removed in SAP HANA Cloud, and will be converted to the closest available alternative when connected to a Cloud database.

### Vector Types

The `real_vector` and `half_vector` data types were introduced in SAP HANA Cloud (2024Q1 and 2025Q2 respectively), and require a supported version of `@sap/hana-client` as well.

For consistency with PostgreSQL's vector support, TypeORM also provides aliases:

-   `vector` (alias for `real_vector`) - stores vectors as 4-byte floats
-   `halfvec` (alias for `half_vector`) - stores vectors as 2-byte floats for memory efficiency

```typescript
@Entity()
export class Document {
    @PrimaryGeneratedColumn()
    id: number

    // Using SAP HANA native type names
    @Column("real_vector", { length: 1536 })
    embedding: Buffer | number[]

    @Column("half_vector", { length: 768 })
    reduced_embedding: Buffer | number[]

    // Using cross-database aliases (recommended)
    @Column("vector", { length: 1536 })
    universal_embedding: Buffer | number[]

    @Column("halfvec", { length: 768 })
    universal_reduced_embedding: Buffer | number[]
}
```

By default, the client will return a `Buffer` in the `fvecs`/`hvecs` format, which is more efficient. It is possible to let the driver convert the values to a `number[]` by adding `{ extra: { vectorOutputType: "Array" } }` to the connection options. Check the SAP HANA Client documentation for more information about [REAL_VECTOR](https://help.sap.com/docs/SAP_HANA_CLIENT/f1b440ded6144a54ada97ff95dac7adf/0d197e4389c64e6b9cf90f6f698f62fe.html) or [HALF_VECTOR](https://help.sap.com/docs/SAP_HANA_CLIENT/f1b440ded6144a54ada97ff95dac7adf/8bb854b4ce4a4299bed27c365b717e91.html).

Use the appropriate [vector functions](https://help.sap.com/docs/hana-cloud-database/sap-hana-cloud-sap-hana-database-sql-reference-guide/vector-functions) for similarity searches.
