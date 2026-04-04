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
  var nama = document.getElementById('nama');
  if (nama) nama.addEventListener('input', toggleBeru);
}

function toggleBeru() {
  var val = document.getElementById('nama').value.toLowerCase();
  var isFemale = val.indexOf('beru ') === 0 || ['puteri','siti','rahma','nur','indah','maya','lina','wati','sari','ani','dewi'].some(function(h) { return val.indexOf(h) !== -1; });
  var group = document.getElementById('beruGroup');
  if (group) group.style.display = isFemale ? 'block' : 'none';
  if (!isFemale && document.getElementById('beru')) document.getElementById('beru').value = '';
}

function loadData() {
  fetch(CONFIG.SCRIPT_URL + '?action=getAll')
    .then(function(r) { return r.json(); })
    .then(function(json) {
      if (json.success) {
        allData = json.data;
        document.getElementById('totalKeluarga').textContent = allData.length;
        console.log('✅ Data:', allData.length);
      }
    })
    .catch(function() { console.log('⚠️ Offline'); });
}

function tambahAnak() {
  var container = document.getElementById('anakContainer');
  if (!container) return;
  var count = container.children.length + 1;
  var div = document.createElement('div');
  div.className = 'dynamic-item';
  // Gunakan string biasa ('...') agar aman
  div.innerHTML = '<input type="text" name="anak[]" placeholder="Anak ke-' + count + '">' +
                  '<button type="button" class="btn-remove" onclick="this.parentElement.remove()">×</button>';
  container.appendChild(div);
}

function tambahSenina() {
  var container = document.getElementById('seninaContainer');
  if (!container) return;
  var count = container.children.length + 1;
  var div = document.createElement('div');
  div.className = 'dynamic-item';
  div.innerHTML = '<input type="text" name="senina[]" placeholder="Senina ke-' + count + '">' +
                  '<button type="button" class="btn-remove" onclick="this.parentElement.remove()">×</button>';
  container.appendChild(div);
}
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

function collect(name) {
  var inputs = document.querySelectorAll('input[name="' + name + '"]');
  var arr = [];
  for (var i = 0; i < inputs.length; i++) {
    if (inputs[i].value.trim()) arr.push(inputs[i].value.trim());
  }
  return arr;
}

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

  fetch(CONFIG.SCRIPT_URL, { method: 'POST', body: fd, mode: 'no-cors' })
    .then(function() {
      alert('✅ Tersimpan!');
      document.getElementById('formInput').reset();
      fotoBase64 = null;
      updatePreview();
      ['anakContainer','seninaContainer'].forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.innerHTML = '';
      });
      toggleBeru();
      loadData();
    })
    .catch(function(err) {
      console.error(err);
      alert('⚠️ Gagal mengirim');
    })
    .finally(function() {
      btn.textContent = '💾 Simpan';
      btn.disabled = false;
    });
}

function cariKeluarga() {
  var kw = document.getElementById('searchInput').value.toLowerCase().trim();
  var res = document.getElementById('searchResults');
  if (!kw) { res.innerHTML = ''; return; }
  
  var f = allData.filter(function(d) {
    return (d.nama && d.nama.toLowerCase().indexOf(kw) !== -1) ||
           (d.marga && d.marga.toLowerCase().indexOf(kw) !== -1) ||
           (d.bapa && d.bapa.toLowerCase().indexOf(kw) !== -1);
  });
  
  if (f.length === 0) {
    res.innerHTML = '<div class="empty">🔍 Tidak ada hasil</div>';
    return;
  }
  
  var html = '';
  for (var i = 0; i < f.length; i++) {
    var d = f[i];
    html += '<div class="card"><b>' + (d.nama||'-') + '</b><br><small>' + (d.marga||'-') + '</small><br>👨 ' + (d.bapa||'-') + ' • 👩 ' + (d.nande||'-') + '</div>';
  }
  res.innerHTML = html;
}

function showPage(p) {
  document.querySelectorAll('.page').forEach(function(el) { el.classList.remove('active'); });
  var t = document.getElementById('page-' + p);
  if (t) t.classList.add('active');
}

function resetForm() {
  if (!confirm('Reset form?')) return;
  document.getElementById('formInput').reset();
  fotoBase64 = null;
  updatePreview();
  ['anakContainer','seninaContainer'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.innerHTML = '';
  });
  toggleBeru();
}

function showToast(msg) {
  var t = document.getElementById('toast');
  var m = document.getElementById('toastMsg');
  if (t && m) {
    m.textContent = msg;
    t.classList.add('show');
    setTimeout(function() { t.classList.remove('show'); }, 3000);
  }
}
