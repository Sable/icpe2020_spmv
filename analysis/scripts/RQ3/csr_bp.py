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
out_dir="./analysis/results/RQ3/"+sys.argv[2]+"/"

df = pd.read_csv(sys.argv[1], index_col = 'name')

plt.xlabel('CSR Working Set (bytes)', fontsize=15)
plt.ylabel('Performance (MFLOPS)', fontsize=15)
plt.xticks(fontsize=15)
plt.yticks(fontsize=15)
plt.scatter(df['ws'], df['mflops'], label='_nolegend_', c=df['bp'], cmap='gnuplot2_r', s=12**2, alpha=0.5)
cbar = plt.colorbar()
cbar.ax.tick_params(labelsize=15)
cbar.set_label('Branch MisPrediction Percentage Index', size=15)
plt.axvline(x=32*1024, linestyle='--', color='green',label='L1')
plt.axvline(x=256*1024, linestyle='--', color='hotpink', label='L2')
plt.axvline(x=12*1024*1024, linestyle='--',color='orange', label='L3')
plt.xlim(100, 1000000000)
plt.xscale('log')
plt.gca().legend(fancybox=True, framealpha=0.5, scatterpoints=1, fontsize=15, loc='best')
plt.savefig(out_dir+'csr_bp_scatter_plot.png')
