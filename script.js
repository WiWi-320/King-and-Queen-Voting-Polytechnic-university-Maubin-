// ===== POLYTECHNIC UNIVERSITY VOTING SYSTEM =====
// For Students - index.html

// ===== SYSTEM INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    initializeVotingSystem();
});

function initializeVotingSystem() {
    // Load data from localStorage
    loadSystemData();
    
    // Set up event listeners
    setupEventListeners();
    
    // Initialize page display
    initializePageDisplay();
    
    // Start countdown timer
    startVotingTimer();
}

// ===== DATA MANAGEMENT =====
function loadSystemData() {
    // Load election settings
    const savedSettings = localStorage.getItem('electionSettings');
    if (savedSettings) {
        SYSTEM_CONFIG = JSON.parse(savedSettings);
        SYSTEM_CONFIG.votingEndTime = new Date(SYSTEM_CONFIG.votingEndTime);
    }
    
    // Load candidates
    const savedCandidates = localStorage.getItem('kingQueenCandidates');
    if (savedCandidates) {
        candidates = JSON.parse(savedCandidates);
    }
    
    // Load user voting status
    const userState = localStorage.getItem('userVotingState');
    if (userState) {
        currentUser = JSON.parse(userState);
    }
}

function saveSystemData() {
    localStorage.setItem('kingQueenCandidates', JSON.stringify(candidates));
    localStorage.setItem('userVotingState', JSON.stringify(currentUser));
}

// ===== PAGE INITIALIZATION =====
function initializePageDisplay() {
    // Check if user has voted
    if (currentUser.hasVoted) {
        disableVotingButtons();
        updateVotedDisplay();
    }
    
    // Render candidates
    renderAllCandidates();
    
    // Update statistics
    updateStatistics();
    
    // Initialize animation sequence
    initializeWelcomeAnimation();
}

function setupEventListeners() {
    // Setup modal close buttons
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        const closeBtn = modal.querySelector('.close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                modal.style.display = 'none';
            });
        }
    });
    
    // Close modal when clicking outside
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.style.display = 'none';
            }
        });
    });
}

// ===== CANDIDATE DISPLAY =====
function renderAllCandidates() {
    renderCandidatesByCategory('king');
    renderCandidatesByCategory('queen');
}

function renderCandidatesByCategory(category) {
    const container = document.getElementById(category + 'Candidates');
    if (!container) return;
    
    container.innerHTML = '';
    
    const categoryCandidates = candidates[category + 's'] || [];
    
    categoryCandidates.forEach(candidate => {
        const card = createCandidateCard(candidate);
        container.appendChild(card);
    });
}

function createCandidateCard(candidate) {
    const card = document.createElement('div');
    card.className = 'candidate-card ' + candidate.category + '-candidate';
    card.dataset.id = candidate.id;
    card.dataset.category = candidate.category;
    
    // Check if user voted for this candidate
    const hasVotedForThis = currentUser.votedFor.includes(candidate.id);
    const isVoted = currentUser.hasVoted;
    
    card.innerHTML = `
        <div class="candidate-photo-container">
            <img src="${candidate.photo || 'https://via.placeholder.com/150'}" 
                 alt="${candidate.name}" 
                 class="candidate-photo"
                 onerror="this.src='https://via.placeholder.com/150'">
        </div>
        <div class="candidate-info">
            <h3 class="candidate-name">${candidate.name}</h3>
            <p class="candidate-department">${candidate.department || ''}</p>
            <div class="candidate-votes">
                <span class="vote-count">${candidate.votes || 0} votes</span>
            </div>
        </div>
        <button class="vote-btn ${hasVotedForThis ? 'voted' : ''} ${isVoted ? 'disabled' : ''}"
                onclick="handleVoteClick('${candidate.id}', '${candidate.category}')"
                ${isVoted ? 'disabled' : ''}>
            ${hasVotedForThis ? '✓ Voted' : 'Vote Now'}
        </button>
    `;
    
    return card;
}

// ===== VOTING LOGIC =====
function handleVoteClick(candidateId, category) {
    if (!SYSTEM_CONFIG.votingActive) {
        showMessage('Voting is currently closed.', 'error');
        return;
    }
    
    if (currentUser.hasVoted) {
        showAlreadyVotedModal();
        return;
    }
    
    const candidate = findCandidate(candidateId, category);
    if (!candidate) return;
    
    currentCandidateToVote = candidate;
    showVoteConfirmationModal();
}

