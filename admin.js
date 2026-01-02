// ===== COMPLETE ADMIN SYSTEM WITH PHOTO UPLOAD =====

// System Configuration
const ADMIN_CONFIG = {
    username: "haylinnhtoo",
    password: "16122005",
    deletePasskey: "confirm12345"
};

// Global Variables
let electionData = {
    settings: {
        title: "Annual King & Queen Election",
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        votingActive: true
    },
    candidates: {
        kings: [],
        queens: []
    }
};

let currentAdmin = null;
let selectedFile = null;
let selectedCandidateId = null;

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    // Check if already logged in
    const isLoggedIn = localStorage.getItem('adminLoggedIn');
    if (isLoggedIn === 'true') {
        currentAdmin = localStorage.getItem('currentAdmin') || 'Administrator';
        showDashboard();
        loadAdminData();
    }
    
    // Setup event listeners
    setupEventListeners();
});

function setupEventListeners() {
    // Login form enter key
    document.getElementById('adminPass')?.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') adminLogin();
    });
    
    // Photo upload
    const photoInput = document.getElementById('photoInput');
    if (photoInput) {
        photoInput.addEventListener('change', handleFileSelect);
    }
    
    // Drag and drop for photo upload
    const uploadBox = document.getElementById('uploadBox');
    if (uploadBox) {
        uploadBox.addEventListener('dragover', handleDragOver);
        uploadBox.addEventListener('dragleave', handleDragLeave);
        uploadBox.addEventListener('drop', handleFileDrop);
    }
}

// ===== LOGIN/LOGOUT =====
function adminLogin() {
    const username = document.getElementById('adminUser')?.value.trim();
    const password = document.getElementById('adminPass')?.value;
    const errorMsg = document.getElementById('loginError');
    
    if (!username || !password) {
        showError('Please enter username and password', errorMsg);
        return;
    }
    
    if (username === ADMIN_CONFIG.username && password === ADMIN_CONFIG.password) {
        currentAdmin = username;
        localStorage.setItem('adminLoggedIn', 'true');
        localStorage.setItem('currentAdmin', username);
        showDashboard();
        loadAdminData();
        showSuccess('Login successful!');
    } else {
        showError('Invalid username or password', errorMsg);
    }
}

function adminLogout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('adminLoggedIn');
        localStorage.removeItem('currentAdmin');
        currentAdmin = null;
        document.getElementById('adminDashboard').style.display = 'none';
        document.getElementById('loginPage').style.display = 'flex';
        document.getElementById('adminUser').value = '';
        document.getElementById('adminPass').value = '';
    }
}

// ===== PAGE NAVIGATION =====
function showDashboard() {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'block';
    document.getElementById('currentAdmin').textContent = currentAdmin;
    showSection('dashboard');
}

