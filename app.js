/**
 * TROMBO KARO - Aplikasi Silsilah Keluarga
 * Versi Perbaikan: Fixed Syntax Error & Deep Kinship Logic
 */

// ===== CONFIG =====
const CONFIG = {
  SCRIPT_URL: 'https://script.google.com/macros/s/AKfycby0IRYx_vtYKqJoo3dO69kdx_OR34qn8V4FqOi8MKNBgb3cWPtonYMtyKAWlWtmIdz1/exec',
  MARGA_KARO: ['ginting', 'karo karo', 'perangin angin', 'sembiring', 'tarigan']
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
  setTimeout(() => {
    const loader = document.getElementById('loading');
    if(loader) loader.style.display = 'none';
  }, 1000);
  
  await loadData();
  setupEventListeners();
  updateStats();
}

// 1. FUNGSI NORMALISASI (SOLUSI MASALAH HURUF/SPASI)
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

function setupEventListeners() {
  const form = document.getElementById('formInput');
  if(form) form.addEventListener('submit', handleSubmit);
  
  const fotoIn = document.getElementById('fotoInput');
  if(fotoIn) fotoIn.addEventListener('change', handleFoto);
  
  const preview = document.getElementById('photoPreview');
  if(preview) preview.addEventListener('click', () => {
    document.getElementById('fotoInput').click();
  });
}

// ===== NAVIGATION =====
function showPage(pageName) {
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
  if(event && event.target) {
     const target = event.target.closest('.nav-btn');
     if(target) target.classList.add('active');
  }
  
  document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
  const targetPage = document.getElementById(`page-${pageName}`);
  if(targetPage) targetPage.classList.add('active');
  
  currentPage = pageName;
  
  if (pageName === 'hubungan') initHubunganPage();
  if (pageName === 'kamera') initKamera();
}

// ===== DATA MANAGEMENT =====
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

async function saveData(data) {
  try {
    showToast('Menyimpan data...');
    const formData = new URLSearchParams();
    formData.append('action', 'save');
    formData.append('data', JSON.stringify(data));

    await fetch(CONFIG.SCRIPT_URL, {
      method: 'POST',
      body: formData,
      mode: 'no-cors'
    });

    showToast('✅ Data terkirim!');
    document.getElementById('formInput').reset();
    fotoBase64 = null;
    updatePhotoPreview();
    loadData(); // Refresh data
  } catch (error) {
    showToast('❌ Gagal simpan');
  }
}

// ===== LOGIKA HUBUNGAN (Kunci Utama) =====
function hitungHubungan(a, b) {
  const uA = {
    nama: superClean(a.nama), marga: superClean(a.marga), bapa: superClean(a.bapa),
    nande: superClean(a.nande), saudara: pastikanArray(a.saudara), ndehara: superClean(a.ndehara),
    anak: pastikanArray(a.anak)
  };
  
  const uB = {
    nama: superClean(b.nama), marga: superClean(b.marga), bapa: superClean(b.bapa),
    nande: superClean(b.nande), saudara: pastikanArray(b.saudara), ndehara: superClean(b.ndehara),
    anak: pastikanArray(b.anak)
  };

  const dataBapaA = allData.find(d => superClean(d.nama) === uA.bapa);
  const dataNandeA = allData.find(d => superClean(d.nama) === uA.nande);
  const dataBapaB = allData.find(d => superClean(d.nama) === uB.bapa);
  const dataNandeB = allData.find(d => superClean(d.nama) === uB.nande);

  // 1. AYAH & ANAK
  if (uB.bapa === uA.nama || uA.anak.includes(uB.nama)) 
    return { jenis: 'Bapa / Anak', deskripsi: `Anda adalah Ayah/Orang tua dari ${b.nama}` };
  if (uA.bapa === uB.nama || uB.anak.includes(uA.nama)) 
    return { jenis: 'Anak / Bapa', deskripsi: `Beliau adalah Ayah/Orang tua Anda` };

  // 2. SENINA / TURANG
  if (uA.bapa !== "" && uA.bapa === uB.bapa) 
    return { jenis: 'Senina / Turang', deskripsi: 'Saudara kandung sebapa' };

  // 3. ERSENINA SEPEMEREN
  if (dataNandeA && dataNandeB && dataNandeA.bapa === dataNandeB.bapa && dataNandeA.bapa !== "")
    return { jenis: 'Ernisenina Sepemeren', deskripsi: 'Nande masing-masing adalah kakak beradik' };

  // 4. SILIH
  if (uB.ndehara !== "" && uA.saudara.includes(uB.ndehara))
    return { jenis: 'Silih', deskripsi: 'Beliau adalah suami dari saudara perempuan Anda' };
  if (uA.ndehara !== "" && uB.saudara.includes(uA.ndehara))
    return { jenis: 'Silih', deskripsi: 'Anda adalah suami dari saudara perempuan beliau' };

  // 5. SIPARIBANEN
  const istriA = allData.find(d => superClean(d.nama) === uA.ndehara);
  const istriB = allData.find(d => superClean(d.nama) === uB.ndehara);
  if (istriA && istriB && istriA.bapa === istriB.bapa && istriA.bapa !== "")
    return { jenis: 'Siparibanen', deskripsi: 'Istri Anda dan istri beliau adalah kakak beradik' };

  // 6. KELA / MENANTU
  if (uB.ndehara !== "" && (uA.anak.includes(uB.ndehara) || uB.ndehara.includes(uA.nama)))
    return { jenis: 'Kela (Menantu)', deskripsi: 'Beliau adalah suami dari anak Anda' };

  // 7. LAKI / KAKEK
  if (dataNandeA && dataNandeA.bapa === uB.nama)
    return { jenis: 'Laki (Kakek)', deskripsi: 'Ayah dari Nande Anda' };

  // 8. BERE-BERE
  if (uB.nande !== "" && uA.saudara.includes(uB.nande))
    return { jenis: 'Bere-bere', deskripsi: 'Anak dari saudara perempuan Anda' };

  // 9. KALI BUBU
  if (uA.nande !== "" && (uB.nama === uA.nande || uB.saudara.includes(uA.nande)))
    return { jenis: 'Kali Bubu', deskripsi: 'Paman (Mama) dari pihak Nande' };

  // 10. IMPAL
  if (dataBapaB && dataBapaB.saudara.includes(uA.nande))
    return { jenis: 'Impal', deskripsi: 'Anak dari Paman (Mama)' };

  // 11. SEMBUYAK
  if (uA.marga === uB.marga && uA.marga !== "")
    return { jenis: 'Sembuyak', deskripsi: 'Satu marga (Rakut Sitelu)' };

  return { jenis: 'Tutur Siwaluh', deskripsi: 'Hubungan kekerabatan umum' };
}

