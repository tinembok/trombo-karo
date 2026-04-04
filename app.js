/**
 * TROMBO KARO - Aplikasi Silsilah Keluarga Karo
 * Versi Fixed & Stabil
 */

// ===== CONFIG & STATE =====
const CONFIG = {
  SCRIPT_URL: 'https://script.google.com/macros/s/AKfycby0IRYx_vtYKqJoo3dO69kdx_OR34qn8V4FqOi8MKNBgb3cWPtonYMtyKAWlWtmIdz1/exec',
  MARGA_KARO: ['ginting', 'karo-karo', 'perangin-angin', 'sembiring', 'tarigan']
};

let allData = [];
let fotoBase64 = null;
let anakCount = 0;      // ✅ DIPERBAIKI: Dideklarasikan di global
let saudaraCount = 0;   // ✅ DIPERBAIKI: Dideklarasikan di global

// ===== UTILITY FUNCTIONS =====
const cleanText = (txt) => txt ? txt.toString().trim() : '';
const cleanName = (str) => str ? str.toString().toLowerCase().trim() : '';

// ===== INIT =====
document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  setupEventListeners();
  updateStats();
  hideLoading();
});

function hideLoading() {
  const el = document.getElementById('loading');
  if (el) el.style.display = 'none';
}

function setupEventListeners() {
  const form = document.getElementById('formInput');
  if (form) form.addEventListener('submit', handleSubmit);
  
  const fotoInput = document.getElementById('fotoInput');
  if (fotoInput) fotoInput.addEventListener('change', handleFoto);
  
  setupBeruToggle();
}

// ===== DATA MANAGEMENT =====
async function loadData() {
  try {
    const res = await fetch(CONFIG.SCRIPT_URL + '?action=getAll');
    const json = await res.json();
    if (json.success) {
      allData = json.data.map(item => {
        const clean = {};
        for (let k in item) clean[k.toLowerCase()] = item[k];
        return clean;
      });
      console.log('✅ Data dimuat:', allData.length, 'record');
      updateSelectOptions();
      updateMargaCounts();
    }
  } catch (err) {
    console.error('❌ Gagal load ', err);
    showToast('⚠️ Mode offline');
  }
}

function updateSelectOptions() {
  const opts = allData.map(d => '<option value="' + d.nama + '">' + d.nama + ' (' + (d.marga || '-') + ')</option>').join('');
  ['namaAnda', 'namaCari'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = '<option value="">Pilih nama</option>' + opts;
  });
}

function updateMargaCounts() {
  CONFIG.MARGA_KARO.forEach(m => {
    const count = allData.filter(d => cleanName(d.marga) === cleanName(m)).length;
    const el = document.getElementById('count-' + cleanName(m));
    if (el) el.textContent = count;
  });
}

function updateStats() {
  const el = document.getElementById('totalKeluarga');
  if (el) el.textContent = allData.length;
}

// ===== FORM FUNCTIONS =====
function toggleBeruField(selector) {
  const input = document.querySelector(selector);
  if (!input) return;
  const nama = input.value.toLowerCase();
  const isFemale = nama.startsWith('beru ') || 
    ['beru','br.','puteri','siti','rahma','nur','indah','maya','lina','wati','sari','fitri','ani','dewi','putri'].some(h => nama.includes(h));
  const beruField = document.getElementById('beru');
  if (beruField) {
    beruField.closest('.form-group').style.display = isFemale ? 'block' : 'none';
    if (!isFemale) beruField.value = '';
  }
}

function setupBeruToggle() {
  const namaInput = document.getElementById('nama');
  if (namaInput) {
    namaInput.addEventListener('input', () => toggleBeruField('#nama'));
    toggleBeruField('#nama');
  }
  const ndeharaInput = document.getElementById('ndeharaNama');
  if (ndeharaInput) {
    ndeharaInput.addEventListener('input', () => {
      const beruNdehara = document.getElementById('beruNdehara');
      if (beruNdehara) {
        const isF = ndeharaInput.value.toLowerCase().startsWith('beru ');
        beruNdehara.closest('.form-group').style.display = isF ? 'block' : 'none';
        if (!isF) beruNdehara.value = '';
      }
    });
  }
}

// ✅ FIXED: HTML String tidak pakai backtick terpotong
function tambahDynamicField(type, containerId, autoMarga) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const count = container.children.length + 1;
  const placeholder = type + ' ke-' + count + (autoMarga ? ' (' + autoMarga + ')' : '');
  
  const div = document.createElement('div');
  div.className = 'dynamic-item';
  div.innerHTML = '<input type="text" name="' + type + '[]" placeholder="' + placeholder + '">' +
                  '<button type="button" class="btn-remove" onclick="hapusDynamicField(this)">×</button>';
  container.appendChild(div);
}

