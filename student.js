// student.js

// *** PASTE YOUR SUPABASE DETAILS HERE ***
const SUPABASE_URL = 'https://YOUR_UNIQUE_ID.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_LONG_ANON_PUBLIC_KEY';
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

async function handleScanResult(data) {
    stopScanner();
    const rollNo = sessionStorage.getItem('loggedInStudentRoll');
    if (!rollNo) {
        alert("Login error. Please refresh and log in again.");
        return;
    }

    // This is our simple, static check
    if (data !== "CS101-ATTENDANCE-CODE") {
        scanResultEl.textContent = 'Invalid QR Code scanned. Please scan the code from the board.';
        scanResultEl.className = 'result-error';
        return;
    }

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
