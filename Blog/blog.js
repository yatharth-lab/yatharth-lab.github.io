// ===== BLOG DATA =====
// Check if blogs array is already defined by admin.js, otherwise initialize
if (typeof blogs === 'undefined') {
    var blogs = [];
}

// ===== GITHUB CONFIG =====
// Existing object parameters configuration safely checked
if (typeof GITHUB_CONFIG === 'undefined') {
    var GITHUB_CONFIG = {
        token: '',
        username: '',
        repo: '',
        filePath: 'blogs.json'
    };
} else if (!GITHUB_CONFIG.filePath) {
    // Agar admin.js se default object mil gaya toh filePath inject karenge
    GITHUB_CONFIG.filePath = 'blogs.json';
}

// ===== BLOG OPERATIONS =====
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// FIXED NAME: admin.js ke sath sync karne ke liye alias function banaya
async function fetchBlogsFromGitHub() {
    return await loadBlogsFromGitHub();
}

// GitHub se data load karein
async function loadBlogsFromGitHub() {
    try {
        // Config load karein localStorage se
        const savedConfig = localStorage.getItem('githubConfig');
        if (savedConfig) {
            const parsed = JSON.parse(savedConfig);
            GITHUB_CONFIG.token = parsed.token || GITHUB_CONFIG.token;
            GITHUB_CONFIG.username = parsed.username || GITHUB_CONFIG.username;
            GITHUB_CONFIG.repo = parsed.repo || GITHUB_CONFIG.repo;
        } else {
            console.log('⚠️ GitHub config not found. Please set in admin panel.');
            return [];
        }

        const { token, username, repo, filePath } = GITHUB_CONFIG;
        
        if (!token || !username || !repo) {
            console.log('⚠️ GitHub config incomplete.');
            return [];
        }

        const url = `https://api.github.com/repos/${username}/${repo}/contents/${filePath}`;
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (response.status === 404) {
            // File exists nahi hai - empty array return karein
            return [];
        }

        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status}`);
        }

        const data = await response.json();
        // UTF-8 base64 handling for non-english text characters compatibility
        const content = decodeURIComponent(escape(atob(data.content)));
        blogs = JSON.parse(content);
        return blogs;
        
    } catch (error) {
        console.error('Error loading blogs:', error);
        // Error par local storage recovery array deploy karein
        const localData = localStorage.getItem('blogsBackup');
        if (localData) {
            blogs = JSON.parse(localData);
            return blogs;
        }
        return [];
    }
}

// GitHub par data save karein
async function saveBlogsToGitHub(blogsData) {
    try {
        const { token, username, repo, filePath } = GITHUB_CONFIG;
        
        if (!token || !username || !repo) {
            throw new Error('GitHub config not set');
        }

        const url = `https://api.github.com/repos/${username}/${repo}/contents/${filePath}`;
        
        let sha = '';
        try {
            const getResponse = await fetch(url, {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (getResponse.ok) {
                const data = await getResponse.json();
                sha = data.sha;
            }
        } catch (e) {
            // File exists nahi hai - ignore error for automatic creation
        }

        // Content ko Base64 mein encode karein flawlessly
        const content = btoa(unescape(encodeURIComponent(JSON.stringify(blogsData, null, 2))));

        const body = {
            message: `Update blogs: ${new Date().toISOString()}`,
            content: content,
            branch: 'main'
        };

        if (sha) {
            body.sha = sha;
        }

        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`GitHub API error: ${error.message || response.status}`);
        }

        blogs = blogsData;
        
        // Backup localized arrays tracking data
        localStorage.setItem('blogsBackup', JSON.stringify(blogsData));
        return true;
        
    } catch (error) {
        console.error('Save error:', error);
        alert('❌ Error saving to GitHub: ' + error.message);
        return false;
    }
}

// Naya blog add karein (If triggered separately)
async function addBlog(title, description, imageData) {
    const newBlog = {
        id: generateId(),
        title: title,
        description: description,
        image: imageData,
        date: new Date().toISOString(),
        views: 0
    };
    
    blogs.unshift(newBlog);
    const saved = await saveBlogsToGitHub(blogs);
    
    if (saved) {
        return newBlog;
    } else {
        blogs.shift();
        return null;
    }
}

// Get single blog by ID
function getBlogById(id) {
    return blogs.find(blog => blog.id == id || blog.id === id);
}

// Format date utility code
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Truncate text layout limits
function truncateText(text, maxLength = 120) {
    if (!text || text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
}
