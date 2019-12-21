#!/bin/bash

benchmarks=`readlink -f $1`
out_dir=`readlink -f $2`
dir=`find $benchmarks -name "*.mtx"`
output_csv=`readlink -f $out_dir/features.csv`

`rm -rf $output_csv`

echo "name,N,nnz,nnz_per_row,csr_reuse_distance,num_diags,num_diag_elems,ratio_diag,num_ell_elems,ratio_ell,zero_rows,one_rows,two_rows,three_rows,four_rows,five_rows,small_rows,small_rows,elems,mean_diff_nnz,min_nnz_row,max_nnz_row,mean_nnz_row,vr_nnz_row,sd_nnz_row" > $output_csv

cd ./tests/c/src
make clean
make features

for f in $dir
do
  echo "running "$f"..."
  out=`./run_features $f`
  echo "$(basename -s .mtx $f),$out"
  echo
  echo "$(basename -s .mtx $f),$out" >> $output_csv
done
