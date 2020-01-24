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
df_not = df_not.loc[df_not.ratio_ell > 0]
df_not = df_not.loc[df_not.ratio_ell < 3]
df_not = df_not.loc[df_not.max_nnz_row < 100]
df_not = df_not[~(df_not['format'].str.contains('dia') == True)]
df_not = df_not.loc[df_not['mflops'] > 0]

plt.xlabel('ell_ratio', fontsize=15)
plt.ylabel('Performance (MFLOPS)', fontsize=15)
plt.xticks(fontsize=15)
plt.yticks(fontsize=15)
nnz_per_row = np.concatenate([df['max_nnz_row'], df_comb['max_nnz_row'], df_not['max_nnz_row']], axis = 0)
min_nnz_per_row = nnz_per_row.min()
max_nnz_per_row = nnz_per_row.max()
plt.scatter(df['ratio_ell'], df['mflops'], label='ELL', c=df['max_nnz_row'], cmap='gnuplot2_r', edgecolors='black', s=12**2, alpha=0.5, marker='*')
plt.clim(min_nnz_per_row, max_nnz_per_row)
if not df_comb.empty:
  plt.scatter(df_comb['ratio_ell'], df_comb['mflops'], label='combination-ELL', c=df_comb['max_nnz_row'], cmap='gnuplot2_r', edgecolors='black', s=12**2, alpha=0.5, marker='o')
  plt.clim(min_nnz_per_row, max_nnz_per_row)
if not df_not.empty:
  plt.scatter(df_not['ratio_ell'], df_not['mflops'], label='not-DIA-not-ELL', c=df_not['max_nnz_row'], cmap='gnuplot2_r', edgecolors='black', s=12**2, alpha=0.5, marker='^')
  plt.clim(min_nnz_per_row, max_nnz_per_row)
cbar = plt.colorbar()
cbar.ax.tick_params(labelsize=15)
cbar.set_label('max_nnz_per_row', size=15)
plt.gca().legend(fancybox=True, framealpha=0.5, loc=0, fontsize=15, scatterpoints = 1)
leg = plt.gca().get_legend()
leg.legendHandles[0].set_color('white')
leg.legendHandles[0].set_edgecolor('black')
leg.legendHandles[1].set_color('white')
leg.legendHandles[1].set_edgecolor('black')
leg.legendHandles[2].set_color('white')
leg.legendHandles[2].set_edgecolor('black')
plt.ylim([0,3000])
plt.savefig(out_dir+'ell_ratio_scatter_plot.png')

