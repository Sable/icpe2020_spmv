import numpy as np
import pandas as pd
import matplotlib as mpl
mpl.use('agg')
import matplotlib.pyplot as plt
import sys

L1 = 32 * 1024
L2 = 256 * 1024
L3 = 12*1024*1024
MM = 16*1024*1024*1024
out_dir="./analysis/results/RQ1/"+sys.argv[4]+"/"

df = pd.read_csv(sys.argv[1], index_col = 'name')

df_comb = pd.read_csv(sys.argv[2], index_col = 'name')

df_not = pd.read_csv(sys.argv[3], index_col = 'name')
df_not = df_not.loc[df_not.nnz_per_row < 15]
df_not = df_not.loc[df_not['format'] == 'csr']
df_not = df_not.loc[df_not['mflops'] > 0]

plt.xlabel('avg_nnz_per_row', fontsize=15)
plt.ylabel('Performance (MFLOPS)', fontsize=15)
plt.xticks(fontsize=15)
plt.yticks(fontsize=15)
if not df_comb.empty:
  plt.scatter(df_comb['nnz_per_row'], df_comb['mflops'], label='combination-COO', color='orange', edgecolors='darkorange', s=12**2, alpha=0.5, marker='v')
if not df_not.empty:
  plt.scatter(df_not['nnz_per_row'], df_not['mflops'], color='deeppink', label='CSR', edgecolors='m', s=12**2, alpha=0.5, marker='^')
plt.scatter(df['nnz_per_row'], df['mflops'], color='b', label='COO', edgecolors='darkblue', s=12**2, alpha=0.5, marker='*')
plt.gca().legend(fancybox=True, framealpha=0.5, loc=0, fontsize=15, scatterpoints = 1)
plt.xlim([0, 15])
plt.ylim([0,3000])
plt.savefig(out_dir+'coo_nnz_row_scatter_plot.png')

