// DOM Elements
const elements = {
    loginForm: document.getElementById('loginForm'),
    registerForm: document.getElementById('registerForm'),
    verifyOtpForm: document.getElementById('verifyOtpForm'),
    generatorSection: document.getElementById('generatorSection'),
    generateBtn: document.getElementById('generateBtn'),
    imageContainer: document.getElementById('imageContainer'),
    limitAlert: document.getElementById('limitAlert'),
    limitText: document.getElementById('limitText'),
    loadingModal: new bootstrap.Modal('#loadingModal')
};

const API_BASE_URL = 'http://localhost:5000/api';
let currentUser = null;

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
    setupEventListeners();
    if (localStorage.getItem('token')) {
        checkDailyLimit();
    }
});

function setupEventListeners() {
    // Login form submission
    elements.loginForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleLogin();
    });

    // Register form submission
    elements.registerForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleRegister();
    });

    // OTP verification
    elements.verifyOtpForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await verifyOtp();
    });

    // Image generation
    elements.generateBtn?.addEventListener('click', async () => {
        await generateImages();
    });

    // Other event listeners...
}

async function handleLogin() {
    try {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.message || 'Login failed');

        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        currentUser = data.user;
        
        showGeneratorSection();
        await checkDailyLimit();
    } catch (err) {
        showError(err.message);
    }
}

async function generateImages() {
    const prompt = document.getElementById('promptInput').value;
    const style = document.getElementById('styleSelect').value;
    const token = localStorage.getItem('token');

    if (!prompt) return showError('Please enter image description');
    if (!token) return showError('Please login first');

    try {
        elements.loadingModal.show();
        elements.generateBtn.disabled = true;

        const response = await fetch(`${API_BASE_URL}/images/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ prompt, style })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Generation failed');

        displayGeneratedImages(data.imageUrls, prompt);
        await checkDailyLimit();
    } catch (err) {
        showError(err.message);
    } finally {
        elements.generateBtn.disabled = false;
        elements.loadingModal.hide();
    }
}

function displayGeneratedImages(imageUrls, prompt) {
    elements.imageContainer.innerHTML = '';
    elements.placeholderText.classList.add('hidden');
    elements.imagesSection.classList.remove('hidden');

    imageUrls.forEach((url, index) => {
        const col = document.createElement('div');
        col.className = 'col';

        col.innerHTML = `
            <div class="image-card h-100">
                <img src="${url}" class="card-img-top" alt="Generated image ${index + 1}">
                <div class="image-actions d-flex justify-content-center gap-2">
                    <button class="btn btn-sm btn-primary download-btn">
                        <i class="bi bi-download"></i>
                    </button>
                    <button class="btn btn-sm btn-info view-btn">
                        <i class="bi bi-arrows-angle-expand"></i>
                    </button>
                </div>
            </div>
        `;

        // Add event listeners to buttons
        col.querySelector('.download-btn').addEventListener('click', () => 
            downloadImage(url, prompt, index));
        col.querySelector('.view-btn').addEventListener('click', () => 
            viewImage(url));

        elements.imageContainer.appendChild(col);
    });
}

async function checkDailyLimit() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch(`${API_BASE_URL}/images/my-images?limit=1`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) return;

        const data = await response.json();
        const count = data.total;
        const limitReached = count >= 30;

        elements.limitAlert.classList.toggle('hidden', !limitReached);
        elements.limitText.textContent = `You've generated ${count}/30 images today`;
    } catch (err) {
        console.error('Error checking daily limit:', err);
    }
}

// Helper functions
function downloadImage(url, prompt, index) {
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-image-${prompt.substring(0, 15).replace(/\s+/g, '-')}-${index + 1}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function viewImage(url) {
    window.open(url, '_blank');
}

function showError(message) {
    alert(message); // Replace with better error display
}

// ... include all other functions from previous implementation
