
// ===== GLOBAL DATABASE & CONFIG GLOBAL DECLARATION =====
let cropper = null;
let croppedImageData = null;

// GITHUB_CONFIG object define kiya jo pehle missing tha
let GITHUB_CONFIG = {
    token: '',
    username: '',
    repo: ''
};

// Local data management ke liye blogs array initialize kiya
let blogs = []; 

document.addEventListener('DOMContentLoaded', async function() {
    loadGitHubConfig();
    checkGitHubConfig();
    
    // Server/GitHub se existing blogs array fetch karne ki koshish karein
    if (typeof fetchBlogsFromGitHub === 'function') {
        blogs = await fetchBlogsFromGitHub() || [];
    }
});

// Missing ID Generator Function jiske bina id process crash ho rahi thi
function generateId() {
    return Date.now() + Math.floor(Math.random() * 1000);
}

// ===== GITHUB CONFIG =====
function loadGitHubConfig() {
    const saved = localStorage.getItem('githubConfig');
    if (saved) {
        const config = JSON.parse(saved);
        // Local variables aur global config object dono update honge
        GITHUB_CONFIG.token = config.token || '';
        GITHUB_CONFIG.username = config.username || '';
        GITHUB_CONFIG.repo = config.repo || '';
        
        if(document.getElementById('githubToken')) document.getElementById('githubToken').value = GITHUB_CONFIG.token;
        if(document.getElementById('githubUsername')) document.getElementById('githubUsername').value = GITHUB_CONFIG.username;
        if(document.getElementById('githubRepo')) document.getElementById('githubRepo').value = GITHUB_CONFIG.repo;
    }
}

function saveGitHubConfig() {
    const token = document.getElementById('githubToken').value.trim();
    const username = document.getElementById('githubUsername').value.trim();
    const repo = document.getElementById('githubRepo').value.trim();
    
    if (!token || !username || !repo) {
        showError('Please fill all GitHub fields!');
        return;
    }
    
    GITHUB_CONFIG.token = token;
    GITHUB_CONFIG.username = username;
    GITHUB_CONFIG.repo = repo;
    
    localStorage.setItem('githubConfig', JSON.stringify(GITHUB_CONFIG));
    
    checkGitHubConfig();
    showSuccess('GitHub configuration saved successfully!');
}

function checkGitHubConfig() {
    const status = document.getElementById('configStatus');
    if (!status) return;
    
    const { token, username, repo } = GITHUB_CONFIG;
    if (token && username && repo) {
        status.textContent = '✅ Configured';
        status.className = 'config-status configured';
    } else {
        status.textContent = '⚠️ Not Configured';
        status.className = 'config-status not-configured';
    }
}

// ===== IMAGE UPLOAD & CROP =====
const uploadArea = document.getElementById('imageUploadArea');
const imageInput = document.getElementById('imageInput');

if(uploadArea && imageInput) {
    uploadArea.addEventListener('click', () => imageInput.click());
    
    imageInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(event) {
            document.getElementById('cropImage').src = event.target.result;
            document.getElementById('cropModal').classList.add('active');
            
            setTimeout(() => {
                if (cropper) cropper.destroy();
                cropper = new Cropper(document.getElementById('cropImage'), {
                    aspectRatio: 1,
                    viewMode: 1,
                    autoCropArea: 1,
                    responsive: true,
                    guides: true,
                    background: false,
                });
            }, 100);
        };
        reader.readAsDataURL(file);
    });
}

function closeCrop() {
    document.getElementById('cropModal').classList.remove('active');
    if (cropper) {
        cropper.destroy();
        cropper = null;
    }
    imageInput.value = '';
}

function applyCrop() {
    if (!cropper) return;
    
    const canvas = cropper.getCroppedCanvas({
        width: 400,
        height: 400,
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high',
    });
    
    croppedImageData = canvas.toDataURL('image/jpeg', 0.85);
    
    const preview = document.getElementById('previewImg');
    preview.src = croppedImageData;
    document.getElementById('imagePreview').style.display = 'block';
    
    closeCrop();
}

// ===== FORM SUBMIT =====
const blogForm = document.getElementById('blogForm');
if(blogForm) {
    blogForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const title = document.getElementById('blogTitle').value.trim();
        const description = document.getElementById('blogDescription').value.trim();
        const submitBtn = document.getElementById('submitBtn');
        
        if (!title || !description) {
            showError('Please fill in all fields!');
            return;
        }
        
        if (!croppedImageData) {
            showError('Please upload and crop an image!');
            return;
        }
        
        if (!GITHUB_CONFIG.token || !GITHUB_CONFIG.username || !GITHUB_CONFIG.repo) {
            showError('Please configure GitHub settings first!');
            return;
        }
        
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publishing...';
        hideMessages();
        
        const newBlog = {
            id: generateId(),
            title: title,
            description: description,
            image: croppedImageData,
            date: new Date().toISOString(),
            views: 0
        };
        
        blogs.unshift(newBlog);
        
        let saved = false;
        // Check function initialization safely before pushing update to git
        if (typeof saveBlogsToGitHub === 'function') {
            saved = await saveBlogsToGitHub(blogs);
        } else {
            console.error("API helper function saveBlogsToGitHub missing!");
        }
        
        if (saved) {
            showSuccess('🎉 Blog published successfully! It will appear on the website.');
            
            document.getElementById('blogTitle').value = '';
            document.getElementById('blogDescription').value = '';
            document.getElementById('imagePreview').style.display = 'none';
            document.getElementById('previewImg').src = '#';
            croppedImageData = null;
            imageInput.value = '';
        } else {
            blogs.shift();
            showError('Failed to publish blog. Please check GitHub settings/API functions and try again.');
        }
        
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Publish Blog';
    });
}

// ===== UTILITY FUNCTIONS =====
function showSuccess(message) {
    const el = document.getElementById('successMsg');
    if(!el) { alert(message); return; }
    document.getElementById('successText').textContent = message;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 5000);
}

function showError(message) {
    const el = document.getElementById('errorMsg');
    if(!el) { alert(message); return; }
    document.getElementById('errorText').textContent = message;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 5000);
}

function hideMessages() {
    const s = document.getElementById('successMsg');
    const e = document.getElementById('errorMsg');
    if(s) s.classList.remove('show');
    if(e) e.classList.remove('show');
}
