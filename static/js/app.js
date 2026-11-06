// Inisialisasi Map Leaflet (Default Jakarta/Depok)
let map = null;
let routeLayer = null;
let markersLayer = null;

// State untuk Modul Klarifikasi Asisten (FR-06)
let pendingClarification = null;

document.addEventListener('DOMContentLoaded', () => {
    initMap();
    checkUrlQueryParams();
});

function setQueryPreset(text, vehicle = 'motor') {
    const textarea = document.getElementById('userQuery');
    if (textarea) textarea.value = text;

    const rad = document.querySelector(`input[name="vehicleOption"][value="${vehicle}"]`);
    if (rad) rad.checked = true;

    submitRoute();
}

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
                submitRoute();
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
            if (voiceStatus) voiceStatus.style.display = 'block';
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            userQuery.value = transcript;
            stopVoiceInput();
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
async function submitRoute(overrideQuery = null) {
    const query = overrideQuery || document.getElementById('userQuery').value.trim();
    const vehicleRadio = document.querySelector('input[name="vehicleOption"]:checked');
    const vehicle = vehicleRadio ? vehicleRadio.value : 'motor';
    const btnSubmit = document.getElementById('btnSubmit');
    const statusAlert = document.getElementById('statusAlert');
    const clarificationCard = document.getElementById('clarificationCard');

    if (!query) return;

    btnSubmit.disabled = true;
    btnSubmit.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Menganalisis Rute & Cuaca...`;
    statusAlert.style.display = 'none';
    clarificationCard.style.display = 'none';

    try {
        const response = await fetch('/api/process-route', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query, vehicle })
        });

        const data = await response.json();

        // FR-06: Penanganan Modul Klarifikasi Asisten jika info tidak lengkap
        if (!data.success && data.clarification_needed) {
            showClarificationModule(data, query, vehicle);
            clearRouteFromMap();
            return;
        }

        // Penanganan Kegagalan Layanan Eksternal (NFR & AC 3)
        if (!data.success) {
            clearRouteFromMap();
            showAlert('warning', `<i class="bi bi-exclamation-triangle-fill me-1"></i> ${data.message || 'Gagal memproses rute perjalanan.'}`);
            return;
        }

        // Render hasil rute, info rute, cuaca, dan AI advisor
        renderRoute(data);
    } catch (err) {
        console.error('Error:', err);
        clearRouteFromMap();
        showAlert('danger', '<i class="bi bi-x-circle-fill me-1"></i> Terjadi kesalahan koneksi ke server saat memproses rute.');
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = `<i class="bi bi-search me-1"></i> Analisis Rute & Cuaca`;
    }
}

// Modul Klarifikasi Asisten (FR-06 & AC 2)
function showClarificationModule(data, originalQuery, vehicle) {
    const card = document.getElementById('clarificationCard');
    const msg = document.getElementById('clarificationMessage');
    const label = document.getElementById('clarificationFieldLabel');
    const input = document.getElementById('clarificationInput');

    const extracted = data.extracted || {};
    const dest = extracted.destination || '';
    const origin = extracted.origin || '';

    pendingClarification = {
        originalQuery,
        extracted,
        vehicle,
        missingOrigin: !origin,
        missingDest: !dest
    };

    if (!origin && dest) {
        msg.innerHTML = `Saya mendeteksi tujuan perjalanan Anda ke <strong>"${escapeHtml(dest)}"</strong>, namun <strong>titik awal keberangkatan</strong> belum Anda sebutkan. Mohon lengkapi lokasi asal Anda:`;
        label.innerText = 'Ketik Lokasi Asal Keberangkatan:';
        input.placeholder = 'Contoh: Margonda, Depok atau Stasiun UI';
    } else if (origin && !dest) {
        msg.innerHTML = `Saya mendeteksi titik awal dari <strong>"${escapeHtml(origin)}"</strong>, namun <strong>lokasi tujuan</strong> belum Anda sebutkan. Mau pergi ke mana?`;
        label.innerText = 'Ketik Lokasi Tujuan:';
        input.placeholder = 'Contoh: Tebet Eco Park, Jakarta Selatan';
    } else {
        msg.innerHTML = `${escapeHtml(data.message || 'Mohon lengkapi lokasi asal dan tujuan perjalanan Anda.')}`;
        label.innerText = 'Lengkapi Lokasi:';
        input.placeholder = 'Contoh: Dari Depok ke Monas';
    }

    input.value = '';
    card.style.display = 'block';
    input.focus();
}

function submitClarification() {
    const input = document.getElementById('clarificationInput');
    const val = input.value.trim();

    if (!val) {
        input.focus();
        return;
    }

    if (!pendingClarification) return;

    let newQuery = '';
    const { extracted, vehicle, missingOrigin, missingDest } = pendingClarification;

    if (missingOrigin && extracted.destination) {
        newQuery = `Dari ${val} ke ${extracted.destination} naik ${vehicle}`;
    } else if (missingDest && extracted.origin) {
        newQuery = `Dari ${extracted.origin} ke ${val} naik ${vehicle}`;
    } else {
        newQuery = val;
    }

    document.getElementById('userQuery').value = newQuery;
    document.getElementById('clarificationCard').style.display = 'none';
    submitRoute(newQuery);
}

function dismissClarification() {
    document.getElementById('clarificationCard').style.display = 'none';
    pendingClarification = null;
}

function useCurrentLocationForClarification() {
    const input = document.getElementById('clarificationInput');
    if (navigator.geolocation) {
        input.placeholder = 'Mengambil koordinat GPS...';
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                input.value = `Margonda, Depok (GPS Terdeteksi)`;
            },
            (err) => {
                input.value = 'Depok, Jawa Barat';
            }
        );
    } else {
        input.value = 'Depok, Jawa Barat';
    }
}

function showAlert(type, message) {
    const statusAlert = document.getElementById('statusAlert');
    statusAlert.className = `alert alert-${type} py-2.5 px-3 small rounded-3 border mb-0`;
    statusAlert.innerHTML = message;
    statusAlert.style.display = 'block';
}

function clearRouteFromMap() {
    if (routeLayer && map) {
        map.removeLayer(routeLayer);
        routeLayer = null;
    }
    if (markersLayer) {
        markersLayer.clearLayers();
    }
    document.getElementById('aiAdviceCard').style.display = 'none';
    document.getElementById('routeSummaryCard').style.display = 'none';
    document.getElementById('weatherCardsRow').style.display = 'none';
}

function renderRoute(data) {
    const { route, weather, risk, advice, entities } = data;

    // 1. Tampilkan kartu AI Safety Advice (FR-05) + Ikon Cuaca yang Relevan
    const aiCard = document.getElementById('aiAdviceCard');
    const aiText = document.getElementById('aiAdviceText');
    const riskBadge = document.getElementById('riskBadge');
    const aiWeatherIcon = document.getElementById('aiWeatherIcon');
    const aiWeatherTitle = document.getElementById('aiWeatherConditionTitle');
    const aiWeatherSummary = document.getElementById('aiWeatherConditionSummary');

    aiCard.style.display = 'block';
    aiText.innerText = advice;

    // Tingkat Risiko
    if (risk.risk_level === 'Tinggi') {
        riskBadge.className = 'badge bg-danger rounded-pill px-2.5 py-1 font-monospace';
        riskBadge.innerHTML = '<i class="bi bi-shield-exclamation me-1"></i> Risiko Tinggi (Hujan)';
    } else if (risk.risk_level === 'Sedang') {
        riskBadge.className = 'badge bg-warning text-dark rounded-pill px-2.5 py-1 font-monospace';
        riskBadge.innerHTML = '<i class="bi bi-shield-shaded me-1"></i> Risiko Sedang';
    } else {
        riskBadge.className = 'badge bg-success rounded-pill px-2.5 py-1 font-monospace';
        riskBadge.innerHTML = '<i class="bi bi-shield-check me-1"></i> Kondisi Aman';
    }

    // Ikon Cuaca Relevan (FR-05)
    const iconCode = risk.primary_weather_icon || (weather.midpoint && weather.midpoint.icon) || '01d';
    aiWeatherIcon.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    aiWeatherIcon.style.display = 'block';

    if (risk.rain_detected) {
        aiWeatherTitle.innerText = `Peringatan: Cuaca Basah / Hujan di Jalur`;
        aiWeatherSummary.innerText = `Terdeteksi di: ${risk.rain_locations.join(', ') || 'Titik Tengah'}`;
    } else {
        aiWeatherTitle.innerText = `Kondisi Rute Kondusif`;
        aiWeatherSummary.innerText = `Langit cerah berawan, cocok untuk perjalanan ${entities.vehicle || 'motor'}`;
    }

    // 2. Tampilkan Detail Ringkasan Rute (FR-03)
    document.getElementById('routeSummaryCard').style.display = 'block';
    document.getElementById('originText').innerText = entities.origin || '-';
    document.getElementById('destText').innerText = entities.destination || '-';
    document.getElementById('distText').innerText = `${route.distance_km} km`;
    document.getElementById('durText').innerText = `~${route.duration_min} menit`;
    document.getElementById('vehText').innerText = entities.vehicle === 'mobil' ? 'Mobil Pribadi' : 'Sepeda Motor';

    // 3. Tampilkan 3 Titik Cuaca Spesifik dengan WAKTU ACUAN (FR-04)
    document.getElementById('weatherCardsRow').style.display = 'flex';

    // Titik Awal
    document.getElementById('wOriginName').innerText = entities.origin;
    document.getElementById('wOriginDesc').innerText = weather.origin.description || 'Cerah';
    document.getElementById('wOriginTemp').innerText = weather.origin.temp_c != null ? `${weather.origin.temp_c}°C` : 'N/A';
    document.getElementById('wOriginTime').innerHTML = `<i class="bi bi-clock me-1"></i> Acuan: ${weather.origin.reference_time || 'Real-Time'}`;

    // Titik Tengah
    document.getElementById('wMidName').innerText = (weather.midpoint && weather.midpoint.label) || 'Titik Tengah OSRM';
    document.getElementById('wMidDesc').innerText = weather.midpoint.description || 'Berawan';
    document.getElementById('wMidTemp').innerText = weather.midpoint.temp_c != null ? `${weather.midpoint.temp_c}°C` : 'N/A';
    document.getElementById('wMidTime').innerHTML = `<i class="bi bi-clock me-1"></i> Acuan: ${weather.midpoint.reference_time || 'Real-Time'}`;

    // Titik Akhir
    document.getElementById('wDestName').innerText = entities.destination;
    document.getElementById('wDestDesc').innerText = weather.destination.description || 'Cerah';
    document.getElementById('wDestTemp').innerText = weather.destination.temp_c != null ? `${weather.destination.temp_c}°C` : 'N/A';
    document.getElementById('wDestTime').innerHTML = `<i class="bi bi-clock me-1"></i> Acuan: ${weather.destination.reference_time || 'Real-Time'}`;

    // 4. FR-02: Gambar Rute & Titik Sampel Cuaca di Leaflet Map
    if (routeLayer && map) {
        map.removeLayer(routeLayer);
    }
    markersLayer.clearLayers();

    // Custom Icon Maker
    const createCustomMarker = (bgColor, text) => L.divIcon({
        className: 'custom-leaflet-marker',
        html: `<div style="
            background: ${bgColor};
            color: white;
            font-weight: 800;
            font-size: 11px;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            border: 2.5px solid white;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
        ">${text}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
    });

    // Gambar Polyline
    routeLayer = L.polyline(route.coordinates, {
        color: '#0284C7',
        weight: 5,
        opacity: 0.85
    }).addTo(map);

    // Marker Awal (A - Hijau)
    L.marker([route.origin.lat, route.origin.lon], { icon: createCustomMarker('#10B981', 'A') })
        .bindPopup(`
            <div style="min-width: 140px;">
                <span class="badge bg-success mb-1">Titik Awal</span>
                <div class="fw-bold">${escapeHtml(entities.origin)}</div>
                <div class="small text-muted">${weather.origin.temp_c || 29}°C • ${weather.origin.description}</div>
                <div class="small text-muted mt-1"><i class="bi bi-clock"></i> ${weather.origin.reference_time || '08:00 WIB'}</div>
            </div>
        `)
        .addTo(markersLayer);

    // Marker Tengah (M - Kuning / Oranye Sampling Cuaca)
    if (route.midpoint) {
        L.marker([route.midpoint.lat, route.midpoint.lon], { icon: createCustomMarker('#F59E0B', 'M') })
            .bindPopup(`
                <div style="min-width: 150px;">
                    <span class="badge bg-warning text-dark mb-1">Titik Tengah (Sampling Cuaca)</span>
                    <div class="fw-bold">${weather.midpoint.condition || 'Midpoint'}</div>
                    <div class="small text-muted">${weather.midpoint.temp_c || 28}°C • ${weather.midpoint.description}</div>
                    <div class="small text-muted mt-1"><i class="bi bi-clock"></i> ${weather.midpoint.reference_time || '08:00 WIB'}</div>
                </div>
            `)
            .addTo(markersLayer);
    }

    // Marker Akhir (B - Merah)
    L.marker([route.destination.lat, route.destination.lon], { icon: createCustomMarker('#EF4444', 'B') })
        .bindPopup(`
            <div style="min-width: 140px;">
                <span class="badge bg-danger mb-1">Titik Tujuan</span>
                <div class="fw-bold">${escapeHtml(entities.destination)}</div>
                <div class="small text-muted">${weather.destination.temp_c || 29}°C • ${weather.destination.description}</div>
                <div class="small text-muted mt-1"><i class="bi bi-clock"></i> ${weather.destination.reference_time || '08:00 WIB'}</div>
            </div>
        `)
        .addTo(markersLayer);

    // Zoom peta agar seluruh rute terlihat
    map.fitBounds(routeLayer.getBounds(), { padding: [40, 40] });
}

function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.toString().replace(/[&<>"']/g, m => map[m]);
}