function hapusDynamicField(btn) { btn.parentElement.remove(); }

function tambahAnak() {
  const m = document.getElementById('marga')?.value || '';
  tambahDynamicField('anak', 'anakContainer', m);
}
function tambahSenina() {
  const m = document.getElementById('marga')?.value || '';
  tambahDynamicField('senina', 'seninaContainer', m);
}
function tambahSaudaraNdehara() {
  const m = document.getElementById('margaNdehara')?.value || '';
  tambahDynamicField('saudaraNdehara', 'saudaraNdeharaContainer', m);
}

function resetForm() {
  if (!confirm('Reset semua data form?')) return;
  document.getElementById('formInput')?.reset();
  fotoBase64 = null;
  updatePhotoPreview();
  ['anakContainer', 'seninaContainer', 'saudaraNdeharaContainer'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = '';
  });
  toggleBeruField('#nama');
  showToast('🔄 Form di-reset');
}

function handleFoto(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => { fotoBase64 = ev.target.result; updatePhotoPreview(); };
  reader.readAsDataURL(file);
}

function updatePhotoPreview() {
  const preview = document.getElementById('photoPreview');
  if (!preview) return;
  if (fotoBase64) {
    preview.innerHTML = '<img src="' + fotoBase64 + '" alt="Foto">';
    preview.classList.add('has-image');
    const btn = document.getElementById('btnHapusFoto');
    if (btn) btn.style.display = 'flex';
  } else {
    preview.innerHTML = '<span class="photo-icon">📷</span><small>Klik untuk foto</small>';
    preview.classList.remove('has-image');
    const btn = document.getElementById('btnHapusFoto');
    if (btn) btn.style.display = 'none';
  }
}

function hapusFoto() {
  fotoBase64 = null;
  const inp = document.getElementById('fotoInput');
  if (inp) inp.value = '';
  updatePhotoPreview();
}

// Submit Form
async function handleSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById('btnSubmit');
  if (!btn) return;
  
  const collect = (selector) => Array.from(document.querySelectorAll(selector)).map(i => i.value.trim()).filter(v => v);
  
  const data = {
    nama: document.getElementById('nama')?.value.trim(),
    marga: document.getElementById('marga')?.value.trim(),
    bapa: document.getElementById('bapa')?.value.trim(),
    nande: document.getElementById('nande')?.value.trim(),
    beru: document.getElementById('beru')?.value.trim(),
    senina: collect('input[name="senina[]"]'),
    ndeharaNama: document.getElementById('ndeharaNama')?.value.trim(),
    margaNdehara: document.getElementById('margaNdehara')?.value.trim(),
    bapaNdehara: document.getElementById('bapaNdehara')?.value.trim(),
    nandeNdehara: document.getElementById('nandeNdehara')?.value.trim(),
    beruNdehara: document.getElementById('beruNdehara')?.value.trim(),
    saudaraNdehara: collect('input[name="saudaraNdehara[]"]'),
    anak: collect('input[name="anak[]"]'),
    alamat: document.getElementById('alamat')?.value.trim(),
    nowa: document.getElementById('nowa')?.value.trim(),
    foto: fotoBase64,
    timestamp: new Date().toISOString()
  };

  if (!data.nama || !data.marga || !data.bapa || !data.nande) {
    showToast('❌ Nama, Marga, Bapa, dan Nande wajib diisi');
    return;
  }

  btn.innerHTML = '⏳ Menyimpan...';
  btn.disabled = true;
  try {
    await saveData(data);
  } catch (err) {
    console.error('Save error:', err);
    showToast('❌ Gagal menyimpan');
  } finally {
    btn.innerHTML = '💾 Simpan';
    btn.disabled = false;
  }
}

async function saveData(data) {
  showToast('📤 Mengirim data...');
  const formData = new URLSearchParams();
  formData.append('action', 'save');
  formData.append('data', JSON.stringify(data));

  await fetch(CONFIG.SCRIPT_URL, { method: 'POST', body: formData, mode: 'no-cors' });
  
  showToast('✅ Data tersimpan!');
  resetForm();
  await loadData();
}

