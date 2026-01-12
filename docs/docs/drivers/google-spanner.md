# Google Spanner

## Installation

```shell
npm install @google-cloud/spanner
```

## Data Source Options

See [Data Source Options](../data-source/2-data-source-options.md) for the common data source options.

Provide authentication credentials to your application code
by setting the environment variable `GOOGLE_APPLICATION_CREDENTIALS`:

```shell
# Linux/macOS
export GOOGLE_APPLICATION_CREDENTIALS="KEY_PATH"

# Windows
set GOOGLE_APPLICATION_CREDENTIALS=KEY_PATH

# Replace KEY_PATH with the path of the JSON file that contains your service account key.
```

To use Spanner with the emulator you should set `SPANNER_EMULATOR_HOST` environment variable:

```shell
# Linux/macOS
export SPANNER_EMULATOR_HOST=localhost:9010

# Windows
set SPANNER_EMULATOR_HOST=localhost:9010
```

## Column Types

`bool`, `int64`, `float64`, `numeric`, `string`, `json`, `bytes`, `date`, `timestamp`, `array`
