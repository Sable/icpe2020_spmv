var coo_mflops = -1, csr_mflops = -1, dia_mflops = -1, ell_mflops = -1;
var coo_sum=-1, csr_sum=-1, dia_sum=-1, ell_sum=-1;
var coo_sd=-1, csr_sd=-1, dia_sd=-1, ell_sd=-1;
var anz = 0;
var coo_flops = [], csr_flops = [], dia_flops = [], ell_flops = [];
var N;
var variance;
var inside = 0, inner_max = 1000000, outer_max = 30;
let memory = Module['wasmMemory'];
var malloc_instance;
var sparse_instance;

function sswasm_MM_info(){
  this.field = '';
  this.symmetry = '';
  this.nrows = 0;
  this.ncols = 0;
  this.nentries = 0;
  this.row;
  this.col;
  this.val;
  this.anz = 0;
}

function sswasm_COO_t(row_index, col_index, val_index, nnz){
  this.row;
  this.col;
  this.val;
  this.row_index = row_index;
  this.col_index = col_index;
  this.val_index = val_index;
  this.nnz = nnz;
}

function sswasm_CSR_t(row_index, col_index, val_index, nrows, nnz){
  this.row;
  this.col;
  this.val;
  this.row_index = row_index;
  this.col_index = col_index;
  this.val_index = val_index;
  this.nrows = nrows;
  this.nnz = nnz;
}

function sswasm_DIA_t(offset_index, data_index, ndiags, nrows, stride, nnz){
  this.offset;
  this.data;
  this.offset_index = offset_index;
  this.data_index = data_index;;
  this.ndiags = ndiags;
  this.nrows = nrows;
  this.stride = stride;
  this.nnz = nnz;
}

function sswasm_ELL_t(indices_index, data_index, ncols, nrows, nnz){
  this.indices;
  this.data;
  this.indices_index = indices_index;
  this.data_index = data_index;
  this.ncols = ncols;
  this.nrows = nrows;
  this.nnz = nnz;
}

function sswasm_x_t(x_index, x_nelem){
  this.x;
  this.x_index = x_index;
  this.x_nelem = x_nelem;
}

function sswasm_y_t(y_index, y_nelem){
  this.y;
  this.y_index = y_index;
  this.y_nelem = y_nelem;
}

function matlab_modulo(x, y) {
  var n = Math.floor(x/y);
  return x - n*y;
}

function fletcher_sum(A) {
  var sum1 = 0;
  var sum2 = 0;

  for (var i = 0; i < A.length; ++i) {
    sum1 = matlab_modulo((sum1 + A[i]),255);
    sum2 = matlab_modulo((sum2 + sum1),255);
  }
  return sum2 * 256 + sum1;
}

function fletcher_sum_y(y_view)
{
  var y = new Float32Array(memory.buffer, y_view.y_index, y_view.y_nelem);
  return parseInt(fletcher_sum(y));
}

function init_x(x_view){
  var x = new Float32Array(memory.buffer, x_view.x_index, x_view.x_nelem);
  for(var i = 0; i < x_view.x_nelem; i++)
    x[i] = i;
}

function clear_y(y_view){
  var y = new Float32Array(memory.buffer, y_view.y_index, y_view.y_nelem);
  y.fill(0);
}

function pretty_print_COO(A_coo){
  var coo_row = new Int32Array(memory.buffer, A_coo.row_index, A_coo.nnz); 
  var coo_col = new Int32Array(memory.buffer, A_coo.col_index, A_coo.nnz); 
  var coo_val = new Float32Array(memory.buffer, A_coo.val_index, A_coo.nnz); 
  
  console.log("nnz : ", A_coo.nnz); 
  console.log("coo_row_index :", A_coo.row_index);
  console.log("coo_col_index :", A_coo.col_index);
  console.log("coo_val_index :", A_coo.val_index);
  for(var i = 0; i < A_coo.nnz; i++)
    console.log(coo_row[i], coo_col[i], coo_val[i]);
}

