FROM google/cloud-sdk:slim

RUN apt-get install -y google-cloud-sdk google-cloud-sdk-spanner-emulator

COPY ./start_spanner.bash start_spanner.bash

RUN ["chmod", "+x", "./start_spanner.bash"]

CMD ./start_spanner.bash
