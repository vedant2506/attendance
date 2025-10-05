// teacher.js

// *** PASTE YOUR SUPABASE DETAILS HERE ***
const SUPABASE_URL = 'https://hrshatipygqtlqtjkozm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhyc2hhdGlweWdxdGxxdGprb3ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2Njc5MDIsImV4cCI6MjA3NTI0MzkwMn0.KKzsKiBOO9AlQqX-ickVMBA9qXexF-cgiVeMVFcF26M';
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- DOM Elements ---
const qrcodeEl = document.getElementById('qrcode');
const viewReportBtn = document.getElementById('view-report-btn');
const summaryContainer = document.getElementById('summary-container');
const absentListEl = document.getElementById('absent-list');
const totalPresentEl = document.getElementById('total-present');
const totalAbsentEl = document.getElementById('total-absent');

// The simple, static data for the QR code
const qrData = "CS101-ATTENDANCE-CODE";

// Generate the QR code as soon as the page loads
new QRCode(qrcodeEl, { text: qrData, width: 256, height: 256 });

const classRoster = [];
for (let i = 1; i <= 78; i++) {
    classRoster.push({ rollNo: i.toString() });
}

// --- Report Logic ---
viewReportBtn.addEventListener('click', async () => {
    viewReportBtn.textContent = 'Loading Report...';
    viewReportBtn.disabled = true;

    // Fetch all records from the database
    const { data: presentRecords, error } = await db.from('records').select('roll_no');

    if (error) {
        alert('Error fetching report. Check the console.');
        console.error('Fetch error:', error);
        return;
    }

    const presentRollNos = presentRecords.map(rec => rec.roll_no);
    const absentStudents = classRoster.filter(student => !presentRollNos.includes(student.rollNo));
    const absentRollNos = absentStudents.map(student => student.rollNo);

    // Display the results
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
