#!/bin/bash

mkdir -p ./analysis/results/RQ1/c ./analysis/results/RQ2/c ./analysis/results/RQ3/c ./analysis/results/RQ1/wasm ./analysis/results/RQ2/wasm input-data raw-data tools

pip install --user gdown
#gdown --id 1JK0tZnn6290oBx4rco33xURbNkozBZts
#mv small_benchmarks.tar.bz2 input-data/benchmarks.tar.bz2
gdown --id 14_PrH2oHcfrAW2cfo5_yYKb6XiHsZWxz
tar -xvf chrome74.tar -C tools/
