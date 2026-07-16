// ===== ADMIN LOGIC =====
let cropper = null;
let croppedImageData = null;

document.addEventListener('DOMContentLoaded', function() {
    // Load saved GitHub config
    loadGitHubConfig();
    checkGitHubConfig();
});

// ===== GITHUB CONFIG =====
function loadGitHubConfig() {
    const saved = localStorage.getItem('githubConfig');
    if (saved) {
        const config = JSON.parse(saved);
        document.getElementById('githubToken').value = config.token || '';
        document.getElementById('githubUsername').value = config.username || '';
        document.getElementById('githubRepo').value = config.repo || '';
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
document.getElementById('blogForm').addEventListener('submit', async function(e) {
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
    
    // Check GitHub config
    if (!GITHUB_CONFIG.token || !GITHUB_CONFIG.username || !GITHUB_CONFIG.repo) {
        showError('Please configure GitHub settings first!');
        return;
    }
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publishing...';
    hideMessages();
    
    // Create blog
    const newBlog = {
        id: generateId(),
        title: title,
        description: description,
        image: croppedImageData,
        date: new Date().toISOString(),
        views: 0
    };
    
    blogs.unshift(newBlog);
    const saved = await saveBlogsToGitHub(blogs);
    
    if (saved) {
        showSuccess('🎉 Blog published successfully! It will appear on the website.');
        
        // Reset form
        document.getElementById('blogTitle').value = '';
        document.getElementById('blogDescription').value = '';
        document.getElementById('imagePreview').style.display = 'none';
        document.getElementById('previewImg').src = '#';
        croppedImageData = null;
        imageInput.value = '';
    } else {
        blogs.shift();
        showError('Failed to publish blog. Please check GitHub settings and try again.');
    }
    
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Publish Blog';
});

// ===== UTILITY FUNCTIONS =====
function showSuccess(message) {
    const el = document.getElementById('successMsg');
    document.getElementById('successText').textContent = message;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 5000);
}

function showError(message) {
    const el = document.getElementById('errorMsg');
    document.getElementById('errorText').textContent = message;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 5000);
}

function hideMessages() {
    document.getElementById('successMsg').classList.remove('show');
    document.getElementById('errorMsg').classList.remove('show');
}
