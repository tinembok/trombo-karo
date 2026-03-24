/**
 * TROMBO KARO - Aplikasi Silsilah Keluarga
 * Web App dengan Google Sheets sebagai Database
 */

// ===== CONFIG =====
const CONFIG = {
  // GANTI DENGAN URL APPS SCRIPT ANDA SETELAH DEPLOY
  SCRIPT_URL: 'https://script.google.com/macros/s/AKfycby0IRYx_vtYKqJoo3dO69kdx_OR34qn8V4FqOi8MKNBgb3cWPtonYMtyKAWlWtmIdz1/exec',
  
  // Merga Silima
  MARGA_KARO: ['Ginting', 'Karo-Karo', 'Perangin-angin', 'Sembiring', 'Tarigan']
};

// ===== STATE =====
let currentPage = 'home';
let fotoBase64 = null;
let anakCount = 0;
let saudaraCount = 0;
let allData = [];

// ===== INIT =====
document.addEventListener('DOMContentLoaded', function() {
  init();
});

async function init() {
  // Hide loading after 1s
  setTimeout(() => {
    document.getElementById('loading').style.display = 'none';
  }, 1000);
  
  // Load data
  await loadData();
  
  // Setup event listeners
  setupEventListeners();
  
  // Update stats
  updateStats();
}

function setupEventListeners() {
  // Form input
  document.getElementById('formInput').addEventListener('submit', handleSubmit);
  
  // Foto input
  document.getElementById('fotoInput').addEventListener('change', handleFoto);
  
  // Photo preview click
  document.getElementById('photoPreview').addEventListener('click', () => {
    document.getElementById('fotoInput').click();
  });
}

// ===== NAVIGATION =====
function showPage(pageName) {
  // Update nav buttons
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.closest('.nav-btn').classList.add('active');
  
  // Hide all pages
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });
  
  // Show selected page
  document.getElementById(`page-${pageName}`).classList.add('active');
  currentPage = pageName;
  
  // Page specific init
  if (pageName === 'hubungan') {
    initHubunganPage();
  } else if (pageName === 'kamera') {
    initKamera();
  }
}

