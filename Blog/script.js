// ===== MAIN PAGE LOGIC =====
document.addEventListener('DOMContentLoaded', async function() {
    // Agar blogs array define nahi hai toh load hone se pehle check karenge
    if (typeof blogs === 'undefined') {
        window.blogs = [];
    }
    
    // Server/GitHub se data fetch karke global blogs window array me save kiya
    if (typeof loadBlogsFromGitHub === 'function') {
        window.blogs = await loadBlogsFromGitHub() || [];
    } else if (typeof fetchBlogsFromGitHub === 'function') {
        window.blogs = await fetchBlogsFromGitHub() || [];
    }
    
    renderBlogs(window.blogs);
    setupSearch();
    updateBlogCount();
});

function renderBlogs(blogsToRender) {
    const grid = document.getElementById('blogGrid');
    if (!grid) return; // Fail safe check agar DOM element missing ho
    
    if (!blogsToRender || blogsToRender.length === 0) {
        grid.innerHTML = `
            <div class="no-results glass" style="grid-column: 1/-1; text-align: center; padding: 40px 0;">
                <p>No blogs found. Check back later!</p>
                <p style="font-size:14px; margin-top:10px;">
                    <a href="admin.html" style="color:#ffd700; text-decoration: none;">Go to Admin</a> to add your first blog
                </p>
            </div>
        `;
        return;
    }

    grid.innerHTML = blogsToRender.map(blog => `
        <div class="blog-card" onclick="window.location.href='post.html?id=${blog.id}'" style="cursor: pointer;">
            <img src="${blog.image || 'https://via.placeholder.com/400x250/764ba2/ffffff?text=No+Image'}" 
                 alt="${blog.title}" 
                 loading="lazy" />
            <div class="card-body">
                <h3>${blog.title}</h3>
                <p>${typeof truncateText === 'function' ? truncateText(blog.description, 120) : blog.description.substring(0, 120) + '...'}</p>
                <a href="post.html?id=${blog.id}" class="read-more">
                    Read More 
                </a>
                <div class="card-meta" style="margin-top: 10px; font-size: 0.75rem; opacity: 0.6; display: flex; gap: 15px;">
                    <span><i class="far fa-calendar-alt"></i> ${typeof formatDate === 'function' ? formatDate(blog.date) : blog.date}</span>
                    <span><i class="far fa-eye"></i> ${blog.views || 0} views</span>
                </div>
            </div>
        </div>
    `).join('');
}

function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', function() {
        const query = this.value.toLowerCase().trim();
        const activeBlogs = window.blogs || [];
        
        if (query === '') {
            renderBlogs(activeBlogs);
            updateBlogCount();
            return;
        }
        
        const filtered = activeBlogs.filter(blog => 
            (blog.title && blog.title.toLowerCase().includes(query)) ||
            (blog.description && blog.description.toLowerCase().includes(query))
        );
        
        renderBlogs(filtered);
        
        const countEl = document.getElementById('blogCount');
        if (countEl) countEl.textContent = `${filtered.length} results`;
    });
}

function updateBlogCount() {
    const countEl = document.getElementById('blogCount');
    const activeBlogs = window.blogs || [];
    if (countEl) countEl.textContent = `${activeBlogs.length} posts`;
}
