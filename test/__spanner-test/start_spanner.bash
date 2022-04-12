#!/bin/bash

set -m

gcloud beta emulators spanner start --host-port=0.0.0.0:9010 &

# configure gcloud cli to connect to emulator
gcloud config set auth/disable_credentials true
gcloud config set project test-project
gcloud config set api_endpoint_overrides/spanner http://localhost:9020/

# create spanner instance
gcloud spanner instances create test-instance \
  --config=emulator-config \
  --description="Test Instance" \
  --nodes=1

# create spanner database with the given schema
gcloud spanner databases create test-db \
 --instance=test-instance

fg %1
