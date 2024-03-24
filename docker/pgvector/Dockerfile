# Start from the PostGIS image
# mdillon/postgis is postgres + PostGIS (only). if you need additional
# extensions, it's probably time to create a purpose-built image with all
# necessary extensions. sorry, and thanks for adding support for them!
FROM postgis/postgis:14-3.3

# Install git
RUN apt-get update && apt-get install -y git make gcc postgresql-server-dev-all

# Clone the pgvector repository
RUN git clone --branch v0.6.2 https://github.com/pgvector/pgvector.git

COPY 01_init.sql /docker-entrypoint-initdb.d/

# Build and install the pgvector extension
WORKDIR /pgvector
RUN make && make install
