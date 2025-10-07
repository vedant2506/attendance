// teacher.js

// *** PASTE YOUR SUPABASE DETAILS HERE ***
const SUPABASE_URL = 'https://hrshatipygqtlqtjkozm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhyc2hhdGlweWdxdGxxdGprb3ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2Njc5MDIsImV4cCI6MjA3NTI0MzkwMn0.KKzsKiBOO9AlQqX-ickVMBA9qXexF-cgiVeMVFcF26M';
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- DOM Elements ---
// We will define these inside the DOMContentLoaded listener to ensure they exist.
let qrcodeEl, timerEl, viewReportBtn, summaryContainer, absentListEl, totalPresentEl, totalAbsentEl;

const CODE_REFRESH_INTERVAL = 15; // seconds
let countdown = CODE_REFRESH_INTERVAL;
let qrCodeInstance = null; 

/**
 * Generates a unique, time-stamped code and displays it as a QR code.
 */
function generateAndDisplayQRCode() {
    const newCode = `CS101-ATTENDANCE|${Date.now()}`;
    
    // Clear the old QR code and display the new one
    if (qrcodeEl) {
        qrcodeEl.innerHTML = ''; 
        qrCodeInstance = new QRCode(qrcodeEl, {
            text: newCode,
            width: 256,
            height: 256,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
    }
}

/**
 * Manages the countdown timer and triggers QR code regeneration.
 */
function startTimer() {
    setInterval(() => {
        countdown--;
        // Check if timerEl exists before trying to use it
        if (timerEl) {
            timerEl.textContent = `New code in ${countdown} seconds...`;
        }
        if (countdown <= 0) {
            countdown = CODE_REFRESH_INTERVAL; // Reset timer
            generateAndDisplayQRCode();
        }
    }, 1000); // Run every second
}

// --- Initial Page Load ---
// Use DOMContentLoaded to make sure the HTML is fully loaded before running script
document.addEventListener('DOMContentLoaded', () => {
    // Now, it's safe to get the elements
    qrcodeEl = document.getElementById('qrcode');
    timerEl = document.getElementById('timer');
    viewReportBtn = document.getElementById('view-report-btn');
    summaryContainer = document.getElementById('summary-container');
    absentListEl = document.getElementById('absent-list');
    totalPresentEl = document.getElementById('total-present');
    totalAbsentEl = document.getElementById('total-absent');

    // Attach event listeners here
    viewReportBtn.addEventListener('click', showReport);

    // Start the QR code logic
    generateAndDisplayQRCode(); // Generate the first QR code immediately
    startTimer(); // Start the 15-second refresh cycle
});

// --- Report Logic ---
const classRoster = [];
for (let i = 1; i <= 78; i++) {
    classRoster.push({ rollNo: i.toString() });
}

async function showReport() {
    viewReportBtn.textContent = 'Loading Report...';
    viewReportBtn.disabled = true;

    const { data: presentRecords, error } = await db.from('records').select('roll_no');

    if (error) {
        alert('Error fetching report. Check the console.');
        console.error('Fetch error:', error);
        viewReportBtn.textContent = 'View Attendance Report';
        viewReportBtn.disabled = false;
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
}
