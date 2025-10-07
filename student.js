// student.js

// *** PASTE YOUR SUPABASE DETAILS HERE ***
const SUPABASE_URL = 'https://hrshatipygqtlqtjkozm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhyc2hhdGlweWdxdGxxdGprb3ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2Njc5MDIsImV4cCI6MjA3NTI0MzkwMn0.KKzsKiBOO9AlQqX-ickVMBA9qXexF-cgiVeMVFcF26M';
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- DOM Elements ---
const studentLoginView = document.getElementById('student-login-view');
const studentRollInput = document.getElementById('student-roll-input');
const studentLoginBtn = document.getElementById('student-login-btn');
const studentDashboard = document.getElementById('student-dashboard');
const loggedInStudentEl = document.getElementById('logged-in-student');
const scanBtn = document.getElementById('scan-btn');
const scannerContainer = document.getElementById('scanner-container');
const videoEl = document.getElementById('scanner-video');
const scanResultEl = document.getElementById('scan-result');

const classRoster = [];
for (let i = 1; i <= 78; i++) {
    classRoster.push({ rollNo: i.toString() });
}

// --- Student Login ---
studentLoginBtn.addEventListener('click', () => {
    const rollNo = studentRollInput.value.trim();
    if (classRoster.some(s => s.rollNo === rollNo)) {
        sessionStorage.setItem('loggedInStudentRoll', rollNo);
        studentLoginView.style.display = 'none';
        studentDashboard.style.display = 'block';
        loggedInStudentEl.textContent = `Logged in as Roll No: ${rollNo}`;
    } else {
        alert('Invalid Roll Number (1-78).');
    }
});

// --- QR Scanning ---
scanBtn.addEventListener('click', startScanner);

async function handleScanResult(scannedData) {
    stopScanner();
    const rollNo = sessionStorage.getItem('loggedInStudentRoll');
    if (!rollNo) {
        alert("Login error. Please refresh and log in again.");
        return;
    }

    // --- NEW: TIME-BASED QR CODE VALIDATION ---
    const VALIDITY_PERIOD_MS = 17000; // 17 seconds (gives a 2-second buffer)
    const parts = scannedData.split('|');

    // 1. Check if the code format is correct
    if (parts.length !== 2 || parts[0] !== 'CS101-ATTENDANCE') {
        scanResultEl.textContent = 'Invalid QR Code. Please scan the code from the board.';
        scanResultEl.className = 'result-error';
        return;
    }

    // 2. Check if the code has expired
    const qrTimestamp = parseInt(parts[1], 10);
    const codeAge = Date.now() - qrTimestamp;

    if (isNaN(qrTimestamp) || codeAge > VALIDITY_PERIOD_MS) {
        scanResultEl.textContent = 'Expired QR Code. Please scan the new code from the board.';
        scanResultEl.className = 'result-error';
        return;
    }
    // --- END NEW VALIDATION ---


    // Check if already marked present
    const { data: existing, error: checkError } = await db.from('records').select().eq('roll_no', rollNo);
    if (existing && existing.length > 0) {
        scanResultEl.textContent = `You are already marked present, Roll No: ${rollNo}.`;
        scanResultEl.className = 'result-success';
        return;
    }

    // Save to database
    const { error } = await db.from('records').insert({ roll_no: rollNo });

    if (error) {
        console.error('Error saving attendance:', error);
        scanResultEl.textContent = 'Error saving attendance. Please try again.';
        scanResultEl.className = 'result-error';
    } else {
        scanResultEl.textContent = `Success, Roll No: ${rollNo}! You are marked present.`;
        scanResultEl.className = 'result-success';
    }
}

// --- Helper Functions (unchanged) ---
function startScanner() {
    scannerContainer.style.display = 'block';
    scanBtn.style.display = 'none';
    scanResultEl.textContent = 'Point camera at the QR code...';
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(stream => {
            videoEl.srcObject = stream;
            videoEl.play();
            requestAnimationFrame(tick);
        }).catch(err => {
            console.error("Camera Error:", err);
            scanResultEl.textContent = 'Could not access camera.';
        });
}

function stopScanner() {
    if (videoEl.srcObject) {
        videoEl.srcObject.getTracks().forEach(track => track.stop());
    }
    scannerContainer.style.display = 'none';
    scanBtn.style.display = 'block';
}

function tick() {
    if (videoEl.readyState === videoEl.HAVE_ENOUGH_DATA) {
        const canvas = document.createElement('canvas');
        canvas.width = videoEl.videoWidth;
        canvas.height = videoEl.videoHeight;
        canvas.getContext('2d').drawImage(videoEl, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code) {
            handleScanResult(code.data);
            return;
        }
    }
    requestAnimationFrame(tick);
}
