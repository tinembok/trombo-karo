/**
 * TROMBO KARO - Aplikasi Silsilah Keluarga
 * Web App dengan Google Sheets sebagai Database
 */

// ===== CONFIG =====
const CONFIG = {
  // GANTI DENGAN URL APPS SCRIPT ANDA SETELAH DEPLOY
  SCRIPT_URL: 'https://script.google.com/macros/s/AKfycby0IRYx_vtYKqJoo3dO69kdx_OR34qn8V4FqOi8MKNBgb3cWPtonYMtyKAWlWtmIdz1/exec',
  
  // Merga Silima
  MARGA_KARO: ['ginting', 'karo-karo', 'perangin-angin', 'sembiring', 'tarigan']
};

// ===== STATE =====
let allData = [];
let fotoBase64 = null;
let anakCount = 0;
let saudaraCount = 0;

// ===== 1. FUNGSI UTAMA (GLOBAL SCOPE) =====
// Pastikan fungsi ini berada paling atas agar bisa diakses oleh semua fungsi lain
const superClean = (txt) => {
  if (!txt) return "";
  return txt.toString()
    .toLowerCase()
    .replace(/[-]/g, ' ')      // "karo-karo" -> "karo karo"
    .replace(/\s+/g, ' ')      // Spasi ganda -> satu spasi
    .trim();                   // Hapus spasi di ujung
};

const pastikanArray = (data) => {
  if (!data) return [];
  let str = Array.isArray(data) ? data.join(',') : data.toString();
  return str.split(',').map(s => superClean(s)).filter(s => s !== "");
};

// ===== 2. INIT & EVENT LISTENERS =====
document.addEventListener('DOMContentLoaded', function() {
  init();
});

async function init() {
  const loader = document.getElementById('loading');
  if (loader) setTimeout(() => loader.style.display = 'none', 1000);
  
  await loadData();
  setupEventListeners();
  updateStats();
}

function setupEventListeners() {
  const form = document.getElementById('formInput');
  if (form) form.addEventListener('submit', handleSubmit);
  
  const fotoIn = document.getElementById('fotoInput');
  if (fotoIn) fotoIn.addEventListener('change', handleFoto);
}

// ===== 3. DATA MANAGEMENT =====
async function loadData() {
  try {
    const response = await fetch(CONFIG.SCRIPT_URL + '?action=getAll');
    const result = await response.json();
    if (result.success) {
      allData = result.data.map(item => {
        let newItem = {};
        for (let key in item) {
          newItem[key.toLowerCase()] = item[key];
        }
        return newItem;
      });
      console.log('Data dimuat:', allData);
    }
  } catch (error) {
    console.error('Gagal load data:', error);
  }
}

/**
 * =================================================================================
 * KODE PERBAIKAN - GANTI FUNGSI hitungHubungan LAMA ANDA DENGAN INI
 * =================================================================================
 */

// [FUNGSI BANTUAN BARU] - Tambahkan ini di atas fungsi hitungHubungan
// Fungsi ini membersihkan nama dan mengambil bagian pertama (nama depan) untuk pencocokan.
const cleanAndGetName = (str) => {
  if (!str) return "";
  return str.toString().toLowerCase().replace(/-/g, ' ').split(' ')[0].trim();
};

// Fungsi bantuan untuk mencari data lengkap seseorang berdasarkan nama
const findPerson = (name, allData) => {
  if (!name) return null;
  const cleanedName = cleanAndGetName(name);
  return allData.find(d => cleanAndGetName(d.nama) === cleanedName);
};

// Fungsi bantuan untuk mencari AYAH seseorang (mencari di semua data)
const findFather = (personName, allData) => {
  const person = findPerson(personName, allData);
  // 1. Cek dari data diri sendiri dulu
  if (person && person.bapa) return cleanAndGetName(person.bapa);
  
  // 2. Jika tidak ada, cari di kolom 'anak' orang lain
  const cleanedPersonName = cleanAndGetName(personName);
  for (const p of allData) {
    const anakList = (p.anak || "").toString().split(',').map(n => cleanAndGetName(n));
    if (anakList.includes(cleanedPersonName)) {
      return cleanAndGetName(p.nama); // Ayahnya adalah si empunya data
    }
  }
  return null;
};

// Fungsi bantuan untuk mencari IBU seseorang (mencari di semua data)
const findMother = (personName, allData) => {
    const person = findPerson(personName, allData);
    // 1. Cek dari data diri sendiri dulu
    if (person && person.nande) return cleanAndGetName(person.nande);
    
    // 2. Jika tidak ada, cari ibu dari data ayahnya (sebagai Ndehara)
    const fatherName = findFather(personName, allData);
    const fatherPerson = findPerson(fatherName, allData);
    if (fatherPerson && fatherPerson.ndehara) {
        return cleanAndGetName(fatherPerson.ndehara);
    }
    return null;
};


