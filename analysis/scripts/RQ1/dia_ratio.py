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
df_not = df_not.loc[df_not.ratio_diag < 5]

plt.xlabel('dia_ratio', fontsize=15)
plt.ylabel('Performance (MFLOPS)', fontsize=15)
plt.scatter(df['ratio_diag'], df['mflops'], color='b', label='DIA', edgecolors='darkblue', s=12**2, alpha=0.5, marker='*')
plt.ylim([0, 12000])
plt.xlim([0, 6])
plt.xticks(fontsize=15)
plt.yticks(fontsize=15)
if not df_comb.empty:
  plt.scatter(df_comb['ratio_diag'], df_comb['mflops'], label='combination-DIA', color='orange', edgecolors='darkorange', s=12**2, alpha=0.5, marker='v')
if not df_not.empty:
  plt.scatter(df_not['ratio_diag'], df_not['mflops'], color='deeppink', label='not-DIA', edgecolors='m', s=12**2, alpha=0.5, marker='^')
plt.gca().legend(fancybox=True, framealpha=0.5, loc=0, fontsize=15, scatterpoints = 1)
plt.savefig(out_dir+'dia_ratio_scatter_plot.png')