// ===== UI HELPERS =====
function updateStats() {
  const el = document.getElementById('totalKeluarga');
  if(el) el.textContent = allData.length;
}

function showToast(message) {
  const toast = document.getElementById('toast');
  if(toast) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
  }
}

function handleFoto(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    fotoBase64 = event.target.result;
    updatePhotoPreview();
  };
  reader.readAsDataURL(file);
}

function updatePhotoPreview() {
  const preview = document.getElementById('photoPreview');
  if(!preview) return;
  if (fotoBase64) {
    preview.innerHTML = `<img src="${fotoBase64}" alt="Foto">`;
    preview.classList.add('has-image');
  } else {
    preview.innerHTML = `<span>📷</span><small>Klik untuk ambil foto</small>`;
    preview.classList.remove('has-image');
  }
}

async function handleSubmit(e) {
  e.preventDefault();
  const anak = Array.from(document.querySelectorAll('input[name="anak[]"]')).map(i => i.value).filter(v => v);
  const saudara = Array.from(document.querySelectorAll('input[name="saudara[]"]')).map(i => i.value).filter(v => v);
  
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

function tambahAnak() {
  anakCount++;
  const container = document.getElementById('anakContainer');
  const div = document.createElement('div');
  div.className = 'dynamic-input';
  div.innerHTML = `<input type="text" name="anak[]" placeholder="Nama anak ke-${anakCount}" required>
                   <button type="button" class="btn-remove" onclick="this.parentElement.remove()">×</button>`;
  container.appendChild(div);
}

function tambahSaudara() {
  saudaraCount++;
  const container = document.getElementById('saudaraContainer');
  const div = document.createElement('div');
  div.className = 'dynamic-input';
  div.innerHTML = `<input type="text" name="saudara[]" placeholder="Nama saudara ke-${saudaraCount}">
                   <button type="button" class="btn-remove" onclick="this.parentElement.remove()">×</button>`;
  container.appendChild(div);
}

function initHubunganPage() {
  const options = allData.map(d => `<option value="${d.nama}">${d.nama} (${d.marga})</option>`).join('');
  document.getElementById('namaAnda').innerHTML = '<option value="">Pilih nama Anda</option>' + options;
  document.getElementById('namaCari').innerHTML = '<option value="">Pilih nama</option>' + options;
}

function cekHubungan() {
  const namaAnda = document.getElementById('namaAnda').value;
  const namaCari = document.getElementById('namaCari').value;
  if (!namaAnda || !namaCari) return showToast('Pilih nama dulu');
  
  const dataA = allData.find(d => d.nama === namaAnda);
  const dataB = allData.find(d => d.nama === namaCari);
  const hasil = hitungHubungan(dataA, dataB);
  
  const resDiv = document.getElementById('hasilHubungan');
  resDiv.innerHTML = `<h3>${hasil.jenis}</h3><p>${hasil.deskripsi}</p>`;
  resDiv.classList.add('show');
}
