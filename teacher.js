// teacher.js

// *** PASTE YOUR SUPABASE DETAILS HERE ***
const SUPABASE_URL = 'https://hrshatipygqtlqtjkozm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhyc2hhdGlweWdxdGxxdGprb3ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2Njc5MDIsImV4cCI6MjA3NTI0MzkwMn0.KKzsKiBOO9AlQqX-ickVMBA9qXexF-cgiVeMVFcF26M';
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- DOM Elements ---
const qrcodeEl = document.getElementById('qrcode');
const timerEl = document.getElementById('timer'); // Make sure you have this in teacher.html
const viewReportBtn = document.getElementById('view-report-btn');
const summaryContainer = document.getElementById('summary-container');
const absentListEl = document.getElementById('absent-list');
const totalPresentEl = document.getElementById('total-present');
const totalAbsentEl = document.getElementById('total-absent');

const CODE_REFRESH_INTERVAL = 15; // seconds
let countdown = CODE_REFRESH_INTERVAL;
let qrCodeInstance = null; // To hold the QRCode.js instance

/**
 * Generates a unique, time-stamped code and displays it as a QR code.
 */
function generateAndDisplayQRCode() {
    // 1. Generate a new code with the current timestamp embedded
    const newCode = `CS101-ATTENDANCE|${Date.now()}`;
    
    // 2. Clear the old QR code and display the new one
    qrcodeEl.innerHTML = ''; // Clear previous QR code
    qrCodeInstance = new QRCode(qrcodeEl, {
        text: newCode,
        width: 256,
        height: 256,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });
}

/**
 * Manages the countdown timer and triggers QR code regeneration.
 */
function startTimer() {
    // Add the timer element if it's missing from the HTML for some reason
    if (!timerEl) {
        const p = document.createElement('p');
        p.id = 'timer';
        qrcodeEl.insertAdjacentElement('afterend', p);
    }

    setInterval(() => {
        countdown--;
        timerEl.textContent = `New code in ${countdown} seconds...`;
        if (countdown <= 0) {
            countdown = CODE_REFRESH_INTERVAL; // Reset timer
            generateAndDisplayQRCode();
        }
    }, 1000); // Run every second
}


// --- Initial Page Load ---
document.addEventListener('DOMContentLoaded', () => {
    generateAndDisplayQRCode(); // Generate the first QR code immediately
    startTimer(); // Start the 15-second refresh cycle
});


// --- Report Logic (Unchanged)---
const classRoster = [];
for (let i = 1; i <= 78; i++) {
    classRoster.push({ rollNo: i.toString() });
}

viewReportBtn.addEventListener('click', async () => {
    viewReportBtn.textContent = 'Loading Report...';
    viewReportBtn.disabled = true;

    const { data: presentRecords, error } = await db.from('records').select('roll_no');

    if (error) {
        alert('Error fetching report. Check the console.');
        console.error('Fetch error:', error);
        return;
    }

    const presentRollNos = presentRecords.map(rec => rec.roll_no);
    const absentStudents = classRoster.filter(student => !presentRollNos.includes(student.rollNo));
    const absentRollNos = absentStudents.map(student => student.rollNo);

    totalPresentEl.textContent = presentRollNos.length;
    totalAbsentEl.textContent = absentRollNos.length;
    
    if (absentRollNos.length === 0) {
        absentListEl.textContent = 'Everyone is present!';
    } else {
        absentListEl.textContent = absentRollNos.join(', ');
    }

    summaryContainer.style.display = 'block';
    viewReportBtn.style.display = 'none';
});
