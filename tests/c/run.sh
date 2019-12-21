#!/bin/bash

echo "Running matrix benchmarks in C"

benchmarks=`readlink -f $1`
out_dir=`readlink -f $3`
dir=`find $benchmarks -name "*.mtx"`
output_csv=`readlink -f $out_dir/$2_"mflops.csv"`

`rm -rf $output_csv`

echo "name,outer,inner,N,nnz,coo_sd,coo_mflops,coo_sum,csr_sd,csr_mflops,csr_sum,dia_sd,dia_mflops,dia_sum,ell_sd,ell_mflops,ell_sum" > $output_csv

cd ./tests/c/src
make clean
make $2

for f in $dir
do
  echo "running "$f"..."
  out1=`./run_$2 $f coo 2>/dev/null`
  if [ $? -ne 0 ]
  then
    out1="-1,-1,-1,-1,-1,-1,-1"
  fi
  out2=`./run_$2 $f csr 2>/dev/null`
  if [ $? -ne 0 ]
  then
    out2="-1,-1,-1"
  fi
  out3=`./run_$2 $f dia 2>/dev/null`
  if [ $? -ne 0 ]
  then
    out3="-1,-1,-1"
  fi
  out4=`./run_$2 $f ell 2>/dev/null`
  if [ $? -ne 0 ]
  then
    out4="-1,-1,-1"
  fi
  echo "$(basename -s .mtx $f),$out1,$out2,$out3,$out4"
  echo
  echo "$(basename -s .mtx $f),$out1,$out2,$out3,$out4" >> $output_csv
done
