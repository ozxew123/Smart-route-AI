// Inisialisasi Map Leaflet (Default Jakarta/Depok)
let map = null;
let routeLayer = null;
let markersLayer = null;

document.addEventListener('DOMContentLoaded', () => {
    initMap();
    checkUrlQueryParams();
});

function checkUrlQueryParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q') || urlParams.get('query');
    const vehicle = urlParams.get('vehicle');

    if (query) {
        const textarea = document.getElementById('userQuery');
        if (textarea) textarea.value = decodeURIComponent(query);

        if (vehicle) {
            const rad = document.querySelector(`input[name="vehicleOption"][value="${vehicle}"]`);
            if (rad) rad.checked = true;
        }

        const auto = urlParams.get('auto');
        if (auto === '1' || auto === 'true') {
            setTimeout(() => {
                if (typeof submitRoute === 'function') {
                    submitRoute();
                }
            }, 500);
        }
    }
}

function initMap() {
    const mapElement = document.getElementById('map');
    if (!mapElement) return;

    // Koordinat awal Jabodetabek (Depok / Jakarta)
    map = L.map('map').setView([-6.3686, 106.8331], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    markersLayer = L.layerGroup().addTo(map);
}

// Web Speech API untuk Input Suara (FR-01)
let recognition = null;
let isRecording = false;

function toggleVoiceInput() {
    const micBtn = document.getElementById('micBtn');
    const micIcon = document.getElementById('micIcon');
    const voiceStatus = document.getElementById('voiceStatus');
    const userQuery = document.getElementById('userQuery');

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        alert('Fitur pengenalan suara (Web Speech API) tidak didukung pada browser ini. Mohon gunakan Chrome atau Edge.');
        return;
    }

    if (!recognition) {
        recognition = new SpeechRecognition();
        recognition.lang = 'id-ID';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => {
            isRecording = true;
            micBtn.classList.remove('btn-outline-secondary');
            micBtn.classList.add('btn-danger');
            voiceStatus.style.display = 'block';
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            userQuery.value = transcript;
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            stopVoiceInput();
        };

        recognition.onend = () => {
            stopVoiceInput();
        };
    }

    if (!isRecording) {
        try {
            recognition.start();
        } catch (e) {
            console.error(e);
        }
    } else {
        recognition.stop();
    }
}

function stopVoiceInput() {
    isRecording = false;
    const micBtn = document.getElementById('micBtn');
    const voiceStatus = document.getElementById('voiceStatus');
    if (micBtn) {
        micBtn.classList.remove('btn-danger');
        micBtn.classList.add('btn-outline-secondary');
    }
    if (voiceStatus) {
        voiceStatus.style.display = 'none';
    }
}

// Mengirim Permintaan ke Backend (/api/process-route)
async function submitRoute() {
    const query = document.getElementById('userQuery').value.trim();
    const vehicle = document.querySelector('input[name="vehicleOption"]:checked').value;
    const btnSubmit = document.getElementById('btnSubmit');
    const statusAlert = document.getElementById('statusAlert');

    if (!query) return;

    btnSubmit.disabled = true;
    btnSubmit.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Menganalisis Rute...`;
    statusAlert.style.display = 'none';

    try {
        const response = await fetch('/api/process-route', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query, vehicle })
        });

        const data = await response.json();

        if (!data.success) {
            showAlert('warning', data.message || 'Gagal memproses rute.');
            return;
        }

        renderRoute(data);
    } catch (err) {
        console.error('Error:', err);
        showAlert('danger', 'Terjadi kesalahan koneksi saat memproses rute.');
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = `<i class="bi bi-search me-1"></i> Analisis Rute & Cuaca`;
    }
}

function showAlert(type, message) {
    const statusAlert = document.getElementById('statusAlert');
    statusAlert.className = `alert alert-${type} py-2 px-3 small`;
    statusAlert.innerHTML = message;
    statusAlert.style.display = 'block';
}

function renderRoute(data) {
    const { route, weather, risk, advice, entities } = data;

    // 1. Tampilkan kartu AI Safety Advice
    const aiCard = document.getElementById('aiAdviceCard');
    const aiText = document.getElementById('aiAdviceText');
    const riskBadge = document.getElementById('riskBadge');

    aiCard.style.display = 'block';
    aiText.innerText = advice;

    if (risk.risk_level === 'Tinggi') {
        riskBadge.className = 'badge bg-danger';
        riskBadge.innerText = 'Risiko Tinggi (Hujan)';
    } else if (risk.risk_level === 'Sedang') {
        riskBadge.className = 'badge bg-warning text-dark';
        riskBadge.innerText = 'Risiko Sedang';
    } else {
        riskBadge.className = 'badge bg-success';
        riskBadge.innerText = 'Kondisi Aman';
    }

    // 2. Tampilkan Ringkasan Rute
    document.getElementById('routeSummaryCard').style.display = 'block';
    document.getElementById('distText').innerText = `${route.distance_km} km`;
    document.getElementById('durText').innerText = `${route.duration_min} menit`;
    document.getElementById('vehText').innerText = entities.vehicle || 'motor';

    // 3. Tampilkan 3 Titik Cuaca
    document.getElementById('weatherCardsRow').style.display = 'flex';

    document.getElementById('wOriginName').innerText = entities.origin;
    document.getElementById('wOriginDesc').innerText = weather.origin.description;
    document.getElementById('wOriginTemp').innerText = `${weather.origin.temp_c || 29}°C`;

    document.getElementById('wMidName').innerText = 'Jalur Tengah';
    document.getElementById('wMidDesc').innerText = weather.midpoint.description;
    document.getElementById('wMidTemp').innerText = `${weather.midpoint.temp_c || 29}°C`;

    document.getElementById('wDestName').innerText = entities.destination;
    document.getElementById('wDestDesc').innerText = weather.destination.description;
    document.getElementById('wDestTemp').innerText = `${weather.destination.temp_c || 29}°C`;

    // 4. Gambar Rute di Leaflet Map
    if (routeLayer) {
        map.removeLayer(routeLayer);
    }
    markersLayer.clearLayers();

    // Gambar Polyline
    routeLayer = L.polyline(route.coordinates, {
        color: '#0d6efd',
        weight: 5,
        opacity: 0.85
    }).addTo(map);

    // Marker Awal
    L.marker([route.origin.lat, route.origin.lon])
        .bindPopup(`<b>Titik Awal:</b> ${entities.origin}`)
        .addTo(markersLayer);

    // Marker Tengah (Sampling Cuaca)
    if (route.midpoint) {
        L.marker([route.midpoint.lat, route.midpoint.lon])
            .bindPopup(`<b>Titik Tengah Cuaca:</b> ${weather.midpoint.condition}`)
            .addTo(markersLayer);
    }

    // Marker Akhir
    L.marker([route.destination.lat, route.destination.lon])
        .bindPopup(`<b>Titik Tujuan:</b> ${entities.destination}`)
        .addTo(markersLayer);

    // Zoom peta agar seluruh rute terlihat
    map.fitBounds(routeLayer.getBounds(), { padding: [40, 40] });
}

