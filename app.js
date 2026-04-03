/**
 * TROMBO KARO - Aplikasi Silsilah Keluarga Karo
 * Versi Simplified & Fixed
 */

// ===== CONFIG =====
const CONFIG = {
  SCRIPT_URL: 'https://script.google.com/macros/s/AKfycby0IRYx_vtYKqJoo3dO69kdx_OR34qn8V4FqOi8MKNBgb3cWPtonYMtyKAWlWtmIdz1/exec',
  MARGA_KARO: ['ginting', 'karo-karo', 'perangin-angin', 'sembiring', 'tarigan']
};

// ===== STATE =====
let allData = [];
let fotoBase64 = null;

// ===== UTILITY FUNCTIONS =====
const superClean = (txt) => {
  if (!txt) return "";
  return txt.toString().toLowerCase().replace(/[-]/g, ' ').replace(/\s+/g, ' ').trim();
};

const cleanName = (str) => {
  if (!str) return "";
  return str.toString().toLowerCase().trim();
};

const findPerson = (name) => {
  if (!name) return null;
  const cleaned = cleanName(name);
  return allData.find(d => cleanName(d.nama) === cleaned);
};

const findFather = (personName) => {
  const person = findPerson(personName);
  if (person?.bapa) return cleanName(person.bapa);
  const cleaned = cleanName(personName);
  for (const p of allData) {
    const anakList = (p.anak || "").toString().split(',').map(n => cleanName(n));
    if (anakList.includes(cleaned)) return cleanName(p.nama);
  }
  return null;
};

const findMother = (personName) => {
  const person = findPerson(personName);
  if (person?.nande && person.nande.trim() !== '') return cleanName(person.nande);
  return null;
};

// ===== INIT =====
document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  setupEventListeners();
  updateStats();
  hideLoading();
});

function hideLoading() {
  const loader = document.getElementById('loading');
  if (loader) loader.style.display = 'none';
}

function setupEventListeners() {
  const form = document.getElementById('formInput');
  if (form) form.addEventListener('submit', handleSubmit);
  
  const fotoInput = document.getElementById('fotoInput');
  if (fotoInput) fotoInput.addEventListener('change', handleFoto);
  
  // Auto-hide Beru field
  setupBeruToggle();
}

// ===== DATA MANAGEMENT =====
async function loadData() {
  try {
    const response = await fetch(CONFIG.SCRIPT_URL + '?action=getAll');
    const result = await response.json();
    if (result.success) {
      allData = result.data.map(item => {
        const newItem = {};
        for (let key in item) newItem[key.toLowerCase()] = item[key];
        return newItem;
      });
      console.log('✅ Data dimuat:', allData.length, 'record');
      updateSelectOptions();
      updateMargaCounts();
    }
  } catch (error) {
    console.error('❌ Gagal load data:', error);
    showToast('⚠️ Mode offline');
  }
}

function updateSelectOptions() {
  const options = allData.map(d => 
    '<option value="' + d.nama + '">' + d.nama + ' (' + (d.marga || '-') + ')</option>'
  ).join('');
  
  ['namaAnda', 'namaCari'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = '<option value="">Pilih nama</option>' + options;
  });
}

function updateMargaCounts() {
  CONFIG.MARGA_KARO.forEach(marga => {
    const count = allData.filter(d => superClean(d.marga) === superClean(marga)).length;
    const el = document.getElementById('count-' + superClean(marga));
    if (el) el.textContent = count;
  });
}

function updateStats() {
  const el = document.getElementById('totalKeluarga');
  if (el) el.textContent = allData.length;
}

// ===== FORM FUNCTIONS =====

// Toggle field Beru (hanya untuk perempuan)
function toggleBeruField(selector) {
  const input = document.querySelector(selector);
  if (!input) return;
  
  const nama = input.value.toLowerCase();
  const isFemale = nama.startsWith('beru ') || 
    ['beru', 'br.', 'puteri', 'siti', 'rahma', 'dia', 'nur', 'indah', 'maya', 'lina', 'rina', 'wati', 'sari', 'fitri', 'ani', 'yanti', 'lisa', 'dewi', 'sinta', 'putri']
    .some(hint => nama.includes(hint));
  
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
        const isFemale = ndeharaInput.value.toLowerCase().startsWith('beru ');
        beruNdehara.closest('.form-group').style.display = isFemale ? 'block' : 'none';
        if (!isFemale) beruNdehara.value = '';
      }
    });
  }
}

