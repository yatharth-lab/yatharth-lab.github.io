// ===== BLOG DATA =====
// Yeh data GitHub se aayega aur yahan store hoga
let blogs = [];

// ===== GITHUB CONFIG =====
// Yeh values admin panel se set hongi
let GITHUB_CONFIG = {
    token: '',
    username: '',
    repo: '',
    filePath: 'blogs.json'  // Data store karne ke liye
};

// ===== BLOG OPERATIONS =====
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// GitHub se data load karein
async function loadBlogsFromGitHub() {
    try {
        // Pehle config load karein localStorage se
        const savedConfig = localStorage.getItem('githubConfig');
        if (savedConfig) {
            GITHUB_CONFIG = JSON.parse(savedConfig);
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
        const content = atob(data.content);
        blogs = JSON.parse(content);
        return blogs;
        
    } catch (error) {
        console.error('Error loading blogs:', error);
        // Agar error aata hai toh localStorage se load karein
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

        // Pehle file ki current SHA get karein (update ke liye)
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
            // File exists nahi hai - new file create karenge
        }

        // Content ko Base64 mein encode karein
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

        // Success - update blogs array
        blogs = blogsData;
        
        // Local backup
        localStorage.setItem('blogsBackup', JSON.stringify(blogsData));
        
        return true;
        
    } catch (error) {
        console.error('Save error:', error);
        alert('❌ Error saving to GitHub: ' + error.message);
        return false;
    }
}

// Naya blog add karein
async function addBlog(title, description, imageData) {
    const newBlog = {
        id: generateId(),
        title: title,
        description: description,
        image: imageData, // Base64 image
        date: new Date().toISOString(),
        views: 0
    };
    
    blogs.unshift(newBlog);
    const saved = await saveBlogsToGitHub(blogs);
    
    if (saved) {
        return newBlog;
    } else {
        // Save fail - remove from array
        blogs.shift();
        return null;
    }
}

// Get single blog by ID
function getBlogById(id) {
    return blogs.find(blog => blog.id === id);
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Truncate text
function truncateText(text, maxLength = 120) {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
}