// [FUNGSI UTAMA YANG DIPERBAIKI]
function hitungHubungan(a, b) {
  // Gunakan allData yang sudah ada di scope global Anda
  const personA_name = cleanAndGetName(a.nama);
  const personB_name = cleanAndGetName(b.nama);

  // Helper untuk mempersingkat pemanggilan
  const getFather = (name) => findFather(name, allData);
  const getMother = (name) => findMother(name, allData);
  const getPerson = (name) => findPerson(name, allData);

  // --- A. HUBUNGAN DARAH LANGSUNG (BAPA/ANAK/SENINA) ---
  if (getFather(personB_name) === personA_name) 
    return { jenis: 'Bapa / Anak', deskripsi: `Anda adalah Bapa dari ${b.nama}` };
  if (getFather(personA_name) === personB_name)
    return { jenis: 'Anak / Bapa', deskripsi: `Beliau adalah Bapa Anda` };
  const fatherA = getFather(personA_name);
  const fatherB = getFather(personB_name);
  if (fatherA && fatherA === fatherB) 
    return { jenis: 'Senina / Turang', deskripsi: 'Saudara kandung sebapa (satu bapak)' };

  // --- B. HUBUNGAN PERNIKAHAN ---
  // Senina Separibanen (Istri masing-masing adek kakak)
  const wifeA = a.ndehara ? cleanAndGetName(a.ndehara) : null;
  const wifeB = b.ndehara ? cleanAndGetName(b.ndehara) : null;
  if (wifeA && wifeB) {
      const fatherOfWifeA = getFather(wifeA);
      const fatherOfWifeB = getFather(wifeB);
      if (fatherOfWifeA && fatherOfWifeA === fatherOfWifeB)
        return { jenis: 'Senina Separibanen', deskripsi: 'Istri Anda dan istri beliau adalah saudara kandung' };
  }
  
  // Silih (Suami dari saudara/anak perempuan)
  const wifeB_person = getPerson(wifeB);
  if (wifeB_person && getFather(wifeB_person.nama) === personA_name)
    return { jenis: 'Kela / Silih', deskripsi: `Beliau adalah suami dari anak perempuan Anda`};

  // --- C. HUBUNGAN IMPAL (ANAK DARI SAUDARA BEDA GENDER) ---
  const motherA = getMother(personA_name);
  // Kasus 1: Ibu A bersaudara dengan Ayah B
  if (motherA && fatherB) {
      const fatherOfMotherA = getFather(motherA);
      const fatherOfFatherB = getFather(fatherB);
      if (fatherOfMotherA && fatherOfMotherA === fatherOfFatherB)
        return { jenis: 'Impal', deskripsi: 'Ibu Anda dan Ayah beliau adalah saudara kandung' };
  }
  // Kasus 2: Ayah A bersaudara dengan Ibu B
  const motherB = getMother(personB_name);
  if (fatherA && motherB) {
      const fatherOfFatherA = getFather(fatherA);
      const fatherOfMotherB = getFather(motherB);
      if (fatherOfFatherA && fatherOfFatherA === fatherOfMotherB)
        return { jenis: 'Impal', deskripsi: 'Ayah Anda dan Ibu beliau adalah saudara kandung' };
  }

  // --- D. HUBUNGAN KALI BUBU / MAMA (PIHAK IBU) ---
  // B adalah saudara laki-laki dari Ibu A
  if (motherA && getFather(motherA) && getFather(motherA) === getFather(personB_name))
     return { jenis: 'Kali Bubu / Mama', deskripsi: 'Beliau adalah saudara laki-laki dari Ibu Anda' };

  // --- E. HUBUNGAN TURUNAN DARI SEPEMEREN/SEPARIBANAN ---
  const motherA_data = getPerson(motherA);
  const motherB_data = getPerson(motherB);
  // Senina Sepemeren (Ibu sama-sama bersaudari)
  if (motherA_data && motherB_data && getFather(motherA_data.nama) && getFather(motherA_data.nama) === getFather(motherB_data.nama)) {
    // Jika A dan B sama-sama laki-laki, mereka Senina Sepemeren
    return { jenis: 'Senina Sepemeren', deskripsi: 'Ibu Anda dan Ibu beliau adalah saudara kandung' };
  }
  // Jika Ibu dari A (Pengalaman) dan B (Irama) adalah sepemeren.
  const fatherOfMotherA = getFather(motherA);
  const motherB_father = getFather(getMother(personB_name));
  if (fatherOfMotherA && motherB_father && getFather(fatherOfMotherA) === getFather(motherB_father)) {
    return { jenis: 'Kali Bubu / Mama (Sepemeren)', deskripsi: 'Ibu Anda dan Ibu beliau bersaudara, sehingga beliau adalah paman (mama) Anda.' };
  }
  
  // --- F. SEMBUYAK (MARGA SAMA) ---
  if (a.marga && b.marga && cleanAndGetName(a.marga) === cleanAndGetName(b.marga))
    return { jenis: 'Sembuyak', deskripsi: 'Satu marga' };

  // Fallback
  return { jenis: 'Tutur Siwaluh', deskripsi: 'Hubungan kekerabatan umum' };
}