function pretty_print_CSR(A_csr){
  var csr_row = new Int32Array(memory.buffer, A_csr.row_index, A_csr.nrows + 1); 
  var csr_col = new Int32Array(memory.buffer, A_csr.col_index, A_csr.nnz); 
  var csr_val = new Float32Array(memory.buffer, A_csr.val_index, A_csr.nnz); 
  
  console.log("nnz : ", A_csr.nnz); 
  console.log("csr_row_index :", A_csr.row_index);
  console.log("csr_col_index :", A_csr.col_index);
  console.log("csr_val_index :", A_csr.val_index);
  for(var i = 0; i < A_csr.nrows; i++){
    for(var j = csr_row[i]; j < csr_row[i+1] ; j++)
      console.log(i, csr_col[j], csr_val[j]);
  }
}

function pretty_print_x(x_view){
  var x = new Float32Array(memory.buffer, x_view.x_index, x_view.x_nelem);
  console.log("x_index :", x_view.x_index); 
  for(var i = 0; i < x_view.x_nelem; i++)
    console.log(x[i]);
}


function pretty_print_y(y_view){
  var y = new Float32Array(memory.buffer, y_view.y_index, y_view.y_nelem);
  console.log("y_index :", y_view.y_index); 
  for(var i = 0; i <y_view.y_nelem; i++)
    console.log(y[i]);
}

function num_cols(A_csr)
{
  var csr_row = new Int32Array(memory.buffer, A_csr.row_index, A_csr.nrows + 1); 
  var N = A_csr.nrows;
  var temp, max = 0;
  for(var i = 0; i < N ; i++){
    temp = csr_row[i+1] - csr_row[i];
    if (max < temp)
      max = temp;
  }
  return max;
}

function csr_ell(A_csr, A_ell)
{
  var csr_row = new Int32Array(memory.buffer, A_csr.row_index, A_csr.nrows + 1); 
  var csr_col = new Int32Array(memory.buffer, A_csr.col_index, A_csr.nnz); 
  var csr_val = new Float32Array(memory.buffer, A_csr.val_index, A_csr.nnz); 

  var indices = new Int32Array(memory.buffer, A_ell.indices_index, A_ell.ncols * A_ell.nrows);
  var data = new Float32Array(memory.buffer, A_ell.data_index, A_ell.ncols * A_ell.nrows);

  var nz = A_csr.nnz; 
  var N = A_csr.nrows;

  var i, j, k, temp, max = 0;
  for(i = 0; i < N; i++){
    k = 0;
    for(j = csr_row[i]; j < csr_row[i+1]; j++){
      data[k*N+i] = csr_val[j];
      indices[k*N+i] = csr_col[j];
      k++;
    }
  }
}

function num_diags(A_csr)
{
  var csr_row = new Int32Array(memory.buffer, A_csr.row_index, A_csr.nrows + 1); 
  var csr_col = new Int32Array(memory.buffer, A_csr.col_index, A_csr.nnz); 
  var N = A_csr.nrows;
  var ind = new Int32Array(2*N-1);
  var num_diag = 0;
  ind.fill(0);
  for(var i = 0; i < N ; i++){
    for(var j = csr_row[i]; j<csr_row[i+1]; j++){
      if(!ind[N+csr_col[j]-i-1]++)
        num_diag++;
    }
  }
  var diag_no = -(parseInt((2*N-1)/2));
  var min = Math.abs(diag_no);
  for(var i = 0; i < 2*N-1; i++){
    if(ind[i]){
      if(min > Math.abs(diag_no))
        min = Math.abs(diag_no); 
    }
    diag_no++; 
  }
  stride = N - min;
  //stride = N;
  return [num_diag,stride];
}


function csr_dia(A_csr, A_dia)
{
  var csr_row = new Int32Array(memory.buffer, A_csr.row_index, A_csr.nrows + 1); 
  var csr_col = new Int32Array(memory.buffer, A_csr.col_index, A_csr.nnz); 
  var csr_val = new Float32Array(memory.buffer, A_csr.val_index, A_csr.nnz); 

  var offset = new Int32Array(memory.buffer, A_dia.offset_index, A_dia.ndiags);
  var data = new Float32Array(memory.buffer, A_dia.data_index, A_dia.ndiags * A_dia.stride);

  var nz = A_csr.nnz; 
  var N = A_csr.nrows;
  var stride = A_dia.stride;

  var ind = new Int32Array(2*N-1);
  var i, j, move;
  ind.fill(0);

  for(i = 0; i < N; i++){
    for(j = csr_row[i]; j < csr_row[i+1]; j++){ 
      ind[N+csr_col[j]-i-1]++;
    }
  }
  var diag_no = -(parseInt((2*N-1)/2));
  var index = 0;
  for(i = 0; i < 2*N-1; i++){
    if(ind[i])
      offset[index++] = diag_no;
    diag_no++; 
  }
  var c;
  
  for(i = 0; i < N; i++){
    for(j = csr_row[i]; j < csr_row[i+1]; j++){ 
      c = csr_col[j];  
      for(k = 0; k < offset.length; k++){
        move = 0;
        if(c - i == offset[k]){
          if(offset[k] < 0)
            move = N - stride; 
          data[k*stride+i-move] = csr_val[j];
          break;
        }
      }
    }
  }
}


