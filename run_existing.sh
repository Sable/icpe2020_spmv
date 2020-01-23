#!/bin/bash

tar -xvjf ./input-data/benchmarks.tar.bz2 -C ./input-data/
rm ./input-data/benchmarks.tar.bz2

#./tests/c/run.sh ./input-data/benchmarks float ./raw-data

#./tests/c/run_features.sh ./input-data/benchmarks ./raw-data

#./tests/wasm/run.sh chrome single ./input-data/benchmarks ./raw-data

#./tests/c/run_papi.sh ./input-data/benchmarks float ./raw-data

#step2  

python ./analysis/scripts/RQ1/combine.py ./existing-data/features.csv ./existing-data/float_mflops.csv c
python ./analysis/scripts/RQ1/combine.py ./existing-data/features.csv ./existing-data/sequential-chrome-single.csv wasm
python ./analysis/scripts/RQ3/combine.py ./existing-data/features.csv ./existing-data/float_mflops.csv ./existing-data/float_mflops_with_papi.csv c

#step3 : RQ1
python ./analysis/scripts/RQ1/dia_ratio.py ./analysis/results/RQ1/c/combined_dia.csv ./analysis/results/RQ1/c/combined_comb_dia.csv ./analysis/results/RQ1/c/combined_not_dia.csv c
python ./analysis/scripts/RQ1/ell_ratio.py ./analysis/results/RQ1/c/combined_ell.csv ./analysis/results/RQ1/c/combined_comb_ell.csv ./analysis/results/RQ1/c/combined_not_ell.csv c
python ./analysis/scripts/RQ1/coo_nnz_row.py ./analysis/results/RQ1/c/combined_coo.csv ./analysis/results/RQ1/c/combined_comb_coo.csv ./analysis/results/RQ1/c/combined_not_coo.csv c

python ./analysis/scripts/RQ1/dia_ratio.py ./analysis/results/RQ1/wasm/combined_dia.csv ./analysis/results/RQ1/wasm/combined_comb_dia.csv ./analysis/results/RQ1/wasm/combined_not_dia.csv wasm
python ./analysis/scripts/RQ1/ell_ratio.py ./analysis/results/RQ1/wasm/combined_ell.csv ./analysis/results/RQ1/wasm/combined_comb_ell.csv ./analysis/results/RQ1/wasm/combined_not_ell.csv wasm
python ./analysis/scripts/RQ1/coo_nnz_row.py ./analysis/results/RQ1/wasm/combined_coo.csv ./analysis/results/RQ1/wasm/combined_comb_coo.csv ./analysis/results/RQ1/wasm/combined_not_coo.csv wasm

ls -la ./analysis/results/RQ1/c
ls -la ./analysis/results/RQ1/wasm

#step3 : RQ2
python ./analysis/scripts/RQ2/dia_ws.py ./analysis/results/RQ1/c/combined_dia.csv c
python ./analysis/scripts/RQ2/coo_ws.py ./analysis/results/RQ1/c/combined_coo.csv c
python ./analysis/scripts/RQ2/csr_ws.py ./analysis/results/RQ1/c/combined_csr.csv c

python ./analysis/scripts/RQ2/dia_ws.py ./analysis/results/RQ1/wasm/combined_dia.csv wasm
python ./analysis/scripts/RQ2/coo_ws.py ./analysis/results/RQ1/wasm/combined_coo.csv wasm
python ./analysis/scripts/RQ2/csr_ws.py ./analysis/results/RQ1/wasm/combined_csr.csv wasm

make -C ./tests/c/src/ float ELLR=1
python ./analysis/scripts/RQ2/ell_ws.py ./analysis/results/RQ1/c/combined_ell.csv ./analysis/results/RQ1/wasm/combined_ell.csv c

ls -la ./analysis/results/RQ2/c
ls -la ./analysis/results/RQ2/wasm

#step3 : RQ3

python ./analysis/scripts/RQ3/csr_bp.py ./analysis/results/RQ3/c/combined_csr.csv c
python ./analysis/scripts/RQ3/csr_misses.py ./analysis/results/RQ3/c/combined_csr.csv c
python ./analysis/scripts/RQ3/csr_coo_bp.py ./analysis/results/RQ3/c/combined_csr.csv ./analysis/results/RQ3/c/combined_coo.csv c

ls -la ./analysis/results/RQ3/c
