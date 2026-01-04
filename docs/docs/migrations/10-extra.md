# Extra options

## Timestamp

If you need to specify a timestamp for the migration name, use the `-t` (alias for `--timestamp`) and pass the timestamp (should be a non-negative number)

```shell
typeorm -t <specific-timestamp> migration:{create|generate}
```

You can get a timestamp from:

```js
Date.now()
/* OR */ new Date().getTime()
```