function quick_sort_COO(A_coo, left, right)
{
  var coo_row = new Int32Array(memory.buffer, A_coo.row_index, A_coo.nnz); 
  var coo_col = new Int32Array(memory.buffer, A_coo.col_index, A_coo.nnz); 
  var coo_val = new Float32Array(memory.buffer, A_coo.val_index, A_coo.nnz); 

  var i = left
  var j = right;
  var pivot = coo_row[parseInt((left + right) / 2)];
  var pivot_col = coo_col[parseInt((left + right) / 2)];

  /* partition */
  while(i <= j) {
    while((coo_row[i] < pivot) || (coo_row[i] == pivot && coo_col[i] < pivot_col))
      i++;
    while((coo_row[j] > pivot) || (coo_row[j] == pivot && coo_col[j] > pivot_col))
      j--;
    if(i <= j) {
      coo_row[j] = [coo_row[i], coo_row[i] = coo_row[j]][0];
      coo_col[j] = [coo_col[i], coo_col[i] = coo_col[j]][0];
      coo_val[j] = [coo_val[i], coo_val[i] = coo_val[j]][0];
      i++;
      j--;
    }
  }

  /* recursion */
  if(left < j)
    quick_sort_COO(A_coo, left, j);
  if (i < right)
    quick_sort_COO(A_coo, i, right);
}



function sort(start, end, array1, array2)
{ 
  var i, j, temp;
  for(i = 0; i < end-start-1; i++){
    for(j = start; j < end-i-1; j++){
      if(array1[j] > array1[j+1]){
        temp = array1[j];
        array1[j] = array1[j+1];
        array1[j+1] = temp;
        temp = array2[j];
        array2[j] = array2[j+1];
        array2[j+1] = temp;
      }
    }
  }
}

function coo_csr(A_coo, A_csr)
{
  var row = new Int32Array(memory.buffer, A_coo.row_index, A_coo.nnz); 
  var col = new Int32Array(memory.buffer, A_coo.col_index, A_coo.nnz); 
  var val = new Float32Array(memory.buffer, A_coo.val_index, A_coo.nnz); 

  var csr_row = new Int32Array(memory.buffer, A_csr.row_index, A_csr.nrows + 1); 
  var csr_col = new Int32Array(memory.buffer, A_csr.col_index, A_csr.nnz); 
  var csr_val = new Float32Array(memory.buffer, A_csr.val_index, A_csr.nnz); 
  csr_row.fill(0);
  csr_col.fill(0);
  csr_val.fill(0);
 
  var nz = A_csr.nnz; 
  var N = A_csr.nrows;

  var i;
  for(i = 0; i < nz; i++){
    csr_row[row[i]]++; 
  }

  var j = 0, j0 = 0;
  for(i = 0; i < N; i++){
    j0 = csr_row[i];
    csr_row[i] = j;
    j += j0;
  }

  for(i = 0; i < nz; i++){
    j = csr_row[row[i]];
    csr_col[j] = col[i];
    csr_val[j] = val[i];
    csr_row[row[i]]++;
  }

  for(i = N-1; i > 0; i--){
    csr_row[i] = csr_row[i-1]; 
  }
  csr_row[0] = 0;
  csr_row[N] = nz;
  for(i = 0; i < N; i++)
    sort(csr_row[i], csr_row[i+1], csr_col, csr_val); 
}

  

function get_inner_max()
{
  if(anz > 1000000) inner_max = 1;
  else if (anz > 100000) inner_max = 500;
  else if (anz > 50000) inner_max = 1000;
  else if(anz > 20000) inner_max = 5000;
  else if(anz > 5000) inner_max = 10000;
  else if(anz > 500) inner_max = 100000;
}

