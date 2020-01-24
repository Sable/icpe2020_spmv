import numpy as np
import pandas as pd
import matplotlib as mpl
mpl.use('agg')
import matplotlib.pyplot as plt
import sys
import os
import subprocess

def find(name, path):
  for root, dirs, files in os.walk(path):
    for f in files:
      if os.path.basename(f) == name:
        return os.path.join(root, name)

out_dir="./analysis/results/RQ2/"+sys.argv[3]+"/"
df = pd.read_csv(sys.argv[1], index_col = 'name')
df_wasm = pd.read_csv(sys.argv[2], index_col = 'name')
name_list = df.index.values
wasm_name_list = df_wasm.index.values
df['ell_reuse_distance'] = 0.0
df_wasm['ell_reuse_distance'] = 0.0
for i in name_list: 
  full_name = find(i+'.mtx', './input-data/benchmarks/')
  if full_name:
    print(full_name)
  else:
    continue
  tmp = subprocess.Popen(["./tests/c/src/run_float", full_name, "ell"], stdout=subprocess.PIPE)
  output = tmp.stdout.read()
  df.loc[i, 'ell_reuse_distance'] = output
  print output
for i in wasm_name_list: 
  full_name = find(i+'.mtx', './input-data/benchmarks/')
  if full_name:
    print(full_name)
  else:
    continue
  tmp = subprocess.Popen(["./tests/c/src/run_float", full_name, "ell"], stdout=subprocess.PIPE)
  output = tmp.stdout.read()
  df_wasm.loc[i, 'ell_reuse_distance'] = output
  print output

plt.xlabel('ELL Working Set (bytes)', fontsize=15)
plt.ylabel('Performance (MFLOPS)', fontsize=15)
plt.xticks(fontsize=15)
plt.yticks(fontsize=15)
plt.scatter(df['ws'], df['mflops'], label='ELL C', c=df['ell_reuse_distance'], cmap='gnuplot2', edgecolors='black', s=12**2, alpha=0.5, marker='o')
plt.clim(0, 100)
plt.scatter(df_wasm['ws'], df_wasm['mflops'], label='ELL WebAssembly', c=df_wasm['ell_reuse_distance'], cmap='gnuplot2', edgecolors='black', s=12**2, alpha=0.5, marker='^')
plt.clim(0, 100)
cbar = plt.colorbar()
cbar.ax.tick_params(labelsize=15)
cbar.set_label('ELL Locality Index', size=15)
plt.axvline(x=32*1024, linestyle='--', color='green',label='L1')
plt.axvline(x=256*1024, linestyle='--', color='hotpink', label='L2')
plt.axvline(x=12*1024*1024, linestyle='--',color='orange', label='L3')
plt.xscale('log')
plt.xlim(100, 1000000000)
plt.ylim(0, 3000)
plt.gca().legend(fancybox=True, framealpha=0.5, loc='lower left', fontsize=15, scatterpoints = 1)
leg = plt.gca().get_legend()
leg.legendHandles[3].set_color('white')
leg.legendHandles[3].set_edgecolor('black')
leg.legendHandles[4].set_color('white')
leg.legendHandles[4].set_edgecolor('black')
plt.savefig(out_dir+'ell_ws_scatter_plot.png')

