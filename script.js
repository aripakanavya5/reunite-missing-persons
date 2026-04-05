// --- Data Initializer ---
let currentUser = JSON.parse(localStorage.getItem('reunite_user')) || null;
let reports = JSON.parse(localStorage.getItem('reunite_reports')) || [
    { id: 1, name: "John Doe", age: 25, loc: "New York", status: "Missing", img: "https://i.pravatar.cc/300?u=1" },
    { id: 2, name: "Jane Smith", age: 30, loc: "London", status: "Investigating", img: "https://i.pravatar.cc/300?u=2" }
];
let notifications = JSON.parse(localStorage.getItem('reunite_notifs')) || [
    { text: "Welcome to ReUnite!", date: new Date().toLocaleDateString() }
];

// --- Auth Logic ---
let isLoginMode = true;

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    document.getElementById('auth-title').innerText = isLoginMode ? "Login to ReUnite" : "Create Account";
    document.getElementById('name-group').style.display = isLoginMode ? "none" : "block";
    document.getElementById('role-group').style.display = isLoginMode ? "none" : "block";
    document.getElementById('auth-submit').innerText = isLoginMode ? "Login" : "Sign Up";
    document.getElementById('auth-toggle-text').innerText = isLoginMode ? "Don't have an account? Sign Up" : "Already have an account? Login";
}

document.getElementById('auth-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('auth-email').value;
    const name = document.getElementById('auth-name').value;
    const role = document.getElementById('auth-role').value;

    currentUser = { 
        email, 
        name: isLoginMode ? email.split('@')[0] : name, 
        role: isLoginMode ? (email.includes('agent') ? 'Agent' : 'User') : role 
    };

    localStorage.setItem('reunite_user', JSON.stringify(currentUser));
    initApp();
});

function logout() {
    localStorage.removeItem('reunite_user');
    location.reload();
}

// --- Navigation ---
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    document.getElementById(`page-${pageId}`).classList.remove('hidden');
    
    if(pageId === 'search') renderSearch();
    if(pageId === 'community') renderCommunity();
    if(pageId === 'profile') renderProfile();
    if(pageId === 'notifications') renderNotifications();
}

// --- Core Functionality ---
function initApp() {
    if (currentUser) {
        document.getElementById('page-auth').classList.add('hidden');
        document.getElementById('main-nav').classList.remove('hidden');
        showPage('home');
        
        // Role based UI
        if(currentUser.role === 'Agent') {
            document.getElementById('nav-community').classList.remove('hidden');
            document.getElementById('nav-report').classList.add('hidden');
        }
    }
}

function renderSearch(data = reports) {
    const grid = document.getElementById('search-results');
    grid.innerHTML = data.map(item => `
        <div class="card" onclick="openModal(${item.id})">
            <img src="${item.img}" alt="${item.name}">
            <div class="card-info">
                <h3>${item.name}</h3>
                <p>Age: ${item.age} | ${item.loc}</p>
                <span class="badge">${item.status}</span>
            </div>
        </div>
    `).join('');
}

function filterSearch() {
    const term = document.getElementById('search-input').value.toLowerCase();
    const filtered = reports.filter(r => 
        r.name.toLowerCase().includes(term) || r.loc.toLowerCase().includes(term)
    );
    renderSearch(filtered);
}

// --- AI Mock Features ---
function handleImageUpload(event) {
    const status = document.getElementById('ai-status');
    const preview = document.getElementById('img-preview');
    status.innerHTML = "Scanning for faces... 🔍";
    
    setTimeout(() => {
        status.innerHTML = "Face Detected ✅ (Confidence: 98%)";
        status.style.color = "green";
        const reader = new FileReader();
        reader.onload = e => { preview.src = e.target.result; preview.classList.remove('hidden'); };
        reader.readAsDataURL(event.target.files[0]);
    }, 1500);
}

function runSketchAI() {
    const sketchInput = document.getElementById('sketch-upload');
    if(!sketchInput.files[0]) return alert("Please upload a sketch");

    const resultBox = document.getElementById('sketch-result');
    const before = document.getElementById('sketch-before');
    const after = document.getElementById('sketch-after');

    resultBox.classList.remove('hidden');
    before.src = URL.createObjectURL(sketchInput.files[0]);
    after.src = "https://i.pravatar.cc/300?u=sketch-demo"; // Placeholder for AI output
    alert("AI Transformation Complete!");
}

// --- Reporting & Payment ---
function processPayment() {
    alert("Redirecting to Secure Payment Gateway...");
    setTimeout(() => {
        const newReport = {
            id: Date.now(),
            name: document.getElementById('rep-name').value,
            age: document.getElementById('rep-age').value,
            loc: document.getElementById('rep-loc').value,
            status: "Reported",
            img: document.getElementById('img-preview').src || "https://via.placeholder.com/300",
            reportedBy: currentUser.email
        };
        
        reports.push(newReport);
        localStorage.setItem('reunite_reports', JSON.stringify(reports));
        
        notifications.unshift({ text: `Success! Report for ${newReport.name} has been filed.`, date: new Date().toLocaleDateString() });
        localStorage.setItem('reunite_notifs', JSON.stringify(notifications));

        alert("Payment Successful! Case Reported.");
        showPage('home');
    }, 1000);
}

// --- Agent Logic ---
function renderCommunity() {
    const container = document.getElementById('agent-cases');
    container.innerHTML = reports.map(r => `
        <div class="card">
            <div class="card-info">
                <h3>${r.name}</h3>
                <p>Location: ${r.loc}</p>
                <p>Reward: <span style="color:gold">★ Bonus $50</span></p>
                <button class="btn-primary" onclick="acceptCase(${r.id})">Accept Case</button>
            </div>
        </div>
    `).join('');
}

function acceptCase(id) {
    alert("Case accepted! You are now the primary agent for this file.");
}

// --- Profile & Notifications ---
function renderProfile() {
    document.getElementById('prof-name').innerText = currentUser.name;
    document.getElementById('prof-email').innerText = currentUser.email;
    document.getElementById('prof-role').innerText = currentUser.role;
    
    const myReports = reports.filter(r => r.reportedBy === currentUser.email);
    document.getElementById('my-reports').innerHTML = myReports.length ? 
        myReports.map(r => `<p>• ${r.name} (${r.status})</p>`).join('') : "<p>No reports filed yet.</p>";
}

function renderNotifications() {
    document.getElementById('notif-list').innerHTML = notifications.map(n => `
        <div style="background:white; padding:15px; margin-bottom:10px; border-left:5px solid var(--secondary)">
            <p>${n.text}</p>
            <small>${n.date}</small>
        </div>
    `).join('');
}

// --- Modal ---
function openModal(id) {
    const item = reports.find(r => r.id === id);
    const modal = document.getElementById('modal');
    document.getElementById('modal-body').innerHTML = `
        <img src="${item.img}" style="width:100%; border-radius:10px">
        <h2>${item.name}</h2>
        <p><strong>Age:</strong> ${item.age}</p>
        <p><strong>Last Seen:</strong> ${item.loc}</p>
        <p><strong>Status:</strong> ${item.status}</p>
        <p>This information is verified by ReUnite Law Enforcement Partners.</p>
    `;
    modal.classList.remove('hidden');
}

function closeModal() {
    document.getElementById('modal').classList.add('hidden');
}

// Start
initApp();