async function sswasm_init()
{
  var obj = await WebAssembly.instantiateStreaming(fetch('matmachjs.wasm'), Module);
  malloc_instance = obj.instance;
  obj = await WebAssembly.instantiateStreaming(fetch('spmv_simd_32.wasm'), { js: { mem: memory }, 
    console: { log: function(arg) {
      console.log(arg);}}
  });
  sparse_instance = obj.instance;
}

function coo_test(A_coo, x_view, y_view)
{
  console.log("COO");
  if(typeof A_coo === "undefined"){
    console.log("matrix is undefined");
    return;
  }
  if(typeof x_view === "undefined"){
    console.log("vector x is undefined");
    return;
  }
  if(typeof y_view === "undefined"){
    console.log("vector y is undefined");
    return;
  }
  var t1, t2, tt = 0.0;
  for(var i = 0; i < 10; i++){
    clear_y(y_view);
    sparse_instance.exports.spmv_coo_wrapper(A_coo.row_index, A_coo.col_index, A_coo.val_index, x_view.x_index, y_view.y_index, A_coo.nnz, inner_max);
  }
  for(var i = 0; i < outer_max; i++){
    clear_y(y_view);
    t1 = Date.now();
    sparse_instance.exports.spmv_coo_wrapper(A_coo.row_index, A_coo.col_index, A_coo.val_index, x_view.x_index, y_view.y_index, A_coo.nnz, inner_max);
    t2 = Date.now();
    coo_flops[i] = 1/Math.pow(10,6) * 2 * inner_max * A_coo.nnz/((t2 - t1)/1000);
    tt = tt + t2 - t1;
  }
  tt = tt/1000; 
  coo_mflops = 1/Math.pow(10,6) * 2 * A_coo.nnz * inner_max * outer_max/ tt;
  variance = 0;
  for(var i = 0; i < outer_max; i++)
    variance += (coo_mflops - coo_flops[i]) * (coo_mflops - coo_flops[i]);
  variance /= outer_max;
  coo_sd = Math.sqrt(variance);
  coo_sum = fletcher_sum_y(y_view);
  console.log('coo sum is ', coo_sum);
  console.log('coo sd is ', coo_sd);
}

function csr_test(A_csr, x_view, y_view)
{
  console.log("CSR");
  if(typeof A_csr === "undefined"){
    console.log("matrix is undefined");
    return;
  }
  if(typeof x_view === "undefined"){
    console.log("vector x is undefined");
    return;
  }
  if(typeof y_view === "undefined"){
    console.log("vector y is undefined");
    return;
  }
  var t1, t2, tt = 0.0;
  for(var i = 0; i < 10; i++){
    clear_y(y_view);
    sparse_instance.exports.spmv_csr_wrapper(A_csr.row_index, A_csr.col_index, A_csr.val_index, x_view.x_index, y_view.y_index, A_csr.nrows, inner_max);
  }
  for(var i = 0; i < outer_max; i++){
    clear_y(y_view);
    t1 = Date.now();
    sparse_instance.exports.spmv_csr_wrapper(A_csr.row_index, A_csr.col_index, A_csr.val_index, x_view.x_index, y_view.y_index, A_csr.nrows, inner_max);
    t2 = Date.now();
    csr_flops[i] = 1/Math.pow(10,6) * 2 * inner_max * A_csr.nnz/((t2 - t1)/1000);
    tt = tt + t2 - t1;
  }
  tt = tt/1000; 
  csr_mflops = 1/Math.pow(10,6) * 2 * A_csr.nnz * inner_max * outer_max/ tt;
  variance = 0;
  for(var i = 0; i < outer_max; i++)
    variance += (csr_mflops - csr_flops[i]) * (csr_mflops - csr_flops[i]);
  variance /= outer_max;
  csr_sd = Math.sqrt(variance);
  csr_sum = fletcher_sum_y(y_view);
  console.log('csr sum is ', csr_sum);
  console.log('csr sd is ', csr_sd);
}