function findCandidate(candidateId, category) {
    const categoryList = candidates[category + 's'] || [];
    return categoryList.find(c => c.id === candidateId);
}

function showVoteConfirmationModal() {
    if (!currentCandidateToVote) return;
    
    const modal = document.getElementById('voteModal');
    const confirmDiv = document.getElementById('confirmCandidate');
    
    confirmDiv.innerHTML = `
        <div class="candidate-confirm-display">
            <img src="${currentCandidateToVote.photo || 'https://via.placeholder.com/150'}" 
                 alt="${currentCandidateToVote.name}"
                 class="confirm-photo">
            <div class="confirm-details">
                <h4>${currentCandidateToVote.name}</h4>
                <p>${currentCandidateToVote.department || ''}</p>
                <div class="candidate-category">
                    ${currentCandidateToVote.category === 'king' ? '👑 King' : '👸 Queen'}
                </div>
            </div>
        </div>
    `;
    
    modal.style.display = 'flex';
}

function closeVoteModal() {
    document.getElementById('voteModal').style.display = 'none';
    currentCandidateToVote = null;
}

function submitVote() {
    if (!currentCandidateToVote || !SYSTEM_CONFIG.votingActive) {
        showMessage('Unable to process vote.', 'error');
        return;
    }
    
    // Update candidate votes
    const category = currentCandidateToVote.category;
    const candidateIndex = candidates[category + 's'].findIndex(
        c => c.id === currentCandidateToVote.id
    );
    
    if (candidateIndex !== -1) {
        candidates[category + 's'][candidateIndex].votes = 
            (candidates[category + 's'][candidateIndex].votes || 0) + 1;
    }
    
    // Update user state
    currentUser.hasVoted = true;
    currentUser.votedFor.push(currentCandidateToVote.id);
    currentUser.voteTime = new Date().toISOString();
    
    // Save data
    saveSystemData();
    
    // Update UI
    renderAllCandidates();
    updateStatistics();
    disableVotingButtons();
    
    // Close modal and show success
    closeVoteModal();
    setTimeout(showVoteSuccessModal, 300);
}

function showVoteSuccessModal() {
    const modal = document.getElementById('votedModal');
    const detailsDiv = document.getElementById('votedDetails');
    
    // Get voted candidate details
    const votedCandidate = currentCandidateToVote;
    
    detailsDiv.innerHTML = `
        <div class="voted-candidate-info">
            <img src="${votedCandidate.photo || 'https://via.placeholder.com/150'}" 
                 alt="${votedCandidate.name}"
                 class="voted-photo">
            <div class="voted-candidate-details">
                <h4>${votedCandidate.name}</h4>
                <p>${votedCandidate.department || ''}</p>
                <div class="voted-category">
                    ${votedCandidate.category === 'king' ? '👑 King' : '👸 Queen'}
                </div>
                <div class="vote-time">
                    Voted at: ${new Date().toLocaleTimeString()}
                </div>
            </div>
        </div>
    `;
    
    modal.style.display = 'flex';
}

function closeVotedModal() {
    document.getElementById('votedModal').style.display = 'none';
}

function showAlreadyVotedModal() {
    const modal = document.getElementById('votedModal');
    const detailsDiv = document.getElementById('votedDetails');
    
    // Get all voted candidates
    const votedCandidates = currentUser.votedFor.map(candidateId => {
        for (const category in candidates) {
            const candidate = candidates[category].find(c => c.id === candidateId);
            if (candidate) return candidate;
        }
        return null;
    }).filter(c => c !== null);
    
    let detailsHTML = '';
    votedCandidates.forEach(candidate => {
        detailsHTML += `
            <div class="voted-candidate-info">
                <img src="${candidate.photo || 'https://via.placeholder.com/150'}" 
                     alt="${candidate.name}"
                     class="voted-photo">
                <div class="voted-candidate-details">
                    <h4>${candidate.name}</h4>
                    <p>${candidate.department || ''}</p>
                    <div class="voted-category">
                        ${candidate.category === 'king' ? '👑 King' : '👸 Queen'}
                    </div>
                </div>
            </div>
        `;
    });
    
    detailsDiv.innerHTML = detailsHTML || '<p>No voting details available.</p>';
    modal.style.display = 'flex';
}

