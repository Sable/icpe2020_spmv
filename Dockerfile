# pull base image
FROM ubuntu:16.04

EXPOSE 9222

# install GCC-7
RUN apt update && \
    apt-get install -y software-properties-common build-essential && \
    add-apt-repository ppa:ubuntu-toolchain-r/test -y && \
    apt update && \
    apt-get install gcc-7 -y && \
    update-alternatives --install /usr/bin/gcc gcc /usr/bin/gcc-7 60 && \
    update-alternatives --config gcc && \
    gcc --version

#install apache2
RUN apt-get install apache2 -y

#install python, git, make
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y python python3 git make nodejs npm

# download and build papi library
WORKDIR /
RUN git clone https://bitbucket.org/icl/papi.git && \
    cd papi && \
    git pull https://bitbucket.org/icl/papi.git && \
    cd src && \
    ./configure && \
    make && \
    make test && \
    make install
ENV LD_LIBRARY_PATH=/usr/local/lib:$LD_LIBRARY_PATH


RUN apt-get update && \ 
     apt-get install -yq --no-install-recommends \ 
     libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 \ 
     libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 \ 
     libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 \ 
     libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 \ 
     libnss3 

RUN apt-get install -y psmisc

RUN apt-get update && \ 
    apt-get install -y python-pip && \
    which pip && \
    pip install --upgrade pip && \
    python -m pip install pandas && \
    python -m pip install scipy && \
    python -m pip install matplotlib && \
    apt-get install -y python-tk
    
ENV DISPLAY=:0.0

#run benchmarks
WORKDIR /ICPE2020
COPY run.sh ./run.sh
COPY paper.pdf ./paper.pdf
COPY index.html ./index.html
COPY run_existing.sh ./run_existing.sh
COPY tools ./tools
COPY tests ./tests
COPY raw-data ./raw-data
COPY existing-data ./existing-data
COPY analysis ./analysis
COPY input-data/benchmarks.tar.bz2 ./input-data/
RUN echo "application/wasm		wasm" >> /etc/mime.types
RUN service apache2 restart
CMD ./run.sh