// ===== 5. UI FUNCTIONS =====
function updateSelectOptions() {
  const options = allData.map(d => `<option value="${d.nama}">${d.nama} (${d.marga})</option>`).join('');
  const selA = document.getElementById('namaAnda');
  const selB = document.getElementById('namaCari');
  if(selA) selA.innerHTML = '<option value="">Pilih nama Anda</option>' + options;
  if(selB) selB.innerHTML = '<option value="">Pilih nama</option>' + options;
}

function cekHubungan() {
  const namaAnda = document.getElementById('namaAnda').value;
  const namaCari = document.getElementById('namaCari').value;
  
  if (!namaAnda || !namaCari) return alert('Pilih nama dulu');
  
  const dataA = allData.find(d => d.nama === namaAnda);
  const dataB = allData.find(d => d.nama === namaCari);
  
  const hasil = hitungHubungan(dataA, dataB);
  const resDiv = document.getElementById('hasilHubungan');
  
  resDiv.innerHTML = `<h3>${hasil.jenis}</h3><p>${hasil.deskripsi}</p>`;
  resDiv.classList.add('show');
}

function updateStats() {
  const el = document.getElementById('totalKeluarga');
  if(el) el.textContent = allData.length;
}

function initHubunganPage() {
  updateSelectOptions();
}

function showPage(pageName) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(`page-${pageName}`).classList.add('active');
  if(pageName === 'hubungan') initHubunganPage();
}

async function saveData(data) {
  try {
    showToast('Menyimpan data...');
    
    // Gunakan URLSearchParams agar lebih "CORS Friendly" bagi Google Script
    const formData = new URLSearchParams();
    formData.append('action', 'save');
    formData.append('data', JSON.stringify(data));

    const response = await fetch(CONFIG.SCRIPT_URL, {
      method: 'POST',
      body: formData, // Mengirim sebagai form-urlencoded
      mode: 'no-cors'  // Menghindari pre-flight CORS check
    });

    // Catatan: Dengan mode 'no-cors', kita tidak bisa membaca response.json()
    // Namun data tetap masuk ke Google Sheets.
    showToast('✅ Permintaan terkirim! Cek Google Sheet Anda.');
    
    // Reset Form
    document.getElementById('formInput').reset();
    document.getElementById('photoPreview').classList.remove('has-image');
    
  } catch (error) {
    console.error('Error saving:', error);
    showToast('❌ Gagal menyambung ke server');
  }
}

// ===== FORM HANDLING =====
function tambahAnak() {
  anakCount++;
  const container = document.getElementById('anakContainer');
  
  const div = document.createElement('div');
  div.className = 'dynamic-input';
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
  
  const div = document.createElement('div');
  div.className = 'dynamic-input';
  div.innerHTML = `
    <input type="text" name="saudara[]" placeholder="Nama senina/turang ke-${saudaraCount}">
    <button type="button" class="btn-remove" onclick="hapusSaudara(this)">×</button>
  `;
  
  container.appendChild(div);
}

function hapusSaudara(btn) {
  btn.parentElement.remove();
  saudaraCount--;
}

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
  
  if (fotoBase64) {
    preview.innerHTML = `<img src="${fotoBase64}" alt="Foto">`;
    preview.classList.add('has-image');
  } else {
    preview.innerHTML = `
      <span>📷</span>
      <small>Klik untuk ambil foto</small>
    `;
    preview.classList.remove('has-image');
  }
}

