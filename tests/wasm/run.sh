#!/bin/bash

browser=$1
precision=$2
benchmarks=`readlink -f $3`
out_dir=`readlink -f $4`

dir=`find $benchmarks -name "*.mtx"`

cd ./tests/wasm/src

echo "name,outer,inner,N,nnz,coo_sd,coo_mflops,coo_sum,csr_sd,csr_mflops,csr_sum,dia_sd,dia_mflops,dia_sum,ell_sd,ell_mflops,ell_sum" > e.out

for f in $dir
do
    echo " running "$f"..."
    ./run.py -b $browser -p $precision $f
done
mv e.out $out_dir/sequential-$browser-$precision.csv
