# Paper : A fully structure-driven performance analysis of SpMV
We provide the artifact as a docker container image for portability.

Docker : pjots/icpe2020:latest
## Install Docker
Please follow the instructions at https://docs.docker.com/install/ to install and start the Docker Engine.

## Pull Artifact Image
Please open your terminal and run the following command to pull the artifact image:

        docker pull pjots/icpe2020:latest
        
## Run Artifact
Please run the following command to start running the artifact:

        docker run pjots/icpe2020:latest
        
In addition to running the artifact, the outputs can be viewed on the host machine using -v flag as follows :

        mkdir -p <HOST_DIRECTORY_PATH>
        docker run -v <HOST_DIRECTORY_PATH>:/ICPE2020/<CONTAINER_DIRECTORY_PATH> pjots/icpe2020:latest
The following example is to view the generated RQ1 plots for SpMV C implementation at the desired HOST_DIRECTORY :

        docker run -v <HOST_DIRECTORY_PATH>:/ICPE2020/analysis/results/RQ1/c pjots/icpe2020:latest

## How to build and run your own docker image from this repository

### Pre-req : Install pip
        curl -LO https://bootstrap.pypa.io/get-pip.py
        python get-pip.py --user

### 1. Initial setup (including setting up output directories and downloading the tools and input matrices) can be done in one of the two ways as follows :

#### Using script
    ./initial_setup.sh
    
#### Manually
    mkdir -p ./analysis/results/RQ1/c ./analysis/results/RQ2/c ./analysis/results/RQ3/c ./analysis/results/RQ1/wasm ./analysis/results/RQ2/wasm input-data raw-data tools

Please download *benchmarks.tar.bz2* from https://drive.google.com/open?id=1j546K-LWobgYEMT5J4-0C2BjIIfHTvRI and store it under the directory called *input-data*.

Please download *chrome74.tar* from https://drive.google.com/open?id=14_PrH2oHcfrAW2cfo5_yYKb6XiHsZWxz, untar it using *tar -xvf chrome74.tar* and store it under the directory called *tools*


### 2. Build the docker image
    docker build -t pjots/my_image .
    
### 3. Run the docker image
    docker run pjots/my_image
    
## Input Matrices
The input matrix is required to be in Matrix Market format (.mtx). We used 1,979 real-life sparse matrices from The SuiteSparse Matrix Collection (formerly the University of Florida Sparse Matrix Collection) at https://sparse.tamu.edu which served as the set of sparse matrix benchmarks for our experiments. We provide these benchmarks in a tarball (.tar.bz2 format).

## Target Languages and Runtime
We conducted our experiments on an Intel Core i7-3930K with 6 3.20GHz cores, 32KB L1, 256KB L2, 12MB last-level cache and 16GB memory, running Ubuntu Linux 16.04.2. We compiled our C implementations with gcc-7 at optimization level -O3. For WebAssembly, used the Chrome 74 browser (Official build 74.0.3729.108 with V8 JavaScript engine 7.4.288.25) as the execution environment. We run Chrome with a flag --experimental-wasm-simd to enable the use of SIMD (Single Instruction Multiple Data) instructions for loop vectorization optimizations in some of the SpMV WebAssembly implementations. We also enable two more flags, --wasm-no-bounds-checks and --wasm-no-stack-checks to avoid memory bounds checks and stack guards for performance testing.
    
## Memory and Disk Requirements
The docker image of size \~= 15GB contains benchmarks(~=47GB) in a tarball of size ~=12GB, hence it is suggested that a minimum of 70GB is required to run the artifact. Please adjust the memory(at least 8GB) and disk image size of docker engine accordingly.
    
## Feedback

Please contact [Prabhjot](mailto:prabhjot.sandhu@mail.mcgill.ca).