// Tambah field dinamis
function tambahDynamicField(type, containerId, autoMarga) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  const count = container.children.length + 1;
  const placeholder = type === 'anak' ? 'Nama anak ke-' + count : 
                      type === 'senina' ? 'Nama senina ke-' + count :
                      'Nama ' + type + ' ke-' + count;
  
  const div = document.createElement('div');
  div.className = 'dynamic-item';
  
  let extraAttr = '';
  if (autoMarga) {
    extraAttr = ' data-marga="' + autoMarga + '" placeholder="' + placeholder + ' (' + autoMarga + ')"';
  } else {
    extraAttr = ' placeholder="' + placeholder + '"';
  }
  
  div.innerHTML = '<input type="text" name="' + type + '[]" ' + extraAttr + '>' +
                  '<button type="button" class="btn-remove" onclick="hapusDynamicField(this)">×</button>';
  
  container.appendChild(div);
}

function hapusDynamicField(btn) {
  btn.parentElement.remove();
}

// Wrapper functions
// ===== FUNGSI TAMBAH INPUT DINAMIS (FIXED) =====

function tambahAnak() {
  anakCount++;
  const container = document.getElementById('anakContainer');
  if (!container) return; // Safety check

  const div = document.createElement('div');
  div.className = 'dynamic-input';
  
  // Perbaikan syntax HTML string
  div.innerHTML = `
    <input type="text" name="anak[]" placeholder="Nama anak ke-${anakCount}" required> 
    <button type="button" class="btn-remove" onclick="hapusAnak(this)">×</button>
  `;
  
  container.appendChild(div);
}

function hapusAnak(btn) {
  btn.parentElement.remove();
  anakCount--;
}

function tambahSaudara() {
  saudaraCount++;
  const container = document.getElementById('saudaraContainer');
  if (!container) return; // Safety check

  const div = document.createElement('div');
  div.className = 'dynamic-input';
  
  // Perbaikan syntax HTML string
  div.innerHTML = `
    <input type="text" name="saudara[]" placeholder="Nama senina ke-${saudaraCount}"> 
    <button type="button" class="btn-remove" onclick="hapusSaudara(this)">×</button>
  `;
  
  container.appendChild(div);
}

function hapusSaudara(btn) {
  btn.parentElement.remove();
  saudaraCount--;
}

function tambahSenina() {
  const margaSaya = document.getElementById('marga')?.value || '';
  tambahDynamicField('senina', 'seninaContainer', margaSaya);
}

function tambahSaudaraNdehara() {
  const margaNdehara = document.getElementById('margaNdehara')?.value || '';
  tambahDynamicField('saudaraNdehara', 'saudaraNdeharaContainer', margaNdehara);
}

function hapusSenina(btn) { hapusDynamicField(btn); }
function hapusSaudaraNdehara(btn) { hapusDynamicField(btn); }

// Reset form
function resetForm() {
  if (!confirm('Reset semua data form?')) return;
  
  const form = document.getElementById('formInput');
  if (form) form.reset();
  
  fotoBase64 = null;
  updatePhotoPreview();
  
  ['anakContainer', 'seninaContainer', 'saudaraNdeharaContainer'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = '';
  });
  
  toggleBeruField('#nama');
  showToast('🔄 Form di-reset');
}

// Handle foto
function handleFoto(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(event) {
    fotoBase64 = event.target.result;
    updatePhotoPreview();
  };
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
  const input = document.getElementById('fotoInput');
  if (input) input.value = '';
  updatePhotoPreview();
}

