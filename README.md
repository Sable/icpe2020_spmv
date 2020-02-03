# Paper : A fully structure-driven performance analysis of SpMV

## Input Matrices
The input matrix is required to be in Matrix Market format (.mtx). We used 1,979 real-life sparse matrices from The SuiteSparse Matrix Collection (formerly the University of Florida Sparse Matrix Collection) at https://sparse.tamu.edu which served as the set of sparse matrix benchmarks for our experiments. We provide these benchmarks in a tarball (.tar.bz2 format).

## How to build a docker image from this repository

### 1. Initial setup (including setting up output directories and downloading the tools and input matrices) can be done in one of the two ways as follows :

#### Using script
    ./initial_setup.sh
    
#### Manually
    mkdir -p ./analysis/results/RQ1/c ./analysis/results/RQ2/c ./analysis/results/RQ3/c ./analysis/results/RQ1/wasm ./analysis/results/RQ2/wasm input-data raw-data tools

Please download *benchmarks.tar.bz2* from and store it under the directory called *input-data*.

Please download *chrome74.tar* from https://drive.google.com/open?id=14_PrH2oHcfrAW2cfo5_yYKb6XiHsZWxz, untar it using *tar -xvf chrome74.tar* and store it under the directory called *tools*


### 2. Build the docker image
    docker build -t pjots/my_image .
    
## How to run a docker image
    docker run pjots/my_image
    
    
