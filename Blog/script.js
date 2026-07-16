// ===== MAIN PAGE LOGIC =====
document.addEventListener('DOMContentLoaded', async function() {
    await loadBlogsFromGitHub();
    renderBlogs(blogs);
    setupSearch();
    updateBlogCount();
});

function renderBlogs(blogsToRender) {
    const grid = document.getElementById('blogGrid');
    
    if (!blogsToRender || blogsToRender.length === 0) {
        grid.innerHTML = `
            <div class="no-results glass">
                <i class="fas fa-inbox"></i>
                <p>No blogs found. Check back later!</p>
                <p style="font-size:14px;margin-top:10px;">
                    <a href="admin.html" style="color:#ffd700;">Go to Admin</a> to add your first blog
                </p>
            </div>
        `;
        return;
    }

    grid.innerHTML = blogsToRender.map(blog => `
        <div class="blog-card" onclick="window.location.href='post.html?id=${blog.id}'">
            <img src="${blog.image || 'https://via.placeholder.com/400x250/764ba2/ffffff?text=No+Image'}" 
                 alt="${blog.title}" 
                 loading="lazy" />
            <div class="card-body">
                <h3>${blog.title}</h3>
                <p>${truncateText(blog.description, 120)}</p>
                <a href="post.html?id=${blog.id}" class="read-more">
                    Read More <i class="fas fa-arrow-right"></i>
                </a>
                <div class="card-meta">
                    <span><i class="far fa-calendar-alt"></i> ${formatDate(blog.date)}</span>
                    <span><i class="far fa-eye"></i> ${blog.views || 0} views</span>
                </div>
            </div>
        </div>
    `).join('');
}

function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    
    searchInput.addEventListener('input', function() {
        const query = this.value.toLowerCase().trim();
        
        if (query === '') {
            renderBlogs(blogs);
            updateBlogCount();
            return;
        }
        
        const filtered = blogs.filter(blog => 
            blog.title.toLowerCase().includes(query) ||
            blog.description.toLowerCase().includes(query)
        );
        
        renderBlogs(filtered);
        document.getElementById('blogCount').textContent = `${filtered.length} results`;
    });
}

function updateBlogCount() {
    document.getElementById('blogCount').textContent = `${blogs.length} posts`;
}