// Submit form
async function handleSubmit(e) {
  e.preventDefault();
  
  const btn = document.getElementById('btnSubmit');
  if (!btn) return;
  
  const collectInputs = (selector) => 
    Array.from(document.querySelectorAll(selector))
      .map(input => input.value.trim())
      .filter(v => v);
  
  const data = {
    nama: document.getElementById('nama')?.value.trim(),
    marga: document.getElementById('marga')?.value.trim(),
    bapa: document.getElementById('bapa')?.value.trim(),
    nande: document.getElementById('nande')?.value.trim(),
    beru: document.getElementById('beru')?.value.trim(),
    senina: collectInputs('input[name="senina[]"]'),
    ndeharaNama: document.getElementById('ndeharaNama')?.value.trim(),
    margaNdehara: document.getElementById('margaNdehara')?.value.trim(),
    bapaNdehara: document.getElementById('bapaNdehara')?.value.trim(),
    nandeNdehara: document.getElementById('nandeNdehara')?.value.trim(),
    beruNdehara: document.getElementById('beruNdehara')?.value.trim(),
    saudaraNdehara: collectInputs('input[name="saudaraNdehara[]"]'),
    anak: collectInputs('input[name="anak[]"]'),
    alamat: document.getElementById('alamat')?.value.trim(),
    nowa: document.getElementById('nowa')?.value.trim(),
    foto: fotoBase64,
    timestamp: new Date().toISOString()
  };
  
  if (!data.nama || !data.marga || !data.bapa || !data.nande) {
    showToast('❌ Nama, Marga, Bapa, dan Nande wajib diisi');
    return;
  }
  
  const originalText = btn.innerHTML;
  btn.innerHTML = '⏳ Menyimpan...';
  btn.disabled = true;
  
  try {
    await saveData(data);
  } catch (error) {
    console.error('Save error:', error);
    showToast('❌ Gagal menyimpan');
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}

async function saveData(data) {
  try {
    showToast('📤 Mengirim data...');
    
    const formData = new URLSearchParams();
    formData.append('action', 'save');
    formData.append('data', JSON.stringify(data));
    
    await fetch(CONFIG.SCRIPT_URL, {
      method: 'POST',
      body: formData,
      mode: 'no-cors'
    });
    
    showToast('✅ Data tersimpan!');
    resetForm();
    await loadData();
    
  } catch (error) {
    console.error('Network error:', error);
    showToast('⚠️ Cek Google Sheets');
  }
}

// ===== SEARCH =====
function cariKeluarga() {
  const keyword = document.getElementById('searchInput')?.value.toLowerCase().trim();
  const resultsDiv = document.getElementById('searchResults');
  
  if (!keyword || !resultsDiv) return;
  
  const filtered = allData.filter(d => 
    (d.nama && d.nama.toLowerCase().includes(keyword)) ||
    (d.marga && d.marga.toLowerCase().includes(keyword)) ||
    (d.alamat && d.alamat.toLowerCase().includes(keyword)) ||
    (d.bapa && d.bapa.toLowerCase().includes(keyword))
  );
  
  if (filtered.length === 0) {
    resultsDiv.innerHTML = '<div class="empty-state">🔍 Tidak ada hasil</div>';
    return;
  }
  
  resultsDiv.innerHTML = filtered.map(d => {
    const foto = d.fotourl || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60"><text x="50%" y="50%" font-size="30">👤</text></svg>';
    return '<div class="result-card">' +
      '<img src="' + foto + '" class="result-photo" onerror="this.src=\'data:image/svg+xml,<svg xmlns=\\\'http://www.w3.org/2000/svg\\\' width=\\\'60\\\' height=\\\'60\\\'><text x=\\\'50%\\\' y=\\\'50%\\\' font-size=\\\'30\\\'>👤</text></svg>\'">' +
      '<div class="result-info">' +
        '<div class="result-name">' + (d.nama || '-') + '</div>' +
        '<span class="result-marga">' + (d.marga || '-') + '</span>' +
        '<div class="result-detail">👨 ' + (d.bapa || '-') + ' • 👩 ' + (d.nande || '-') + '<br>📍 ' + (d.alamat || '-') + '</div>' +
      '</div></div>';
  }).join('');
  
  const countEl = document.getElementById('resultCount');
  const statsEl = document.getElementById('searchStats');
  if (countEl) countEl.textContent = filtered.length + ' hasil';
  if (statsEl) statsEl.style.display = 'flex';
}

function handleSearchInput(e) {
  if (e && e.key === 'Enter') cariKeluarga();
}

function filterByMarga(marga) {
  const input = document.getElementById('searchInput');
  if (input) input.value = marga;
  showPage('cari');
  cariKeluarga();
}

// ===== HUBUNGAN / TUTUR =====
function hitungHubungan(a, b) {
  if (!a?.nama || !b?.nama) return { jenis: 'Error', deskripsi: 'Data tidak lengkap' };
  
  const pA = cleanName(a.nama);
  const pB = cleanName(b.nama);
  
  const getFather = (name) => findFather(name);
  const getMother = (name) => findMother(name);
  
  const fatherA = getFather(pA);
  const fatherB = getFather(pB);
  const motherA = getMother(pA);
  const motherB = getMother(pB);
  
  if (pA === pB) return { jenis: 'Diri Sendiri', deskripsi: 'Anda membandingkan dengan diri sendiri' };
  if (fatherB === pA) return { jenis: 'Bapa', deskripsi: 'Anda adalah Ayah dari ' + b.nama };
  if (fatherA === pB) return { jenis: 'Anak', deskripsi: b.nama + ' adalah Anak Anda' };
  
  if (fatherA && fatherA === fatherB) {
    const isSembuyak = (a.saudara && a.saudara.includes(b.nama)) || (b.saudara && b.saudara.includes(a.nama));
    return { 
      jenis: isSembuyak ? 'Sembuyak' : 'Senina',
      deskripsi: isSembuyak ? 'Saudara kandung satu rahim' : 'Saudara semarga (satu ayah)'
    };
  }
  
  if (motherA && getFather(motherA) === fatherB) {
    return { jenis: 'Kalimbubu (Mama)', deskripsi: b.nama + ' adalah Paman dari pihak Ibu Anda' };
  }
  if (motherB && getFather(motherB) === fatherA) {
    return { jenis: 'Anak Beru', deskripsi: b.nama + ' adalah keponakan (Bere-bere) Anda' };
  }
  
  const isImpal = 
    (motherA && fatherB && getFather(motherA) === getFather(fatherB)) ||
    (fatherA && motherB && getFather(fatherA) === getFather(motherB));
  if (isImpal) {
    return { jenis: 'Impal', deskripsi: 'Sepupu silang - calon pasangan ideal dalam adat Karo' };
  }
  
  if (motherA && motherB && getFather(motherA) === getFather(motherB)) {
    return { jenis: 'Senina Sipemeren', deskripsi: 'Ibu Anda dan Ibu beliau bersaudara' };
  }
  
  if (a.marga && b.marga && superClean(a.marga) === superClean(b.marga) && fatherA !== fatherB) {
    return { jenis: '⚠️ Sedonga (Rebu)', deskripsi: 'Satu marga tetapi tidak satu ayah - dilarang menikah' };
  }
  
  return { jenis: 'Tutur Siwaluh', deskripsi: 'Hubungan umum, perlu penelusuran lebih lanjut' };
}

function cekHubungan() {
  const namaA = document.getElementById('namaAnda')?.value;
  const namaB = document.getElementById('namaCari')?.value;
  
  if (!namaA || !namaB) {
    showToast('⚠️ Pilih kedua nama terlebih dahulu');
    return;
  }
  
  const dataA = allData.find(d => d.nama === namaA);
  const dataB = allData.find(d => d.nama === namaB);
  
  if (!dataA || !dataB) {
    showToast('❌ Data tidak ditemukan');
    return;
  }
  
  const hasil = hitungHubungan(dataA, dataB);
  const resDiv = document.getElementById('hasilHubungan');
  
  if (resDiv) {
    let rebuWarn = hasil.jenis.includes('Rebu') ? 
      '<div class="rebu-warning">⚠️ Konsultasikan dengan tetua adat</div>' : '';
    
    resDiv.innerHTML = '<div class="result-card relationship-result">' +
      '<div class="result-header"><span class="result-icon">🤝</span><h3>' + hasil.jenis + '</h3></div>' +
      '<p class="result-desc">' + hasil.deskripsi + '</p>' + rebuWarn + '</div>';
    resDiv.style.display = 'block';
  }
}

function initHubunganPage() {
  updateSelectOptions();
}

// ===== PAGE NAVIGATION =====
function showPage(pageName) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + pageName);
  if (target) target.classList.add('active');
  
  if (pageName === 'hubungan') initHubunganPage();
  if (pageName === 'cari') {
    const results = document.getElementById('searchResults');
    if (results) results.innerHTML = '';
  }
}

// ===== UI HELPERS =====
function showToast(message) {
  const toast = document.getElementById('toast');
  const msgEl = document.getElementById('toastMessage');
  if (toast && msgEl) {
    msgEl.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
  } else {
    alert(message);
  }
}

function toggleMenu() {
  const menu = document.getElementById('mobileMenu');
  if (menu) menu.classList.toggle('show');
}
