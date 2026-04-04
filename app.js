/* TROMBO KARO - app.js MINIMAL (NO SYNTAX ERRORS) */
var CONFIG = {
  SCRIPT_URL: 'https://script.google.com/macros/s/AKfycby0IRYx_vtYKqJoo3dO69kdx_OR34qn8V4FqOi8MKNBgb3cWPtonYMtyKAWlWtmIdz1/exec'
};

var allData = [];
var fotoBase64 = null;

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

function loadData() {
  fetch(CONFIG.SCRIPT_URL + '?action=getAll')
    .then(function(res) { return res.json(); })
    .then(function(json) {
      if (json && json.success) {
        allData = json.data || [];
        console.log('✅ Data dimuat:', allData.length);
        updateStats();
      }
    })
    .catch(function(e) { console.log('⚠️ Offline:', e); });
}

function updateStats() {
  var el = document.getElementById('totalKeluarga');
  if (el) el.textContent = allData.length;
}

/* ===== DYNAMIC FIELDS - SIMPLE STRING CONCAT ===== */
function tambahAnak() {
  var c = document.getElementById('anakContainer');
  if (!c) return;
  var n = c.children.length + 1;
  var d = document.createElement('div');
  d.className = 'dyn';
  d.innerHTML = '<input type="text" name="anak[]" placeholder="Anak ke-' + n + '">' +
                '<button type="button" onclick="this.parentElement.remove()">×</button>';
  c.appendChild(d);
}

function tambahSenina() {
  var c = document.getElementById('seninaContainer');
  if (!c) return;
  var n = c.children.length + 1;
  var d = document.createElement('div');
  d.className = 'dyn';
  d.innerHTML = '<input type="text" name="senina[]" placeholder="Senina ke-' + n + '">' +
                '<button type="button" onclick="this.parentElement.remove()">×</button>';
  c.appendChild(d);
}

/* ===== FOTO ===== */
function handleFoto(e) {
  var f = e.target.files[0];
  if (!f) return;
  var r = new FileReader();
  r.onload = function(ev) { fotoBase64 = ev.target.result; updatePreview(); };
  r.readAsDataURL(f);
}

function updatePreview() {
  var p = document.getElementById('photoPreview');
  if (!p) return;
  if (fotoBase64) {
    p.innerHTML = '<img src="' + fotoBase64 + '" style="width:100%;height:100%;object-fit:cover">';
    p.classList.add('has-img');
  } else {
    p.innerHTML = '<span>📷</span><small>Klik untuk foto</small>';
    p.classList.remove('has-img');
  }
}

/* ===== COLLECT INPUTS ===== */
function collect(name) {
  var inputs = document.querySelectorAll('input[name="' + name + '"]');
  var arr = [];
  for (var i = 0; i < inputs.length; i++) {
    if (inputs[i].value.trim()) arr.push(inputs[i].value.trim());
  }
  return arr;
}

/* ===== SUBMIT FORM ===== */
function handleSubmit(e) {
  e.preventDefault();
  var btn = document.getElementById('btnSubmit');
  if (!btn) return;

  var data = {
    nama: document.getElementById('nama').value.trim(),
    marga: document.getElementById('marga').value.trim(),
    bapa: document.getElementById('bapa').value.trim(),
    nande: document.getElementById('nande').value.trim(),
    beru: document.getElementById('beru').value.trim(),
    senina: collect('senina[]'),
    ndeharaNama: document.getElementById('ndeharaNama').value.trim(),
    margaNdehara: document.getElementById('margaNdehara').value.trim(),
    anak: collect('anak[]'),
    alamat: document.getElementById('alamat').value.trim(),
    nowa: document.getElementById('nowa').value.trim(),
    foto: fotoBase64,
    timestamp: new Date().toISOString()
  };

  if (!data.nama || !data.marga || !data.bapa || !data.nande) {
    alert('Nama, Marga, Bapa, Nande wajib diisi');
    return;
  }

  btn.textContent = '⏳...';
  btn.disabled = true;

  var fd = new URLSearchParams();
  fd.append('action', 'save');
  fd.append('data', JSON.stringify(data));

  fetch(CONFIG.SCRIPT_URL, { method: 'POST', body: fd })
    .then(function() {
      alert('✅ Tersimpan!');
      document.getElementById('formInput').reset();
      fotoBase64 = null;
      updatePreview();
      ['anakContainer','seninaContainer'].forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.innerHTML = '';
      });
      loadData();
    })
    .catch(function(err) {
      console.error(err);
      alert('❌ Gagal: ' + err.message);
    })
    .finally(function() {
      btn.textContent = '💾 Simpan';
      btn.disabled = false;
    });
}

/* ===== SEARCH ===== */
function cariKeluarga() {
  var kw = document.getElementById('searchInput').value.toLowerCase().trim();
  var res = document.getElementById('searchResults');
  if (!kw) { res.innerHTML = ''; return; }
  
  var f = [];
  for (var i = 0; i < allData.length; i++) {
    var d = allData[i];
    if ((d.nama && d.nama.toLowerCase().indexOf(kw) !== -1) ||
        (d.marga && d.marga.toLowerCase().indexOf(kw) !== -1)) {
      f.push(d);
    }
  }
  
  if (f.length === 0) {
    res.innerHTML = '<div class="empty">🔍 Tidak ada hasil</div>';
    return;
  }
  
  var html = '';
  for (var j = 0; j < f.length; j++) {
    var d = f[j];
    html += '<div class="card"><b>' + (d.nama||'-') + '</b><br><small>' + (d.marga||'-') + '</small></div>';
  }
  res.innerHTML = html;
}

/* ===== NAV ===== */
function showPage(p) {
  document.querySelectorAll('.page').forEach(function(el) { el.classList.remove('active'); });
  var t = document.getElementById('page-' + p);
  if (t) t.classList.add('active');
}
