# Custom migration hooks

For advanced use cases, TypeORM exposes a set of hooks that you can use to customize the behavior of migrations for
relational databases.

These hooks will be called during database synchronization and during migration generation.

## Use cases

Data definition language (DDL) is a set of commands that are used to create, modify and drop tables, columns,
constraints, indexes and other database objects.

Most of relational databases use their custom syntax to specify objects beyond SQL-92 standard.

### Simple multiplication function

Differences between SQL dialects make it impossible to write a generic DDL statement that can be used to create a
function that multiplies two numbers. These differences become even larger if you consider more complicated functions.

#### SQL Server

```tsql
CREATE FUNCTION multiply(
    @a INT,
    @b INT
)
    RETURNS INT
AS
    RETURN
SELECT @a * @b
```

#### Postgres

```postgresql
CREATE FUNCTION multiply(a INT, b INT)
    RETURNS INT
    STABLE
    RETURNS NULL ON NULL INPUT
    language 'plpgsql'
as
$$
begin
    return a * b;
end;
$$
```

#### MySQL

```mysql

DELIMITER $$

CREATE FUNCTION multiply(a INT, b INT)
    RETURNS INT
    DETERMINISTIC
BEGIN
    RETURN a * b;
END$$
DELIMITER ;
```




## Custom hooks


