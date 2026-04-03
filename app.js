/**
 * TROMBO KARO - Frontend (app.js)
 * Versi Final: Syntax Fixed + Form Mapping Benar
 */
const CONFIG = {
  SCRIPT_URL: 'https://script.google.com/macros/s/AKfycby0IRYx_vtYKqJoo3dO69kdx_OR34qn8V4FqOi8MKNBgb3cWPtonYMtyKAWlWtmIdz1/exec',
  MARGA_KARO: ['ginting', 'karo-karo', 'perangin-angin', 'sembiring', 'tarigan']
};

let allData = [];
let fotoBase64 = null;

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
  } catch (err) { console.error('❌ Gagal load:', err); showToast('⚠️ Mode offline'); }
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
    const count = allData.filter(d => (d.marga||'').toLowerCase().replace(/[- ]/g,'') === m.toLowerCase().replace(/[- ]/g,'')).length;
    const el = document.getElementById('count-' + m.toLowerCase().replace(/[- ]/g,''));
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
  const n = document.getElementById('nama');
  if (n) { n.addEventListener('input', () => toggleBeruField('#nama')); toggleBeruField('#nama'); }
  const nd = document.getElementById('ndeharaNama');
  if (nd) {
    nd.addEventListener('input', () => {
      const bN = document.getElementById('beruNdehara');
      if (bN) {
        const isF = nd.value.toLowerCase().startsWith('beru ');
        bN.closest('.form-group').style.display = isF ? 'block' : 'none';
        if (!isF) bN.value = '';
      }
    });
  }
}

// ✅ FIXED: HTML string aman tanpa backtick terpotong
function tambahDynamicField(type, containerId, autoMarga) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const count = container.children.length + 1;
  const placeholder = type + ' ke-' + count + (autoMarga ? ' (' + autoMarga + ')' : '');
  
  const div = document.createElement('div');
  div.className = 'dynamic-item';
  div.innerHTML = '<input type="text" name="' + type + '[]" placeholder="' + placeholder + '">' +
                  '<button type="button" class="btn-remove" onclick="this.parentElement.remove()">×</button>';
  container.appendChild(div);
}

function tambahAnak() { tambahDynamicField('anak', 'anakContainer', document.getElementById('marga')?.value); }
function tambahSenina() { tambahDynamicField('senina', 'seninaContainer', document.getElementById('marga')?.value); }
function tambahSaudaraNdehara() { tambahDynamicField('saudaraNdehara', 'saudaraNdeharaContainer', document.getElementById('margaNdehara')?.value); }

function resetForm() {
  if (!confirm('Reset form?')) return;
  document.getElementById('formInput')?.reset();
  fotoBase64 = null; updatePhotoPreview();
  ['anakContainer','seninaContainer','saudaraNdeharaContainer'].forEach(id => {
    const el = document.getElementById(id); if(el) el.innerHTML = '';
  });
  toggleBeruField('#nama'); showToast('🔄 Form di-reset');
}

function handleFoto(e) {
  const file = e.target.files[0]; if (!file) return;
  const r = new FileReader();
  r.onload = ev => { fotoBase64 = ev.target.result; updatePhotoPreview(); };
  r.readAsDataURL(file);
}

function updatePhotoPreview() {
  const p = document.getElementById('photoPreview'); if (!p) return;
  if (fotoBase64) {
    p.innerHTML = '<img src="' + fotoBase64 + '" alt="Foto">'; p.classList.add('has-image');
    const b = document.getElementById('btnHapusFoto'); if (b) b.style.display = 'flex';
  } else {
    p.innerHTML = '<span class="photo-icon">📷</span><small>Klik untuk foto</small>'; p.classList.remove('has-image');
    const b = document.getElementById('btnHapusFoto'); if (b) b.style.display = 'none';
  }
}

async function handleSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById('btnSubmit');
  if (!btn) return;
  
  const collect = sel => Array.from(document.querySelectorAll(sel)).map(i => i.value.trim()).filter(v => v);
  
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
    return showToast('❌ Nama, Marga, Bapa, dan Nande wajib diisi');
  }

  btn.innerHTML = '⏳ Menyimpan...'; btn.disabled = true;
  try {
    await saveData(data);
  } catch (err) { showToast('❌ Gagal menyimpan'); } 
  finally { btn.innerHTML = '💾 Simpan'; btn.disabled = false; }
}