function dia_test(A_dia, x_view, y_view)
{
  console.log("DIA");
  if(typeof A_dia === "undefined"){
    console.log("matrix is undefined");
    return;
  }
  if(typeof x_view === "undefined"){
    console.log("vector x is undefined");
    return;
  }
  if(typeof y_view === "undefined"){
    console.log("vector y is undefined");
    return;
  }
  if((A_dia.nrows * A_dia.ndiags)/A_dia.nnz > 12){
    console.log("too many elements in dia data array to compute spmv");
    return;
  }
  var t1, t2, tt = 0.0;
  for(var i = 0; i < 10; i++){
    clear_y(y_view);
    sparse_instance.exports.spmv_dia_wrapper(A_dia.offset_index, A_dia.data_index, A_dia.nrows, A_dia.ndiags, A_dia.stride, x_view.x_index, y_view.y_index, inner_max);
  }
  for(var i = 0; i < outer_max; i++){
    clear_y(y_view);
    t1 = Date.now();
    sparse_instance.exports.spmv_dia_wrapper(A_dia.offset_index, A_dia.data_index, A_dia.nrows, A_dia.ndiags, A_dia.stride, x_view.x_index, y_view.y_index, inner_max);
    t2 = Date.now();
    dia_flops[i] = 1/Math.pow(10,6) * 2 * inner_max * A_dia.nnz/((t2 - t1)/1000);
    tt = tt + t2 - t1;
  }
  tt = tt/1000; 
  dia_mflops = 1/Math.pow(10,6) * 2 * A_dia.nnz * inner_max * outer_max/ tt;
  variance = 0;
  for(var i = 0; i < outer_max; i++)
    variance += (dia_mflops - dia_flops[i]) * (dia_mflops - dia_flops[i]);
  variance /= outer_max;
  dia_sd = Math.sqrt(variance);
  dia_sum = fletcher_sum_y(y_view);
  console.log('dia sum is ', dia_sum);
  console.log('dia sd is ', dia_sd);
}

function ell_test(A_ell, x_view, y_view)
{
  console.log("ELL");
  if(typeof A_ell === "undefined"){
    console.log("matrix is undefined");
    return;
  }
  if(typeof x_view === "undefined"){
    console.log("vector x is undefined");
    return;
  }
  if(typeof y_view === "undefined"){
    console.log("vector y is undefined");
    return;
  }
  var t1, t2, tt = 0.0;
  for(var i = 0; i < 10; i++){
    clear_y(y_view);
    sparse_instance.exports.spmv_ell_wrapper(A_ell.indices_index, A_ell.data_index, A_ell.nrows, A_ell.ncols, x_view.x_index, y_view.y_index, inner_max);
  }
  for(var i = 0; i < outer_max; i++){
    clear_y(y_view);
    t1 = Date.now();
    sparse_instance.exports.spmv_ell_wrapper(A_ell.indices_index, A_ell.data_index, A_ell.nrows, A_ell.ncols, x_view.x_index, y_view.y_index, inner_max);
    t2 = Date.now();
    ell_flops[i] = 1/Math.pow(10,6) * 2 * inner_max * A_ell.nnz/((t2 - t1)/1000);
    tt = tt + t2 - t1;
  }
  tt = tt/1000; 
  ell_mflops = 1/Math.pow(10,6) * 2 * A_ell.nnz * inner_max * outer_max/ tt;
  variance = 0;
  for(var i = 0; i < outer_max; i++)
    variance += (ell_mflops - ell_flops[i]) * (ell_mflops - ell_flops[i]);
  variance /= outer_max;
  ell_sd = Math.sqrt(variance);
  ell_sum = fletcher_sum_y(y_view);
  console.log('ell sum is ', ell_sum);
  console.log('ell sd is ', ell_sd);
}

function read_MM_header(file, mm_info)
{
  /* read the first line for arithmetic field 
  e.g. real, integer, pattern etc.
  and symmetry structure e.g. general, 
  symmetric etc. */  
  var first = file[0].split(" ");
  mm_info.field = first[3];
  mm_info.symmetry = first[4];

  // skip over the comments
  var n = 0;
  while(file[n][0] == "%")
    n++;

  // read the entries info
  var info = file[n++].split(" ");
  mm_info.nrows = Number(info[0]);
  mm_info.ncols = Number(info[1]);
  mm_info.nentries = Number(info[2]);
  console.log(mm_info.nrows, mm_info.ncols, mm_info.nentries);
  return n;
}