async function handleSubmit(e) {
  e.preventDefault();
  
  // Collect anak
  const anakInputs = document.querySelectorAll('input[name="anak[]"]');
  const anak = Array.from(anakInputs).map(input => input.value).filter(v => v);
  
  // Collect saudara
  const saudaraInputs = document.querySelectorAll('input[name="saudara[]"]');
  const saudara = Array.from(saudaraInputs).map(input => input.value).filter(v => v);
  
  const data = {
    nama: document.getElementById('nama').value,
    marga: document.getElementById('marga').value,
    ndehara: document.getElementById('ndehara').value,
    anak: anak,
    bapa: document.getElementById('bapa').value,
    nande: document.getElementById('nande').value,
    saudara: saudara,
    alamat: document.getElementById('alamat').value,
    nowa: document.getElementById('nowa').value,
    foto: fotoBase64,
    timestamp: new Date().toISOString()
  };
  
  await saveData(data);
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// ===== SEARCH =====
function cariKeluarga() {
  const keyword = document.getElementById('searchInput').value.toLowerCase();
  const resultsDiv = document.getElementById('searchResults');
  
  if (!keyword) {
    resultsDiv.innerHTML = '';
    return;
  }
  
  const filtered = allData.filter(d => 
    d.nama.toLowerCase().includes(keyword) ||
    d.marga.toLowerCase().includes(keyword) ||
    d.alamat.toLowerCase().includes(keyword) ||
    d.bapa.toLowerCase().includes(keyword)
  );
  
  if (filtered.length === 0) {
    resultsDiv.innerHTML = '<div class="text-center" style="padding: 40px; color: #999;">Tidak ada hasil</div>';
    return;
  }
  
resultsDiv.innerHTML = filtered.map(d => `
    <div class="result-card">
      <img src="${d.fotourl || 'data:image/svg+xml,...'}" class="result-photo">
      <div class="result-info">
        <div class="result-name">${d.nama}</div>
        <span class="result-marga">${d.marga}</span>
        <div class="result-detail">
          👨 Bapa: ${d.bapa}<br>
          📍 ${d.alamat || '-'}
        </div>
      </div>
    </div>
  `).join('');
}


function showRakutSitelu() {
  showToast('Menampilkan Rakut Sitelu...');
  // Implementasi detail
}

function showImpal() {
  showToast('Menampilkan Impalndu...');
  // Implementasi detail dengan foto thumbnail
}

function showSembuyak() {
  showToast('Menampilkan Sembuyak...');
  // Implementasi detail
}

function showKaliBubu() {
  showToast('Menampilkan Kali Bubu...');
  // Implementasi detail
}

function filterByMarga(marga) {
  document.getElementById('searchInput').value = marga;
  showPage('cari');
  cariKeluarga();
 }

// ===== KAMERA / FACE RECOGNITION =====
let videoStream = null;

async function initKamera() {
  try {
    const video = document.getElementById('videoKamera');
    
    videoStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user' }
    });
    
    video.srcObject = videoStream;
    
  } catch (error) {
    console.error('Error accessing camera:', error);
    showToast('Tidak dapat mengakses kamera');
  }
}

function ambilFoto() {
  const video = document.getElementById('videoKamera');
  const canvas = document.getElementById('canvasKamera');
  const hasilDiv = document.getElementById('hasilRecognition');
  
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0);
  
  // Simulasi face recognition
  // Nanti bisa pakai library seperti face-api.js
  
  const fotoBase64 = canvas.toDataURL('image/jpeg');
  
  // Simulasi hasil recognition
  const hasil = {
    cocok: Math.random() > 0.5,
    nama: allData.length > 0 ? allData[0].nama : 'Tidak Dikenal',
    marga: allData.length > 0 ? allData[0].marga : '-',
    confidence: Math.floor(Math.random() * 30) + 70
  };
  
  hasilDiv.innerHTML = `
    <div style="text-align: center;">
      <img src="${fotoBase64}" style="width: 100%; max-width: 200px; border-radius: 10px; margin-bottom: 15px;">
      ${hasil.cocok ? `
        <h3 style="color: #4CAF50;">✅ Wajah Dikenali</h3>
        <p style="font-size: 1.2rem; font-weight: 600;">${hasil.nama}</p>
        <p style="color: #666;">Marga: ${hasil.marga}</p>
        <p style="font-size: 0.8rem; color: #999;">Confidence: ${hasil.confidence}%</p>
        <p style="margin-top: 10px; padding: 10px; background: #e8f5e9; border-radius: 8px;">
          📢 Panggil: "${hasil.nama}"
        </p>
      ` : `
        <h3 style="color: #f44336;">❌ Wajah Tidak Dikenali</h3>
        <p style="color: #666;">Data tidak ditemukan dalam database</p>
        <button onclick="showPage('input')" class="btn-primary" style="margin-top: 15px;">
          ➕ Input Data Baru
        </button>
      `}
    </div>
  `;
  
  hasilDiv.classList.add('show');
}

// Cleanup kamera saat pindah halaman
window.addEventListener('beforeunload', () => {
  if (videoStream) {
    videoStream.getTracks().forEach(track => track.stop());
  }
});