function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Remove active class from menu items
    document.querySelectorAll('.sidebar-menu a').forEach(item => {
        item.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(sectionId).classList.add('active');
    
    // Activate menu item
    document.querySelector(`.sidebar-menu a[onclick*="${sectionId}"]`).classList.add('active');
    
    // Load section data
    loadSectionData(sectionId);
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('active');
}

// ===== DATA MANAGEMENT =====
function loadAdminData() {
    // Load election data
    const savedData = localStorage.getItem('electionData');
    if (savedData) {
        electionData = JSON.parse(savedData);
        electionData.settings.startDate = new Date(electionData.settings.startDate);
        electionData.settings.endDate = new Date(electionData.settings.endDate);
    }
    
    // Update UI
    updateDashboard();
    loadCandidates();
    loadSettingsForm();
}

function saveAdminData() {
    localStorage.setItem('electionData', JSON.stringify(electionData));
}

// ===== DASHBOARD =====
function loadSectionData(sectionId) {
    switch(sectionId) {
        case 'dashboard':
            updateDashboard();
            break;
        case 'candidates':
            loadCandidates();
            break;
        case 'photos':
            loadPhotoSection();
            break;
        case 'settings':
            loadSettingsForm();
            break;
    }
}

function updateDashboard() {
    // Update statistics
    document.getElementById('kingCount').textContent = electionData.candidates.kings.length;
    document.getElementById('queenCount').textContent = electionData.candidates.queens.length;
    
    // Calculate total votes
    let totalVotes = 0;
    electionData.candidates.kings.forEach(king => totalVotes += king.votes || 0);
    electionData.candidates.queens.forEach(queen => totalVotes += queen.votes || 0);
    document.getElementById('totalVotes').textContent = totalVotes;
    
    // Update voting status
    const status = electionData.settings.votingActive ? 'Active' : 'Inactive';
    const statusColor = electionData.settings.votingActive ? '#4caf50' : '#f44336';
    document.getElementById('votingStatus').textContent = status;
    document.getElementById('votingStatus').style.color = statusColor;
    document.getElementById('voteStatusText').textContent = status;
    document.getElementById('voteStatusDot').className = electionData.settings.votingActive ? 'status-dot active' : 'status-dot';
    
    // Update toggle button
    const toggleBtn = document.getElementById('toggleVoteBtn');
    if (toggleBtn) {
        toggleBtn.innerHTML = electionData.settings.votingActive ? 
            '<i class="fas fa-pause"></i> Pause Voting' : 
            '<i class="fas fa-play"></i> Start Voting';
    }
}

function toggleVoting() {
    electionData.settings.votingActive = !electionData.settings.votingActive;
    saveAdminData();
    updateDashboard();
    showSuccess(`Voting ${electionData.settings.votingActive ? 'started' : 'paused'} successfully!`);
}

function exportData() {
    const dataStr = JSON.stringify(electionData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `election_data_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    setTimeout(() => URL.revokeObjectURL(url), 100);
    showSuccess('Data exported successfully!');
}

// ===== CANDIDATE MANAGEMENT =====
function loadCandidates() {
    const container = document.getElementById('candidatesList');
    if (!container) return;
    
    const allCandidates = [...electionData.candidates.kings, ...electionData.candidates.queens];
    
    let html = '';
    allCandidates.forEach(candidate => {
        html += `
            <div class="candidate-item">
                <div class="candidate-info">
                    <img src="${candidate.photo || 'https://via.placeholder.com/60'}" 
                         class="candidate-photo"
                         alt="${candidate.name}"
                         onerror="this.src='https://via.placeholder.com/60'">
                    <div class="candidate-details">
                        <h4>${candidate.name}</h4>
                        <p>${candidate.department || ''}</p>
                        <p class="candidate-category">
                            ${candidate.category === 'king' ? '👑 King' : '👸 Queen'}
                            • ${candidate.votes || 0} votes
                        </p>
                    </div>
                </div>
                <div class="candidate-actions">
                    <button class="action-icon photo" onclick="selectCandidateForPhoto('${candidate.id}')" title="Upload Photo">
                        <i class="fas fa-camera"></i>
                    </button>
                    <button class="action-icon delete" onclick="deleteCandidate('${candidate.id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html || '<p class="no-data">No candidates added yet.</p>';
}

function addCandidate() {
    const name = document.getElementById('canName')?.value.trim();
    const department = document.getElementById('canDepartment')?.value.trim();
    const category = document.getElementById('canCategory')?.value;
    const studentId = document.getElementById('canStudentId')?.value.trim();
    const bio = document.getElementById('canBio')?.value.trim();
    
    if (!name || !department || !category) {
        showError('Please fill in all required fields');
        return;
    }
    
    const newCandidate = {
        id: `${category}_${Date.now()}`,
        name: name,
        department: department,
        category: category,
        studentId: studentId || '',
        bio: bio || '',
        photo: '',
        votes: 0,
        addedBy: currentAdmin,
        addedDate: new Date().toISOString()
    };
    
    // Add to appropriate category
    if (category === 'king') {
        electionData.candidates.kings.push(newCandidate);
    } else {
        electionData.candidates.queens.push(newCandidate);
    }
    
    saveAdminData();
    loadCandidates();
    updateDashboard();
    clearForm();
    showSuccess(`Candidate "${name}" added successfully!`);
    
    // Update photo section if open
    if (document.getElementById('photos').classList.contains('active')) {
        loadPhotoSection();
    }
}

function clearForm() {
    document.getElementById('canName').value = '';
    document.getElementById('canDepartment').value = '';
    document.getElementById('canStudentId').value = '';
    document.getElementById('canBio').value = '';
}

function deleteCandidate(candidateId) {
    // Store candidate ID for confirmation
    window.deleteCandidateId = candidateId;
    
    // Show confirmation modal
    document.getElementById('deleteModal').style.display = 'flex';
    
    // Set confirm button action
    document.getElementById('confirmDelete').onclick = function() {
        // Find and remove candidate
        let removed = false;
        
        // Check kings
        const kingIndex = electionData.candidates.kings.findIndex(k => k.id === candidateId);
        if (kingIndex !== -1) {
            electionData.candidates.kings.splice(kingIndex, 1);
            removed = true;
        }
        
        // Check queens
        const queenIndex = electionData.candidates.queens.findIndex(q => q.id === candidateId);
        if (queenIndex !== -1) {
            electionData.candidates.queens.splice(queenIndex, 1);
            removed = true;
        }
        
        if (removed) {
            saveAdminData();
            loadCandidates();
            updateDashboard();
            loadPhotoSection(); // Update photo section
            closeModal();
            showSuccess('Candidate deleted successfully!');
        }
    };
}

function filterCandidates() {
    const filter = document.getElementById('filterCategory').value;
    const items = document.querySelectorAll('.candidate-item');
    
    items.forEach(item => {
        const category = item.querySelector('.candidate-category').textContent.includes('King') ? 'king' : 'queen';
        
        if (filter === 'all' || filter === category) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

// ===== PHOTO UPLOAD =====
function loadPhotoSection() {
    loadCandidateGrid();
    loadCurrentPhotos();
}

function loadCandidateGrid() {
    const grid = document.getElementById('candidateGrid');
    if (!grid) return;
    
    const allCandidates = [...electionData.candidates.kings, ...electionData.candidates.queens];
    
    let html = '';
    allCandidates.forEach(candidate => {
        html += `
            <div class="candidate-option" onclick="selectCandidateForPhoto('${candidate.id}')">
                <img src="${candidate.photo || 'https://via.placeholder.com/80'}" 
                     alt="${candidate.name}"
                     onerror="this.src='https://via.placeholder.com/80'">
                <h4>${candidate.name}</h4>
                <p>${candidate.category === 'king' ? '👑 King' : '👸 Queen'}</p>
                <p>${candidate.department || ''}</p>
            </div>
        `;
    });
    
    grid.innerHTML = html || '<p class="no-data">No candidates available.</p>';
}

function loadCurrentPhotos() {
    const grid = document.getElementById('photosGrid');
    if (!grid) return;
    
    const allCandidates = [...electionData.candidates.kings, ...electionData.candidates.queens];
    
    let html = '';
    allCandidates.forEach(candidate => {
        if (candidate.photo) {
            html += `
                <div class="photo-item">
                    <img src="${candidate.photo}" 
                         alt="${candidate.name}"
                         onerror="this.src='https://via.placeholder.com/100'">
                    <h4>${candidate.name}</h4>
                    <p>${candidate.category === 'king' ? '👑 King' : '👸 Queen'}</p>
                    <button class="btn-secondary small" onclick="selectCandidateForPhoto('${candidate.id}')">
                        <i class="fas fa-edit"></i> Change
                    </button>
                </div>
            `;
        }
    });
    
    grid.innerHTML = html || '<p class="no-data">No photos uploaded yet.</p>';
}

function selectCandidateForPhoto(candidateId) {
    selectedCandidateId = candidateId;
    
    // Find candidate
    const candidate = [...electionData.candidates.kings, ...electionData.candidates.queens]
        .find(c => c.id === candidateId);
    
    if (!candidate) return;
    
    // Update selected candidate display
    document.getElementById('selectedCandidate').style.display = 'block';
    document.getElementById('selectedPhoto').src = candidate.photo || 'https://via.placeholder.com/80';
    document.getElementById('selectedPhoto').onerror = function() {
        this.src = 'https://via.placeholder.com/80';
    };
    document.getElementById('selectedName').textContent = candidate.name;
    document.getElementById('selectedCategory').textContent = candidate.category === 'king' ? '👑 King' : '👸 Queen';
    document.getElementById('selectedDept').textContent = candidate.department || '';
    
    // Enable upload button if file is selected
    const uploadBtn = document.getElementById('uploadPhotoBtn');
    if (uploadBtn && selectedFile) {
        uploadBtn.disabled = false;
    }
    
    // Highlight selected candidate in grid
    document.querySelectorAll('.candidate-option').forEach(option => {
        option.classList.remove('selected');
    });
    
    const selectedOption = document.querySelector(`.candidate-option[onclick*="${candidateId}"]`);
    if (selectedOption) {
        selectedOption.classList.add('selected');
    }
}

// File handling functions
function handleFileSelect(event) {
    const file = event.target.files[0];
    processSelectedFile(file);
}

function handleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    document.getElementById('uploadBox').style.borderColor = '#2196f3';
    document.getElementById('uploadBox').style.background = '#e3f2fd';
}

function handleDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();
    document.getElementById('uploadBox').style.borderColor = '#bdbdbd';
    document.getElementById('uploadBox').style.background = '#fafafa';
}

function handleFileDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    handleDragLeave(event);
    
    const file = event.dataTransfer.files[0];
    processSelectedFile(file);
}

function processSelectedFile(file) {
    if (!file) return;
    
    // Check if file is an image
    if (!file.type.startsWith('image/')) {
        showError('Please select an image file (JPG, PNG, GIF, etc.)');
        return;
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showError('Image size should be less than 5MB');
        return;
    }
    
    selectedFile = file;
    
    // Show preview
    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById('photoPreview');
        const previewImg = document.getElementById('previewImg');
        const fileName = document.getElementById('fileName');
        const fileSize = document.getElementById('fileSize');
        const fileType = document.getElementById('fileType');
        
        if (preview && previewImg && fileName && fileSize && fileType) {
            previewImg.src = e.target.result;
            fileName.textContent = file.name;
            fileSize.textContent = formatFileSize(file.size);
            fileType.textContent = file.type;
            preview.style.display = 'block';
            
            // Enable upload button if candidate is selected
            const uploadBtn = document.getElementById('uploadPhotoBtn');
            if (uploadBtn && selectedCandidateId) {
                uploadBtn.disabled = false;
            }
        }
    };
    reader.readAsDataURL(file);
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function clearPreview() {
    selectedFile = null;
    document.getElementById('photoPreview').style.display = 'none';
    document.getElementById('photoInput').value = '';
    document.getElementById('uploadPhotoBtn').disabled = true;
}

function uploadPhoto() {
    if (!selectedFile || !selectedCandidateId) {
        showError('Please select both a photo and a candidate');
        return;
    }
    
    // Convert image to base64
    const reader = new FileReader();
    reader.onload = function(e) {
        const base64Image = e.target.result;
        
        // Find candidate and update photo
        let candidate = electionData.candidates.kings.find(k => k.id === selectedCandidateId);
        if (!candidate) {
            candidate = electionData.candidates.queens.find(q => q.id === selectedCandidateId);
        }
        
        if (candidate) {
            candidate.photo = base64Image;
            saveAdminData();
            
            // Update UI
            loadCandidates();
            loadCurrentPhotos();
            loadCandidateGrid();
            clearPreview();
            
            // Update selected candidate display
            document.getElementById('selectedPhoto').src = base64Image;
            
            showSuccess(`Photo uploaded for ${candidate.name}!`);
        }
    };
    reader.readAsDataURL(selectedFile);
}

// ===== SETTINGS =====
function loadSettingsForm() {
    const settings = electionData.settings;
    
    document.getElementById('electionTitle').value = settings.title || '';
    
    // Format dates for datetime-local input
    const startDate = new Date(settings.startDate);
    const endDate = new Date(settings.endDate);
    
    document.getElementById('startDate').value = formatDateTimeLocal(startDate);
    document.getElementById('endDate').value = formatDateTimeLocal(endDate);
    
    document.getElementById('deletePasskey').value = ADMIN_CONFIG.deletePasskey;
}

function formatDateTimeLocal(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function saveSettings() {
    electionData.settings.title = document.getElementById('electionTitle').value.trim();
    electionData.settings.startDate = new Date(document.getElementById('startDate').value).toISOString();
    electionData.settings.endDate = new Date(document.getElementById('endDate').value).toISOString();
    
    saveAdminData();
    showSuccess('Settings saved successfully!');
}

function togglePasskey() {
    const passkeyInput = document.getElementById('deletePasskey');
    const showBtn = passkeyInput.nextElementSibling;
    
    if (passkeyInput.type === 'password') {
        passkeyInput.type = 'text';
        showBtn.innerHTML = '<i class="fas fa-eye-slash"></i>';
    } else {
        passkeyInput.type = 'password';
        showBtn.innerHTML = '<i class="fas fa-eye"></i>';
    }
}

function changePasskey() {
    const newPasskey = document.getElementById('newPasskey')?.value;
    const confirmPasskey = document.getElementById('confirmPasskey')?.value;
    
    if (!newPasskey || !confirmPasskey) {
        showError('Please enter and confirm new passkey');
        return;
    }
    
    if (newPasskey !== confirmPasskey) {
        showError('Passkeys do not match');
        return;
    }
    
    if (newPasskey.length < 6) {
        showError('Passkey must be at least 6 characters');
        return;
    }
    
    ADMIN_CONFIG.deletePasskey = newPasskey;
    document.getElementById('deletePasskey').value = newPasskey;
    document.getElementById('newPasskey').value = '';
    document.getElementById('confirmPasskey').value = '';
    
    showSuccess('Passkey changed successfully!');
}

function backupData() {
    exportData(); // Reuse export function for backup
}

function resetVotes() {
    if (!confirm('Reset all votes? This cannot be undone.')) return;
    
    electionData.candidates.kings.forEach(king => king.votes = 0);
    electionData.candidates.queens.forEach(queen => queen.votes = 0);
    
    saveAdminData();
    updateDashboard();
    loadCandidates();
    showSuccess('All votes have been reset!');
}

function clearAllData() {
    if (!confirm('WARNING: This will delete ALL data including candidates and settings. This action cannot be undone. Are you sure?')) return;
    
    electionData = {
        settings: {
            title: "Annual King & Queen Election",
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            votingActive: true
        },
        candidates: {
            kings: [],
            queens: []
        }
    };
    
    saveAdminData();
    updateDashboard();
    loadCandidates();
    loadPhotoSection();
    loadSettingsForm();
    showSuccess('All data cleared!');
}

// ===== MODAL FUNCTIONS =====
function closeModal() {
    document.getElementById('deleteModal').style.display = 'none';
    window.deleteCandidateId = null;
}

function closeSuccessModal() {
    document.getElementById('successModal').style.display = 'none';
}

// ===== UTILITY FUNCTIONS =====
function showSuccess(message) {
    document.getElementById('successMessage').textContent = message;
    document.getElementById('successModal').style.display = 'flex';
    
    // Auto close after 3 seconds
    setTimeout(closeSuccessModal, 3000);
}

function showError(message, element = null) {
    if (element) {
        element.textContent = message;
        element.style.color = '#f44336';
        element.style.animation = 'shake 0.5s';
        setTimeout(() => element.style.animation = '', 500);
    } else {
        alert(message);
    }
}

// Add shake animation
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
    
    .no-data {
        text-align: center;
        padding: 40px;
        color: #757575;
        font-style: italic;
    }
    
    .small {
        padding: 6px 12px;
        font-size: 0.85rem;
    }
`;
document.head.appendChild(style);