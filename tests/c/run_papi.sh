#!/bin/bash


echo "Running matrix benchmarks in C with PAPI"

benchmarks=`readlink -f $1`
out_dir=`readlink -f $3`
dir=`find $benchmarks -name "*.mtx"`
output_csv=`readlink -f $out_dir/$2_"mflops_with_papi.csv"`

rm -rf $output_csv

echo "name,outer,inner,N,nnz,coo_sd,coo_mflops,coo_sum,coo_l1,coo_l2,coo_l3,coo_bp,csr_sd,csr_mflops,csr_sum,csr_l1,csr_l2,csr_l3,csr_bp,dia_sd,dia_mflops,dia_sum,dia_l1,dia_l2,dia_l3,dia_bp,ell_sd,ell_mflops,ell_sum,ell_l1,ell_l2,ell_l3,ell_bp" > $output_csv

cd ./tests/c/src
make clean
make $2 DEBUG=1

for f in $dir
do
  echo "running "$f"..."
  echo "./run_$2 $f coo"
  out1=`./run_$2 $f coo 2>/dev/null`
  if [ $? -ne 0 ]
  then
    out1="-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1"
  fi
  out2=`./run_$2 $f csr 2>/dev/null`
  if [ $? -ne 0 ]
  then
    out2="-1,-1,-1,-1,-1,-1,-1"
  fi
  out3=`./run_$2 $f dia 2>/dev/null`
  if [ $? -ne 0 ]
  then
    out3="-1,-1,-1,-1,-1,-1,-1"
  fi
  out4=`./run_$2 $f ell 2>/dev/null`
  if [ $? -ne 0 ]
  then
    out4="-1,-1,-1,-1,-1,-1,-1"
  fi
  echo "$(basename -s .mtx $f),$out1,$out2,$out3,$out4"
  echo
  echo "$(basename -s .mtx $f),$out1,$out2,$out3,$out4" >> $output_csv
done
