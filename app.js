/**
 * TROMBO KARO - app.js MINIMAL & STABIL
 * Tanpa template literal, tanpa syntax rumit
 */
var CONFIG = {
  SCRIPT_URL: 'https://script.google.com/macros/s/AKfycby0IRYx_vtYKqJoo3dO69kdx_OR34qn8V4FqOi8MKNBgb3cWPtonYMtyKAWlWtmIdz1/exec'
};

var allData = [];
var fotoBase64 = null;

// ===== INIT =====
document.addEventListener('DOMContentLoaded', function() {
  loadData();
  setupEvents();
  hideLoading();
});

function hideLoading() {
  var el = document.getElementById('loading');
  if (el) el.style.display = 'none';
}

function setupEvents() {
  var form = document.getElementById('formInput');
  if (form) form.addEventListener('submit', handleSubmit);
  var foto = document.getElementById('fotoInput');
  if (foto) foto.addEventListener('change', handleFoto);
}

// ===== LOAD DATA =====
function loadData() {
  fetch(CONFIG.SCRIPT_URL + '?action=getAll')
    .then(function(res) { return res.json(); })
    .then(function(json) {
      if (json.success) {
        allData = json.data;
        console.log('✅ Data dimuat:', allData.length);
        updateStats();
        updateSelectOptions();
      }
    })
    .catch(function(e) {
      console.log('⚠️ Offline mode');
    });
}

function updateStats() {
  var el = document.getElementById('totalKeluarga');
  if (el) el.textContent = allData.length;
}

function updateSelectOptions() {
  var opts = '';
  for (var i = 0; i < allData.length; i++) {
    var d = allData[i];
    opts += '<option value="' + d.nama + '">' + d.nama + ' (' + (d.marga || '-') + ')</option>';
  }
  var ids = ['namaAnda', 'namaCari'];
  for (var j = 0; j < ids.length; j++) {
    var el = document.getElementById(ids[j]);
    if (el) el.innerHTML = '<option value="">Pilih nama</option>' + opts;
  }
}

// ===== FORM: TAMBAH INPUT (SIMPLE) =====
function tambahAnak() {
  var container = document.getElementById('anakContainer');
  if (!container) return;
  var count = container.children.length + 1;
  var div = document.createElement('div');
  div.className = 'dynamic-item';
  div.innerHTML = '<input type="text" name="anak[]" placeholder="Nama anak ke-' + count + '">' +
                  '<button type="button" class="btn-remove" onclick="this.parentElement.remove()">×</button>';
  container.appendChild(div);
}

function tambahSenina() {
  var container = document.getElementById('seninaContainer');
  if (!container) return;
  var count = container.children.length + 1;
  var div = document.createElement('div');
  div.className = 'dynamic-item';
  div.innerHTML = '<input type="text" name="senina[]" placeholder="Nama senina ke-' + count + '">' +
                  '<button type="button" class="btn-remove" onclick="this.parentElement.remove()">×</button>';
  container.appendChild(div);
}

function tambahSaudaraNdehara() {
  var container = document.getElementById('saudaraNdeharaContainer');
  if (!container) return;
  var count = container.children.length + 1;
  var div = document.createElement('div');
  div.className = 'dynamic-item';
  div.innerHTML = '<input type="text" name="saudaraNdehara[]" placeholder="Nama ke-' + count + '">' +
                  '<button type="button" class="btn-remove" onclick="this.parentElement.remove()">×</button>';
  container.appendChild(div);
}

// ===== FOTO =====
function handleFoto(e) {
  var file = e.target.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(ev) {
    fotoBase64 = ev.target.result;
    updatePhotoPreview();
  };
  reader.readAsDataURL(file);
}

function updatePhotoPreview() {
  var p = document.getElementById('photoPreview');
  if (!p) return;
  if (fotoBase64) {
    p.innerHTML = '<img src="' + fotoBase64 + '" style="width:100%;height:100%;object-fit:cover">';
    p.classList.add('has-image');
    var btn = document.getElementById('btnHapusFoto');
    if (btn) btn.style.display = 'flex';
  } else {
    p.innerHTML = '<span>📷</span><small>Klik untuk foto</small>';
    p.classList.remove('has-image');
    var btn = document.getElementById('btnHapusFoto');
    if (btn) btn.style.display = 'none';
  }
}

function hapusFoto() {
  fotoBase64 = null;
  var inp = document.getElementById('fotoInput');
  if (inp) inp.value = '';
  updatePhotoPreview();
}