// ===== UI UPDATES =====
function disableVotingButtons() {
    document.querySelectorAll('.vote-btn').forEach(btn => {
        btn.disabled = true;
        if (!btn.classList.contains('voted')) {
            btn.textContent = 'Voting Completed';
            btn.classList.add('disabled');
        }
    });
}

function updateVotedDisplay() {
    const votedButtons = document.querySelectorAll('.vote-btn');
    votedButtons.forEach(btn => {
        const candidateId = btn.closest('.candidate-card').dataset.id;
        if (currentUser.votedFor.includes(candidateId)) {
            btn.textContent = '✓ Voted';
            btn.classList.add('voted');
            btn.disabled = true;
        }
    });
}

function updateStatistics() {
    // Update total votes
    let totalVotes = 0;
    Object.values(candidates).forEach(category => {
        category.forEach(candidate => {
            totalVotes += candidate.votes || 0;
        });
    });
    
    const totalVotesElement = document.getElementById('totalVotes');
    if (totalVotesElement) {
        totalVotesElement.textContent = totalVotes;
    }
    
    // Update candidate counts
    const kingCountElement = document.getElementById('kingCount');
    const queenCountElement = document.getElementById('queenCount');
    
    if (kingCountElement) {
        kingCountElement.textContent = candidates.kings?.length || 0;
    }
    
    if (queenCountElement) {
        queenCountElement.textContent = candidates.queens?.length || 0;
    }
}

// ===== TIMER FUNCTIONS =====
function startVotingTimer() {
    updateTimerDisplay();
    setInterval(updateTimerDisplay, 1000);
}

function updateTimerDisplay() {
    const timerElement = document.getElementById('timerDisplay');
    if (!timerElement) return;
    
    const now = new Date();
    const endTime = SYSTEM_CONFIG.votingEndTime;
    const timeLeft = endTime - now;
    
    if (timeLeft <= 0) {
        timerElement.textContent = 'Voting Ended';
        SYSTEM_CONFIG.votingActive = false;
        return;
    }
    
    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
    
    if (days > 0) {
        timerElement.textContent = `${days}d ${hours}h ${minutes}m`;
    } else {
        timerElement.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
}

// ===== ANIMATIONS =====
function initializeWelcomeAnimation() {
    const overlay = document.getElementById('animationOverlay');
    const welcomeBox = document.getElementById('welcomeBox');
    const votingBox = document.getElementById('votingBox');
    
    if (!overlay || !welcomeBox || !votingBox) return;
    
    // Show welcome box
    setTimeout(() => {
        welcomeBox.style.display = 'block';
    }, 500);
    
    // Transition to voting box
    setTimeout(() => {
        welcomeBox.style.opacity = '0';
        setTimeout(() => {
            welcomeBox.style.display = 'none';
            votingBox.style.display = 'block';
        }, 300);
    }, 2500);
    
    // Transition to main content
    setTimeout(() => {
        votingBox.style.opacity = '0';
        setTimeout(() => {
            overlay.style.opacity = '0';
            setTimeout(() => {
                overlay.style.display = 'none';
                document.getElementById('mainContent').style.display = 'block';
            }, 300);
        }, 300);
    }, 5500);
}

// ===== UTILITY FUNCTIONS =====
function showMessage(message, type = 'info') {
    // Create message element
    const messageDiv = document.createElement('div');
    messageDiv.className = `message-${type}`;
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'error' ? '#f44336' : '#4CAF50'};
        color: white;
        border-radius: 5px;
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(messageDiv);
    
    // Remove after 3 seconds
    setTimeout(() => {
        messageDiv.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            document.body.removeChild(messageDiv);
        }, 300);
    }, 3000);
}

// ===== GLOBAL VARIABLES =====
let SYSTEM_CONFIG = {
    votingEndTime: new Date(),
    votingActive: true
};

let candidates = {
    kings: [],
    queens: []
};

let currentUser = {
    hasVoted: false,
    votedFor: [],
    voteTime: null
};

let currentCandidateToVote = null;

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);