function calculate_actual_nnz(file, index, start, mm_info)
{
  for(var j = start; index < file.length - 1; index++){
    var coord = file[index].split(" ");
    mm_info.row[j] = Number(coord[0]);
    mm_info.col[j] = Number(coord[1]);
    if(mm_info.symmetry == "symmetric"){
      if(mm_info.field != "pattern"){
        mm_info.val[j] = Number(coord[2]);
         // exclude explicit zero entries
        if(mm_info.val[j] < 0 || mm_info.val[j] > 0){
          // only one non-zero for each diagonal entry
          if(mm_info.row[j] == mm_info.col[j])
            mm_info.anz++; 
          // two non-zeros for each non-diagonal entry
          else
            mm_info.anz = mm_info.anz + 2;
        }
      }
      else{
        if(mm_info.row[j] == mm_info.col[j])
          mm_info.anz++; 
        else
          mm_info.anz = mm_info.anz + 2;
      } 
    }
    else{
      if(mm_info.field != "pattern"){
        mm_info.val[j] = Number(coord[2]);
         // exclude explicit zero entries
        if(mm_info.val[j] < 0 || mm_info.val[j] > 0)
          mm_info.anz++;
      }
    }
    j++;
  }
  return j;
}

function read_matrix_MM_files(files, num, mm_info, callback)
{ 
  var start = 0;
  mm_info.anz = 0;
  for(var i = 0; i < num; i++){
    var file = files[i];
    var index = 0;
    if(i == 0){
      index = read_MM_header(file, mm_info);
      if(mm_info.nentries > Math.pow(2,27)){
        console.log("entries : cannot allocate this much");
        callback();
      }
      mm_info.row = row = new Int32Array(mm_info.nentries);
      mm_info.col = col = new Int32Array(mm_info.nentries);
      if(mm_info.field != "pattern")
        mm_info.val = val = new Float64Array(mm_info.nentries);
    }
    start = calculate_actual_nnz(file, index, start, mm_info)
  }
  if(mm_info.anz == 0)
    anz = mm_info.nentries;
  else
    anz = mm_info.anz;
  console.log(anz);
  if(anz > Math.pow(2,28)){
    console.log("anz : cannot allocate this much");
    callback();
  }
}

function create_COO_from_MM(mm_info, A_coo)
{
  var coo_row = new Int32Array(memory.buffer, A_coo.row_index, A_coo.nnz); 
  var coo_col = new Int32Array(memory.buffer, A_coo.col_index, A_coo.nnz); 
  var coo_val = new Float32Array(memory.buffer, A_coo.val_index, A_coo.nnz); 

  var row = mm_info.row;
  var col = mm_info.col;
  var val = mm_info.val;

  if(mm_info.symmetry == "symmetric"){
    if(mm_info.field == "pattern"){
      for(var i = 0, n = 0; n < mm_info.nentries; n++) {
        coo_row[i] = Number(row[n] - 1);
        coo_col[i] = Number(col[n] - 1);
        coo_val[i] = 1.0;
        if(row[n] == col[n])
          i++;
        else{
          coo_row[i+1] = Number(col[n] - 1);
          coo_col[i+1] = Number(row[n] - 1);
          coo_val[i+1] = 1.0;
          i = i + 2;
        }
      } 
    }
    else{
      for(var i = 0, n = 0; n < mm_info.nentries; n++) {
        if(val[n] < 0 || val[n] > 0){
          coo_row[i] = Number(row[n] - 1);
          coo_col[i] = Number(col[n] - 1);
          if(!(Number.isSafeInteger(val[n])))
            val[n] = 0.0
          coo_val[i] = Number(val[n]);
          if(row[n] == col[n])
            i++;
          else{
            coo_row[i+1] = Number(col[n] - 1);
            coo_col[i+1] = Number(row[n] - 1);
            if(!(Number.isSafeInteger(val[n])))
              val[n] = 0.0
            coo_val[i+1] = Number(val[n]);
            i = i + 2;
          }
        }
      }
    }
  }
  else{
    if(mm_info.field == "pattern"){
      for(var i = 0, n = 0; n < mm_info.nentries; n++, i++) {
        coo_row[i] = Number(row[n] - 1);
        coo_col[i] = Number(col[n] - 1);
        coo_val[i] = 1.0;
      }
    }
    else{
      for(var i = 0, n = 0; n < mm_info.nentries; n++) {
        if(val[n] < 0 || val[n] > 0){
          coo_row[i] = Number(row[n] - 1);
          coo_col[i] = Number(col[n] - 1);
          if(!(Number.isSafeInteger(val[n])))
            val[n] = 0.0
          coo_val[i] = Number(val[n]);
          i++;
        }
      }
    }
  }
  quick_sort_COO(A_coo, 0, anz-1);      
}