// ===== SUBMIT FORM =====
function handleSubmit(e) {
  e.preventDefault();
  var btn = document.getElementById('btnSubmit');
  if (!btn) return;

  // Collect array inputs
  function collect(name) {
    var inputs = document.querySelectorAll('input[name="' + name + '"]');
    var arr = [];
    for (var i = 0; i < inputs.length; i++) {
      if (inputs[i].value.trim()) arr.push(inputs[i].value.trim());
    }
    return arr;
  }

  var data = {
    nama: document.getElementById('nama').value.trim(),
    marga: document.getElementById('marga').value.trim(),
    bapa: document.getElementById('bapa').value.trim(),
    nande: document.getElementById('nande').value.trim(),
    beru: document.getElementById('beru').value.trim(),
    senina: collect('senina[]'),
    ndeharaNama: document.getElementById('ndeharaNama').value.trim(),
    margaNdehara: document.getElementById('margaNdehara').value.trim(),
    bapaNdehara: document.getElementById('bapaNdehara').value.trim(),
    nandeNdehara: document.getElementById('nandeNdehara').value.trim(),
    beruNdehara: document.getElementById('beruNdehara').value.trim(),
    saudaraNdehara: collect('saudaraNdehara[]'),
    anak: collect('anak[]'),
    alamat: document.getElementById('alamat').value.trim(),
    nowa: document.getElementById('nowa').value.trim(),
    foto: fotoBase64,
    timestamp: new Date().toISOString()
  };

  if (!data.nama || !data.marga || !data.bapa || !data.nande) {
    alert('Nama, Marga, Bapa, dan Nande wajib diisi');
    return;
  }

  btn.innerHTML = '⏳...';
  btn.disabled = true;

  var fd = new URLSearchParams();
  fd.append('action', 'save');
  fd.append('data', JSON.stringify(data));

  fetch(CONFIG.SCRIPT_URL, { method: 'POST', body: fd, mode: 'no-cors' })
    .then(function() {
      alert('✅ Data tersimpan!');
      document.getElementById('formInput').reset();
      fotoBase64 = null;
      updatePhotoPreview();
      ['anakContainer','seninaContainer','saudaraNdeharaContainer'].forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.innerHTML = '';
      });
      loadData();
    })
    .catch(function(err) {
      console.error(err);
      alert('⚠️ Cek koneksi');
    })
    .finally(function() {
      btn.innerHTML = '💾 Simpan';
      btn.disabled = false;
    });
}

// ===== SEARCH =====
function cariKeluarga() {
  var kw = document.getElementById('searchInput').value.toLowerCase().trim();
  var res = document.getElementById('searchResults');
  if (!kw || !res) return;
  
  var filtered = [];
  for (var i = 0; i < allData.length; i++) {
    var d = allData[i];
    if ((d.nama && d.nama.toLowerCase().includes(kw)) ||
        (d.marga && d.marga.toLowerCase().includes(kw)) ||
        (d.bapa && d.bapa.toLowerCase().includes(kw))) {
      filtered.push(d);
    }
  }
  
  if (filtered.length === 0) {
    res.innerHTML = '<div class="empty-state">🔍 Tidak ada hasil</div>';
    return;
  }
  
  var html = '';
  for (var j = 0; j < filtered.length; j++) {
    var d = filtered[j];
    html += '<div class="result-card">' +
      '<div class="result-info">' +
        '<div class="result-name">' + (d.nama || '-') + '</div>' +
        '<span class="result-marga">' + (d.marga || '-') + '</span>' +
        '<div class="result-detail">👨 ' + (d.bapa || '-') + ' • 👩 ' + (d.nande || '-') + '</div>' +
      '</div></div>';
  }
  res.innerHTML = html;
}

function handleSearchInput(e) { if (e && e.key === 'Enter') cariKeluarga(); }
function filterByMarga(m) { var i = document.getElementById('searchInput'); if(i) i.value = m; showPage('cari'); cariKeluarga(); }

// ===== NAVIGASI =====
function showPage(p) {
  var pages = document.querySelectorAll('.page');
  for (var i = 0; i < pages.length; i++) pages[i].classList.remove('active');
  var t = document.getElementById('page-' + p);
  if (t) t.classList.add('active');
  if (p === 'cari' && document.getElementById('searchResults')) {
    document.getElementById('searchResults').innerHTML = '';
  }
}

function showToast(msg) {
  var t = document.getElementById('toast');
  var m = document.getElementById('toastMessage');
  if (t && m) {
    m.textContent = msg;
    t.classList.add('show');
    setTimeout(function() { t.classList.remove('show'); }, 3000);
  } else {
    alert(msg);
  }
}

function toggleMenu() {
  var m = document.getElementById('mobileMenu');
  if (m) m.classList.toggle('show');
}
