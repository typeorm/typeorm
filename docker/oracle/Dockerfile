FROM container-registry.oracle.com/database/express:21.3.0-xe

ENV ORACLE_PWD=oracle
ENV ORACLE_SID=XE
COPY 01_init.sql /docker-entrypoint-initdb.d/startup/
ENV PORT=1521

EXPOSE ${PORT}