// ===== SEARCH & HUBUNGAN =====
function cariKeluarga() {
  const kw = document.getElementById('searchInput')?.value.toLowerCase().trim();
  const resDiv = document.getElementById('searchResults');
  if (!kw || !resDiv) return;
  
  const filtered = allData.filter(d => 
    (d.nama && d.nama.toLowerCase().includes(kw)) ||
    (d.marga && d.marga.toLowerCase().includes(kw)) ||
    (d.bapa && d.bapa.toLowerCase().includes(kw))
  );
  
  if (filtered.length === 0) {
    resDiv.innerHTML = '<div class="empty-state">🔍 Tidak ada hasil</div>';
    return;
  }
  
  resDiv.innerHTML = filtered.map(d => 
    '<div class="result-card">' +
    '<div class="result-info">' +
      '<div class="result-name">' + (d.nama || '-') + '</div>' +
      '<span class="result-marga">' + (d.marga || '-') + '</span>' +
      '<div class="result-detail">👨 ' + (d.bapa || '-') + ' • 👩 ' + (d.nande || '-') + '</div>' +
    '</div></div>'
  ).join('');
  
  const c = document.getElementById('resultCount');
  if (c) c.textContent = filtered.length + ' hasil';
}

function handleSearchInput(e) { if (e && e.key === 'Enter') cariKeluarga(); }
function filterByMarga(m) { const i = document.getElementById('searchInput'); if(i) i.value = m; showPage('cari'); cariKeluarga(); }

function cekHubungan() {
  const a = document.getElementById('namaAnda')?.value;
  const b = document.getElementById('namaCari')?.value;
  if (!a || !b) return showToast('⚠️ Pilih kedua nama');
  const dA = allData.find(d => d.nama === a);
  const dB = allData.find(d => d.nama === b);
  if (!dA || !dB) return showToast('❌ Data tidak ditemukan');
  
  const hasil = hitungHubungan(dA, dB);
  const resDiv = document.getElementById('hasilHubungan');
  if (resDiv) {
    resDiv.innerHTML = '<div class="result-card relationship-result">' +
      '<div class="result-header"><span class="result-icon">🤝</span><h3>' + hasil.jenis + '</h3></div>' +
      '<p class="result-desc">' + hasil.deskripsi + '</p>' +
      (hasil.jenis.includes('Rebu') ? '<div class="rebu-warning">⚠️ Konsultasi tetua adat</div>' : '') +
    '</div>';
    resDiv.style.display = 'block';
  }
}

function hitungHubungan(a, b) {
  const clean = n => n ? n.toLowerCase().trim() : '';
  const fA = clean(a.bapa), fB = clean(b.bapa);
  const mA = clean(a.nande), mB = clean(b.nande);
  const pA = clean(a.nama), pB = clean(b.nama);
  
  if (pA === pB) return { jenis: 'Diri Sendiri', deskripsi: 'Anda membandingkan dengan diri sendiri' };
  if (fB === pA) return { jenis: 'Bapa', deskripsi: 'Anda adalah Ayah dari ' + b.nama };
  if (fA === pB) return { jenis: 'Anak', deskripsi: b.nama + ' adalah Anak Anda' };
  if (fA && fA === fB) return { jenis: 'Senina', deskripsi: 'Saudara semarga (satu ayah)' };
  
  // Impal check sederhana
  if ((mA && fB && clean(allData.find(d=>cleanName(d.nama)===mA)?.bapa) === clean(allData.find(d=>cleanName(d.nama)===fB)?.bapa)) ||
      (fA && mB && clean(allData.find(d=>cleanName(d.nama)===fA)?.bapa) === clean(allData.find(d=>cleanName(d.nama)===mB)?.bapa))) {
    return { jenis: 'Impal', deskripsi: 'Sepupu silang - calon pasangan ideal dalam adat' };
  }
  if (a.marga && b.marga && clean(a.marga) === clean(b.marga) && fA !== fB) {
    return { jenis: '⚠️ Sedonga (Rebu)', deskripsi: 'Satu marga beda ayah - dilarang menikah' };
  }
  return { jenis: 'Tutur Siwaluh', deskripsi: 'Hubungan umum, perlu penelusuran lanjut' };
}

// ===== UI HELPERS =====
function showPage(p) {
  document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
  const t = document.getElementById('page-' + p);
  if (t) t.classList.add('active');
  if (p === 'cari' && document.getElementById('searchResults')) document.getElementById('searchResults').innerHTML = '';
  if (p === 'hubungan') updateSelectOptions();
}
function showToast(msg) {
  const t = document.getElementById('toast');
  const m = document.getElementById('toastMessage');
  if (t && m) { m.textContent = msg; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 3000); }
  else alert(msg);
}
function toggleMenu() { const m = document.getElementById('mobileMenu'); if(m) m.classList.toggle('show'); }