// ===== DATA MANAGEMENT =====
async function loadData() {
  try {
    showToast('Memuat data...');
    
    // Melakukan fetch data asli dari Google Apps Script
    // Kita menambahkan parameter action=getAll agar doPost di Code.gs tahu apa yang harus dilakukan
    const response = await fetch(CONFIG.SCRIPT_URL + '?action=getAll');
    const result = await response.json();
    
    if (result.success) {
      allData = result.data; // Mengisi variabel allData dengan data asli dari Sheet
      console.log('Data berhasil dimuat:', allData);
    } else {
      showToast('Gagal: ' + result.message);
    }
    
    updateStats();
    updateSelectOptions();
    
  } catch (error) {
    console.error('Error loading data:', error);
    showToast('Gagal menyambung ke database');
    
    // Data dummy hanya sebagai fallback jika server error
    allData = []; 
  }
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

// ===== STATS & UI =====
function updateStats() {
  document.getElementById('totalKeluarga').textContent = allData.length;
}

function updateSelectOptions() {
  const namaAnda = document.getElementById('namaAnda');
  const namaCari = document.getElementById('namaCari');
  
  // Sekarang kita yakin kuncinya adalah 'nama' dan 'marga' (huruf kecil)
  const options = allData.map(d => {
    const nama = d.nama || "Tanpa Nama";
    const marga = d.marga || "";
    return `<option value="${nama}">${nama} (${marga})</option>`;
  }).join('');
  
  namaAnda.innerHTML = '<option value="">Pilih nama Anda</option>' + options;
  namaCari.innerHTML = '<option value="">Pilih nama</option>' + options;
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
// ===== HUBUNGAN FUNCTIONS =====
function initHubunganPage() {
  updateSelectOptions();
}

function cekHubungan() {
  const namaAnda = document.getElementById('namaAnda').value;
  const namaCari = document.getElementById('namaCari').value;
  const hasilDiv = document.getElementById('hasilHubungan');
  
  if (!namaAnda || !namaCari) {
    showToast('Pilih kedua nama terlebih dahulu');
    return;
  }
  
  if (namaAnda === namaCari) {
    showToast('Pilih dua nama yang berbeda');
    return;
  }
  
  const dataAnda = allData.find(d => d.nama === namaAnda);
  const dataCari = allData.find(d => d.nama === namaCari);
  
  const hubungan = hitungHubungan(dataAnda, dataCari);
  
  hasilDiv.innerHTML = `
    <div class="hubungan-title">
      <h3>${hubungan.jenis}</h3>
      <p>${hubungan.deskripsi}</p>
    </div>
    <div style="display: flex; gap: 15px; justify-content: center;">
      <div style="text-align: center;">
        <div style="font-size: 3rem;">👤</div>
        <div style="font-weight: 600;">${dataAnda.nama}</div>
        <div style="font-size: 0.8rem; color: #666;">Anda</div>
      </div>
      <div style="display: flex; align-items: center; font-size: 1.5rem;">↔️</div>
      <div style="text-align: center;">
        <div style="font-size: 3rem;">👤</div>
        <div style="font-weight: 600;">${dataCari.nama}</div>
        <div style="font-size: 0.8rem; color: #666;">${dataCari.marga}</div>
      </div>
    </div>
  `;
  
  hasilDiv.classList.add('show');
}

function hitungHubungan(a, b) {
  // Normalisasi: pastikan kita menggunakan huruf kecil sesuai data dari database
  const userA = {
    nama: (a.nama || "").toLowerCase(),
    marga: (a.marga || "").toLowerCase(),
    bapa: (a.bapa || "").toLowerCase(),
    nande: (a.nande || "").toLowerCase(),
    saudara: (a.saudara || []).map(s => s.toLowerCase())
  };
  
  const userB = {
    nama: (b.nama || "").toLowerCase(),
    marga: (b.marga || "").toLowerCase(),
    bapa: (b.bapa || "").toLowerCase(),
    nande: (b.nande || "").toLowerCase(),
    saudara: (b.saudara || []).map(s => s.toLowerCase())
  };

  // 1. Cek Senina / Turang (Satu Ayah)
  if (userA.bapa === userB.bapa && userA.bapa !== "") {
    return {
      jenis: 'Senina / Turang',
      deskripsi: 'Saudara kandung sebapa (Satu darah/Turang)'
    };
  }

  // 2. Cek Kali Bubu (Pihak Keluarga Ibu)
  // Hubungan ini terjadi jika Bapa dari si B adalah Saudara dari Nande si A
  // Atau jika si B adalah saudara laki-laki dari Nande si A
  if (userA.nande !== "" && (userB.nama === userA.nande || userB.saudara.includes(userA.nande))) {
    return {
      jenis: 'Kali Bubu',
      deskripsi: 'Pihak keluarga dari Nande (Pemberi Gadis)'
    };
  }

  // 3. Cek Rakut Sitelu (Satu Marga)
  if (userA.marga === userB.marga && userA.marga !== "") {
    return {
      jenis: 'Sembuyak / Senina',
      deskripsi: 'Satu marga, berbeda bapa (Rakut Sitelu)'
    };
  }

  // 4. Cek Impal (Anak dari Saudara Ibu/Ayah yang berbeda jenis kelamin)
  if (userA.saudara.includes(userB.bapa) || userB.saudara.includes(userA.bapa)) {
    return {
      jenis: 'Impal',
      deskripsi: 'Anak dari saudara (Keluarga dekat)'
    };
  }

  return {
    jenis: 'Tutur Siwaluh',
    deskripsi: 'Hubungan kekerabatan umum dalam adat Karo'
  };
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
