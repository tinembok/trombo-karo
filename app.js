/* TROMBO KARO - Frontend Minimal */
var CONFIG = {
  SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbwSKqkSjM7Ea4p0CVGXW5IC1QZj7MTwGRZ5ibFz-TzMRd_OVEdaeb3nWkB0aDPIOlFI/exec'
};

var fotoBase64 = null;

document.addEventListener('DOMContentLoaded', function() {
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

/* ===== TAMBAH INPUT DINAMIS (Simple String Concat) ===== */
function tambahAnak() {
  var c = document.getElementById('anakContainer');
  if (!c) return;
  var n = c.children.length + 1;
  var d = document.createElement('div');
  d.style.marginBottom = '8px';
  d.innerHTML = '<input type="text" name="anak[]" placeholder="Nama anak ' + n + '" style="width:100%;padding:8px;margin-right:8px">' +
                '<button type="button" onclick="this.parentElement.remove()" style="background:#8B0000;color:white;border:none;width:32px;height:32px;border-radius:50%;cursor:pointer">x</button>';
  c.appendChild(d);
}

function tambahSenina() {
  var c = document.getElementById('seninaContainer');
  if (!c) return;
  var n = c.children.length + 1;
  var d = document.createElement('div');
  d.style.marginBottom = '8px';
  d.innerHTML = '<input type="text" name="senina[]" placeholder="Nama senina ' + n + '" style="width:100%;padding:8px;margin-right:8px">' +
                '<button type="button" onclick="this.parentElement.remove()" style="background:#8B0000;color:white;border:none;width:32px;height:32px;border-radius:50%;cursor:pointer">x</button>';
  c.appendChild(d);
}

/* ===== FOTO ===== */
function handleFoto(e) {
  var f = e.target.files[0];
  if (!f) return;
  var r = new FileReader();
  r.onload = function(ev) {
    fotoBase64 = ev.target.result;
    var p = document.getElementById('photoPreview');
    if (p) {
      p.innerHTML = '<img src="' + fotoBase64 + '" style="width:100%;height:100%;object-fit:cover;border-radius:8px">';
    }
  };
  r.readAsDataURL(f);
}

/* ===== COLLECT ARRAY INPUTS ===== */
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
    foto: fotoBase64
  };

  if (!data.nama || !data.marga || !data.bapa || !data.nande) {
    alert('Nama, Marga, Bapa, dan Nande wajib diisi');
    return;
  }

  btn.textContent = 'Menyimpan...';
  btn.disabled = true;

  var fd = new URLSearchParams();
  fd.append('action', 'save');
  fd.append('data', JSON.stringify(data));

  fetch(CONFIG.SCRIPT_URL, { method: 'POST', body: fd })
    .then(function() {
      alert('✅ Data tersimpan!');
      document.getElementById('formInput').reset();
      fotoBase64 = null;
      var p = document.getElementById('photoPreview');
      if (p) p.innerHTML = '<span style="font-size:32px">📷</span><br><small>Klik untuk foto</small>';
      ['anakContainer','seninaContainer'].forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.innerHTML = '';
      });
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