function allocate_COO(mm_info)
{
  // COO memory allocation
  var coo_row_index = malloc_instance.exports._malloc(Int32Array.BYTES_PER_ELEMENT * anz);
  var coo_col_index = malloc_instance.exports._malloc(Int32Array.BYTES_PER_ELEMENT * anz);
  var coo_val_index = malloc_instance.exports._malloc(Float32Array.BYTES_PER_ELEMENT * anz);
  var A_coo = new sswasm_COO_t(coo_row_index, coo_col_index, coo_val_index, anz); 
  return A_coo;
}

function allocate_CSR(mm_info)
{
  // CSR memory allocation
  var csr_row_index = malloc_instance.exports._malloc(Int32Array.BYTES_PER_ELEMENT * (mm_info.nrows + 1));
  var csr_col_index = malloc_instance.exports._malloc(Int32Array.BYTES_PER_ELEMENT * anz);
  var csr_val_index = malloc_instance.exports._malloc(Float32Array.BYTES_PER_ELEMENT * anz);
  var A_csr = new sswasm_CSR_t(csr_row_index, csr_col_index, csr_val_index, mm_info.nrows, anz);
  return A_csr;
}


function allocate_DIA(mm_info, ndiags, stride)
{
  // DIA memory allocation
  var offset_index = malloc_instance.exports._malloc(Int32Array.BYTES_PER_ELEMENT * ndiags);
  var dia_data_index = malloc_instance.exports._malloc(Float32Array.BYTES_PER_ELEMENT * ndiags * stride);
  A_dia = new sswasm_DIA_t(offset_index, dia_data_index, ndiags, mm_info.nrows, stride, anz);
  return A_dia;
}

function allocate_ELL(mm_info, ncols)
{
  // ELL memory allocation
  var indices_index = malloc_instance.exports._malloc(Int32Array.BYTES_PER_ELEMENT * ncols * mm_info.nrows);
  var ell_data_index = malloc_instance.exports._malloc(Float32Array.BYTES_PER_ELEMENT * ncols * mm_info.nrows);
  A_ell = new sswasm_ELL_t(indices_index, ell_data_index, ncols, mm_info.nrows, anz);
  return A_ell;
}

function allocate_x(mm_info)
{
  var x_index = malloc_instance.exports._malloc(Float32Array.BYTES_PER_ELEMENT * mm_info.ncols);
  var x_view = new sswasm_x_t(x_index, mm_info.ncols);
  return x_view;
}

function allocate_y(mm_info)
{
  var y_index = malloc_instance.exports._malloc(Float32Array.BYTES_PER_ELEMENT * mm_info.nrows);
  var y_view = new sswasm_y_t(y_index, mm_info.nrows);
  return y_view;
}

/* Note: Since an ArrayBuffer’s byteLength is immutable, 
after a successful Memory.prototype.grow() operation the 
buffer getter will return a new ArrayBuffer object 
(with the new byteLength) and any previous ArrayBuffer 
objects become “detached”, or disconnected from the 
underlying memory they previously pointed to.*/ 
function allocate_memory_test(mm_info)
{
  const bytesPerPage = 64 * 1024;
  var max_pages = 16384;
  
  var A_coo = allocate_COO(mm_info);
  create_COO_from_MM(mm_info, A_coo); 

  var A_csr = allocate_CSR(mm_info);
  //convert COO to CSR
  coo_csr(A_coo, A_csr);

  //get DIA info
  var result = num_diags(A_csr);
  var nd = result[0];
  var stride = result[1];
  //get ELL info
  var nc = num_cols(A_csr);
  var A_dia, A_ell;
  
  console.log((stride * nd)/anz);

  if(nd*stride < Math.pow(2,27) && (((stride * nd)/anz) <= 12)){ 
    A_dia = allocate_DIA(mm_info, nd, stride);
    //convert CSR to DIA
    csr_dia(A_csr, A_dia);
  }

  if((nc*mm_info.nrows < Math.pow(2,27)) && (((mm_info.nrows * nc)/anz) <= 12)){
    A_ell = allocate_ELL(mm_info, nc);
    //convert CSR to ELL
    csr_ell(A_csr, A_ell);
  } 

  var x_view = allocate_x(mm_info);
  init_x(x_view);

  var y_view = allocate_y(mm_info);
  clear_y(y_view);

  return [A_coo, A_csr, A_dia, A_ell, x_view, y_view];
}