async function saveData(data) {
  showToast('📤 Mengirim...');
  const fd = new URLSearchParams();
  fd.append('action', 'save'); fd.append('data', JSON.stringify(data));
  await fetch(CONFIG.SCRIPT_URL, { method: 'POST', body: fd, mode: 'no-cors' });
  showToast('✅ Data tersimpan!'); resetForm(); await loadData();
}

// ===== SEARCH & HUBUNGAN =====
function cariKeluarga() {
  const kw = document.getElementById('searchInput')?.value.toLowerCase().trim();
  const res = document.getElementById('searchResults');
  if (!kw || !res) return;
  const f = allData.filter(d => (d.nama||'').includes(kw) || (d.marga||'').includes(kw) || (d.bapa||'').includes(kw));
  if (f.length === 0) { res.innerHTML = '<div class="empty-state">🔍 Tidak ada hasil</div>'; return; }
  res.innerHTML = f.map(d => '<div class="result-card"><div class="result-info"><div class="result-name">'+(d.nama||'-')+'</div><span class="result-marga">'+(d.marga||'-')+'</span><div class="result-detail">👨 '+(d.bapa||'-')+' • 👩 '+(d.nande||'-')+'</div></div></div>').join('');
}

function handleSearchInput(e) { if (e?.key === 'Enter') cariKeluarga(); }
function filterByMarga(m) { const i = document.getElementById('searchInput'); if(i) i.value = m; showPage('cari'); cariKeluarga(); }

function cekHubungan() {
  const a = document.getElementById('namaAnda')?.value;
  const b = document.getElementById('namaCari')?.value;
  if (!a || !b) return showToast('⚠️ Pilih kedua nama');
  const dA = allData.find(d => d.nama === a);
  const dB = allData.find(d => d.nama === b);
  if (!dA || !dB) return showToast('❌ Data tidak ditemukan');
  
  const hasil = hitungHubungan(dA, dB);
  const res = document.getElementById('hasilHubungan');
  if (res) {
    res.innerHTML = '<div class="result-card relationship-result"><div class="result-header"><span class="result-icon">🤝</span><h3>'+hasil.jenis+'</h3></div><p class="result-desc">'+hasil.deskripsi+'</p>'+(hasil.jenis.includes('Rebu')?'<div class="rebu-warning">⚠️ Konsultasi tetua adat</div>':'')+'</div>';
    res.style.display = 'block';
  }
}

function hitungHubungan(a, b) {
  const cl = n => n ? n.toLowerCase().trim() : '';
  const fA = cl(a.bapa), fB = cl(b.bapa), mA = cl(a.nande), mB = cl(b.nande);
  if (a.nama === b.nama) return { jenis:'Diri Sendiri', deskripsi:'Anda membandingkan dengan diri sendiri' };
  if (fB === cl(a.nama)) return { jenis:'Bapa', deskripsi:'Anda adalah Ayah dari '+b.nama };
  if (fA === cl(b.nama)) return { jenis:'Anak', deskripsi:b.nama+' adalah Anak Anda' };
  if (fA && fA === fB) return { jenis:'Senina', deskripsi:'Saudara semarga (satu ayah)' };
  if (a.marga && b.marga && cl(a.marga) === cl(b.marga) && fA !== fB) return { jenis:'⚠️ Sedonga (Rebu)', deskripsi:'Satu marga beda ayah - dilarang menikah' };
  return { jenis:'Tutur Siwaluh', deskripsi:'Hubungan umum, perlu penelusuran lanjut' };
}

// ===== UI =====
function showPage(p) {
  document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
  const t = document.getElementById('page-'+p); if(t) t.classList.add('active');
  if (p==='cari' && document.getElementById('searchResults')) document.getElementById('searchResults').innerHTML='';
  if (p==='hubungan') updateSelectOptions();
}
function showToast(msg) {
  const t = document.getElementById('toast'), m = document.getElementById('toastMessage');
  if(t && m) { m.textContent = msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'), 3000); }
  else alert(msg);
}
function toggleMenu() { const m = document.getElementById('mobileMenu'); if(m) m.classList.toggle('show'); }
