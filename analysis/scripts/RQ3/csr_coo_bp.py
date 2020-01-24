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
out_dir="./analysis/results/RQ3/"+sys.argv[3]+"/"

df = pd.read_csv(sys.argv[1], index_col = 'name')
df = df.loc[df.nnz_per_row < 15]

df_coo = pd.read_csv(sys.argv[2], index_col = 'name')


plt.xlabel('avg_nnz_per_row', fontsize=15)
plt.ylabel('Performance (MFLOPS)', fontsize=15)
plt.xticks(fontsize=15)
plt.yticks(fontsize=15)
bp = np.concatenate([df['bp'], df_coo['bp']], axis = 0)
min_bp = bp.min()
max_bp = bp.max()
print min_bp
print max_bp
plt.scatter(df['nnz_per_row'], df['mflops'], label='CSR', c=df['bp'], cmap='gnuplot2_r', edgecolors='black', s=12**2, alpha=0.5, marker='^')
plt.clim(min_bp, max_bp)
plt.scatter(df_coo['nnz_per_row'], df_coo['mflops'], label='COO', c=df_coo['bp'], cmap='gnuplot2_r', edgecolors='black', s=12**2, alpha=0.5, marker='*')
plt.clim(min_bp, max_bp)
cbar = plt.colorbar()
cbar.ax.tick_params(labelsize=15)
cbar.set_label('Branch MisPrediction Percentage Index', size=15)
plt.xlim(0,15)
plt.gca().legend(fancybox=True, framealpha=0.5, scatterpoints=1, fontsize=15, loc='best')
leg = plt.gca().get_legend()
leg.legendHandles[0].set_color('white')
leg.legendHandles[0].set_edgecolor('black')
leg.legendHandles[1].set_color('white')
leg.legendHandles[1].set_edgecolor('black')
plt.savefig(out_dir+'csr_coo_bp_scatter_plot.png')