function free_memory_test(A_coo, A_csr, A_dia, A_ell, x_view, y_view)
{
  if(typeof A_coo !== 'undefined'){ 
    malloc_instance.exports._free(A_coo.row_index);
    malloc_instance.exports._free(A_coo.col_index);
    malloc_instance.exports._free(A_coo.col_index);
  }

  if(typeof A_csr !== 'undefined'){ 
    malloc_instance.exports._free(A_csr.row_index);
    malloc_instance.exports._free(A_csr.col_index);
    malloc_instance.exports._free(A_csr.col_index);
  }

  if(typeof A_dia !== 'undefined'){ 
    malloc_instance.exports._free(A_dia.offset_index);
    malloc_instance.exports._free(A_dia.data_index);
  }

  if(typeof A_ell !== 'undefined'){ 
    malloc_instance.exports._free(A_ell.indices_index);
    malloc_instance.exports._free(A_ell.data_index);
  }

  if(typeof x_view !== 'undefined')
    malloc_instance.exports._free(x_view.x_index);

  if(typeof y_view !== 'undefined')
    malloc_instance.exports._free(y_view.y_index);
}


function spmv_test(files, callback)
{
  var mm_info = new sswasm_MM_info();
  read_matrix_MM_files(files, num, mm_info, callback);
  N = mm_info.nrows;
  get_inner_max();

  var A_coo, A_csr, A_dia, A_ell, x_view, y_view;
  [A_coo, A_csr, A_dia, A_ell, x_view, y_view] = allocate_memory_test(mm_info);

  console.log(A_coo);

  coo_test(A_coo, x_view, y_view);
  csr_test(A_csr, x_view, y_view);
  dia_test(A_dia, x_view, y_view);
  ell_test(A_ell, x_view, y_view);
  free_memory_test(A_coo, A_csr, A_dia, A_ell, x_view, y_view);
  console.log("done");
  callback();
}

/* 
   Function to read the file
   Input : File object (https://developer.mozilla.org/en-US/docs/Web/API/File)
   Return : String containing the input file data 
*/
function parse_file(file)
{
  // 32MB blob size
  var limit = 32 * 1024 * 1024;
  var size = file.size;
  console.log(size);
  var num = Math.ceil(size/limit);
  console.log("num of blocks : ", num);
  var file_arr = [];

  function read_file_block(file, i){
    if(i >= num){
      var file_data = file_arr.join("");
      return file_data;
    }
    var start = i * limit;
    var end = ((i + 1)* limit) > file.size ? file.size : (i+1) * limit;
    console.log(start, end);
    var reader = new FileReader();
    reader.onloadend = function(evt) {
      if (evt.target.readyState == FileReader.DONE) { 
        file_arr.push(evt.target.result);
        read_file_block(file, i + 1);
      }
    };
    var blob = file.slice(start, end);
    reader.readAsText(blob);
  }

  read_file_block(file, 0);
}

var load_file = function(){
  return new Promise(function(resolve, reject) {
    var files = new Array(num);
    var load_files = function(fileno, files, num){
      var request = new XMLHttpRequest();
      var myname = filename + (Math.floor(fileno/10)).toString() + (fileno%10).toString() + '.mtx'
      console.log(myname);
      request.onreadystatechange = function() {
        console.log("state change " + myname, request.readyState, request.status);
        if(request.readyState == 4 && request.status == 200){
          try{
            files[fileno] = request.responseText.split("\n");
            fileno++;
            if(fileno < num)
              load_files(fileno, files, num);
            else{
              console.log("resolved");
              return resolve(files);
            }
          }
          catch(e){
            console.log('Error : ', e);
            reject(new Error(e));
          }
        }
      }
      request.open('GET', myname, true);
      request.send();
      console.log(myname + " request sent");
    }
    load_files(0, files, num);
  });
}

function spmv(callback)
{
  let promise = load_file();
  promise.then(
    files => spmv_test(files, callback),
    error => callback()
  );
}


