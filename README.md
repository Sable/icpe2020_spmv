# Paper : A fully structure-driven performance analysis of SpMV
Sparse matrix-vector multiplication (SpMV) implementations for each of the four formats -- COO, CSR, DIA and ELL. 

y = Ax where A is a M x N sparse matrix with nnz number of non-zeros, x is a dense input vector of size N and y is a dense output vector of size M.

_We provide the artifact as a docker container image for portability._

__Docker__ _: pjots/icpe2020:latest_ (https://hub.docker.com/r/pjots/icpe2020)

## Getting Started Guide on how to use the docker to run the artifact

### Install Docker
Please follow the instructions at https://docs.docker.com/install/ to install and start the Docker Engine.

### Memory and Disk Requirements
The docker image of size \~= 15GB contains benchmarks(~=47GB) in a tarball of size ~=12GB, hence it is suggested that a minimum of 70GB is required to run the artifact. Please adjust the memory(at least 8GB) and disk image size of docker engine accordingly.

### Pull Artifact Image
Please open your terminal and run the following command to pull the artifact image:

        docker pull pjots/icpe2020:latest
        
### Run Artifact
Please run the following command to start running the artifact:

        docker run pjots/icpe2020:latest
        
In addition to running the artifact, the outputs can be viewed on the host machine using -v flag as follows :

        mkdir -p <HOST_DIRECTORY_PATH>
        docker run -v <HOST_DIRECTORY_PATH>:/ICPE2020/<CONTAINER_DIRECTORY_PATH> pjots/icpe2020:latest
The following example is to view the generated RQ1 plots for SpMV C implementation at the desired HOST_DIRECTORY :

        docker run -v <HOST_DIRECTORY_PATH>:/ICPE2020/analysis/results/RQ1/c pjots/icpe2020:latest

## Step-by-Step Instruction Guide to evaluate the artifact

### Input Matrices
The input matrix is required to be in Matrix Market format (.mtx). We used 1,979 real-life sparse matrices from The SuiteSparse Matrix Collection (formerly the University of Florida Sparse Matrix Collection) at https://sparse.tamu.edu which served as the set of sparse matrix benchmarks for our experiments. We provide these benchmarks in a tarball (.tar.bz2 format).

### Target Languages and Runtime
We conducted our experiments on an Intel Core i7-3930K with 6 3.20GHz cores, 32KB L1, 256KB L2, 12MB last-level cache and 16GB memory, running Ubuntu Linux 16.04.2. We compiled our C implementations with gcc-7 at optimization level -O3. For WebAssembly, used the Chrome 74 browser (Official build 74.0.3729.108 with V8 JavaScript engine 7.4.288.25) as the execution environment. We run Chrome with a flag --experimental-wasm-simd to enable the use of SIMD (Single Instruction Multiple Data) instructions for loop vectorization optimizations in some of the SpMV WebAssembly implementations. We also enable two more flags, --wasm-no-bounds-checks and --wasm-no-stack-checks to avoid memory bounds checks and stack guards for performance testing.

### Software Requirements
All of the following software requirements are met inside the docker container image.

PAPI (Performance API) http://icl.utk.edu/papi/software/
gcc-7

python, pip, matplotlib, pandas

chrome browser version 74 (prepacked in the docker image)

Add MIME type for wasm inside apache2 config file (check .htaccess file inside wasm src directory)

### Step 1 : Run Experiments

In the home directory, shell script named run.sh executes the following implementations to collect the raw data for our experiments which includes MFLOPS for each matrix on each format, and the comma-separated format output is stored in the raw-data directory.

Run SpMV C implementation (output : raw-data/float_mflops.csv)

Run SpMV C implementation with PAPI (Collecting hardware performance counters) (output : raw-data/float_mflops_with_papi.csv)

Run C implementation to collect matrix feature (output : raw-data/features.csv)

Run SpMV WASM implementation (output : raw-data/sequential-chrome-single.csv)

### Step 2 : Analyze Results

We analyze the results by employing 10%-affinity criteria to obtain the set of matrices for each format category. An input matrix A has an x%-affinity for storage format F, if the performance for F is at least x% better than all other formats and the performance difference is greater than the measurement error. In addition to single-format categories (COO, CSR, DIA and ELL), there exist some cases where more than one format fulfils the x%-affinity metric versus the other formats but the performance between them cannot be distinguished, therefore combination-format categories were introduced.

Using scripts at analysis/scripts/RQ1, analysis/scripts/RQ2, analysis/scripts/RQ3, the results are stored at analysis/results/RQ1, analysis/results/RQ2, analysis/results/RQ3 for both c and wasm respectively.
### Step 3 : Plot Results

Finally, the plot results are generated via python scripts available at analysis/scripts/RQ1, analysis/scripts/RQ2 and analysis/scripts/RQ3 for each research question for both wasm and C. The plots are stored at analysis/results/RQ1, analysis/results/RQ2 and analysis/results/RQ3.

Two shell scripts are provided : run.sh and run_existing.sh where, 
run.sh : runs the benchmarks from step 1 to step 3. 
run_existing.sh : uses the raw-data previously generated from step 1 and runs only step 2 and step 3.

### Notes
Depending on the hardware, SpMV C implementation with PAPI may not provide the desired output since the PAPI events may not be supported by the given architecture.

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

    
## Feedback

Please contact [Prabhjot](mailto:prabhjot.sandhu@mail.mcgill.ca).
