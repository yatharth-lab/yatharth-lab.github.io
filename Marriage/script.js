* { margin:0; padding:0; box-sizing:border-box; -webkit-tap-highlight-color:transparent; }
body { font-family:'Segoe UI',Roboto,sans-serif; background:#fffdf5; color:#333; overscroll-behavior:none; }

/* SPLASH */
#splashScreen { position:fixed; top:0; left:0; right:0; bottom:0; background:#fff; display:flex; flex-direction:column; align-items:center; justify-content:center; z-index:9999; transition:opacity 0.5s; }
.splash-icon { font-size:5rem; }
#splashScreen h2 { color:#FF8C00; margin-top:10px; }

/* TOP NAV */
#topNav { background:#fff; box-shadow:0 2px 15px rgba(255,140,0,0.1); position:sticky; top:0; z-index:100; border-bottom:2px solid #FFB300; }
.nav-inner { display:flex; align-items:center; justify-content:space-between; max-width:800px; margin:0 auto; padding:10px 15px; }
.nav-logo { font-size:1.2rem; font-weight:700; color:#FF6F00; }
.nav-btns { display:flex; gap:6px; }
.nav-btn { padding:8px 12px; border:1px solid #ddd; border-radius:20px; background:#fff; color:#555; font-weight:600; font-size:0.8rem; cursor:pointer; }
.nav-btn.active { background:#fff3e0; color:#FF6F00; border-color:#FFB300; }

/* MAIN */
.main-content { max-width:800px; margin:0 auto; padding:15px; }
.page { display:none; }
.page.active-page { display:block; }

/* STATS */
.stats-row { display:flex; gap:10px; margin-bottom:15px; }
.stat-box { flex:1; background:#fff; padding:12px; border-radius:15px; border:1px solid #FFC107; text-align:center; font-size:0.75rem; }
.stat-box span { font-size:1.5rem; font-weight:800; color:#FF6F00; display:block; }

/* SEARCH */
.search-bar { margin-bottom:8px; }
.search-bar input { width:100%; padding:12px 15px; border:2px solid #ffe0b2; border-radius:12px; font-size:0.95rem; background:#fff; }
.filter-row { display:flex; gap:8px; margin-bottom:15px; }
.filter-row select { flex:1; padding:10px; border:2px solid #ffe0b2; border-radius:10px; background:#fff; font-size:0.85rem; }
.clear-btn { padding:10px 15px; background:#ff4444; color:#fff; border:none; border-radius:10px; font-weight:700; cursor:pointer; }

/* PROFILE GRID */
.profile-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(155px,1fr)); gap:10px; }
.profile-card { background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 5px 15px rgba(255,140,0,0.1); border:1px solid #ffe6b3; cursor:pointer; transition:0.2s; }
.profile-card:active { transform:scale(0.97); }
.card-img { width:100%; aspect-ratio:4/5; background:linear-gradient(145deg,#FFC107,#FFB300); display:flex; align-items:center; justify-content:center; overflow:hidden; position:relative; }
.card-img img { width:100%; height:100%; object-fit:cover; position:absolute; top:0; left:0; }
.card-img-placeholder { font-size:3rem; }
.card-info { padding:10px; }
.card-info h4 { font-size:0.9rem; margin-bottom:3px; }
.card-info .info-line { font-size:0.7rem; color:#666; margin:2px 0; }
.card-btns { display:flex; gap:4px; margin-top:8px; }
.card-btns button { flex:1; padding:8px; border:none; border-radius:8px; font-weight:700; font-size:0.75rem; cursor:pointer; }
.btn-card-share { background:#25D366; color:#fff; }
.btn-card-delete { background:#ff4444; color:#fff; }

/* ADD FORM */
.page-title { text-align:center; color:#FF6F00; margin-bottom:15px; }
.add-form { background:#fff; padding:20px; border-radius:18px; border:1px solid #FFB300; }
.photo-section { text-align:center; margin-bottom:15px; }
.photo-section label { font-weight:600; color:#FF6F00; display:block; margin-bottom:5px; }
#photoPreview { width:100%; aspect-ratio:9/16; max-height:250px; background:#fff7e0; border:2px dashed #FFB300; border-radius:15px; display:flex; align-items:center; justify-content:center; cursor:pointer; overflow:hidden; }
#photoPreview img { width:100%; height:100%; object-fit:cover; }
#photoPreview span { font-size:2rem; color:#888; }
.crop-btn { margin-top:8px; background:#FF8C00; color:#fff; border:none; padding:8px 16px; border-radius:10px; cursor:pointer; }
.form-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
.fg { display:flex; flex-direction:column; }
.fg.full { grid-column:1/-1; }
.fg label { font-weight:600; font-size:0.75rem; color:#FF6F00; margin-bottom:3px; }
.fg input, .fg select, .fg textarea { padding:10px; border:2px solid #ffe0b2; border-radius:10px; font-size:0.9rem; background:#fffdf7; }
.form-actions { display:flex; gap:10px; margin-top:15px; }
.btn-save { flex:1; padding:14px; background:linear-gradient(135deg,#FF8C00,#FFB300); color:#fff; border:none; border-radius:12px; font-weight:700; font-size:1rem; cursor:pointer; }
.btn-reset { flex:1; padding:14px; background:#fff; border:2px solid #FFB300; color:#FF6F00; border-radius:12px; font-weight:700; cursor:pointer; }

/* BACKUP */
.backup-cards { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:15px; }
.b-card { background:#fff; padding:20px; border-radius:15px; border:2px solid #FFB300; text-align:center; cursor:pointer; }
.b-icon { font-size:2.5rem; }
.b-card h3 { color:#FF6F00; font-size:0.9rem; }
.b-card p { font-size:0.7rem; color:#666; }
.btn-danger-full { width:100%; padding:14px; background:#dc3545; color:#fff; border:none; border-radius:12px; font-weight:700; font-size:1rem; cursor:pointer; }

/* IMAGE VIEWER */
#imageViewer { display:none; position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.95); z-index:300; align-items:center; justify-content:center; }
#imageViewer.show { display:flex; }
#imageViewer img { max-width:95%; max-height:90%; object-fit:contain; }
.close-viewer { position:absolute; top:15px; right:15px; background:rgba(255,255,255,0.2); color:#fff; border:none; padding:10px 15px; border-radius:20px; font-size:1.2rem; cursor:pointer; }

/* CROP MODAL */
#cropModal { display:none; position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.9); z-index:200; align-items:center; justify-content:center; }
#cropModal.show { display:flex; }
.crop-inner { background:#fff; border-radius:20px; padding:20px; width:95%; max-width:400px; }
.crop-inner h3 { color:#FF6F00; text-align:center; margin-bottom:10px; }
.crop-box { max-height:55vh; overflow:hidden; }
.crop-box img { max-width:100%; }
.crop-btns { display:flex; gap:10px; margin-top:15px; }
.btn-crop-done { flex:1; padding:12px; background:#28a745; color:#fff; border:none; border-radius:10px; font-weight:700; cursor:pointer; }
.btn-crop-cancel { flex:1; padding:12px; background:#dc3545; color:#fff; border:none; border-radius:10px; font-weight:700; cursor:pointer; }

/* DETAIL MODAL */
#detailModal { display:none; position:fixed; top:0; left:0; right:0; bottom:0; background:#fff; z-index:250; overflow-y:auto; }
#detailModal.show { display:block; }
.detail-close { position:fixed; top:15px; right:15px; background:#ff4444; color:#fff; border:none; width:40px; height:40px; border-radius:50%; font-size:1.3rem; z-index:251; cursor:pointer; }
.detail-content { max-width:500px; margin:0 auto; padding:50px 20px 30px; }
.detail-content img { width:100%; max-height:450px; object-fit:contain; border-radius:20px; margin-bottom:20px; display:block; }
.detail-content h2 { color:#FF6F00; }
.detail-row { display:flex; justify-content:space-between; padding:10px; background:#f9f9f9; border-radius:10px; margin:5px 0; font-size:0.9rem; }
.detail-actions { display:flex; gap:10px; margin-top:20px; }
.detail-actions button { flex:1; padding:14px; border:none; border-radius:12px; font-weight:700; font-size:1rem; cursor:pointer; }

/* INSTALL */
#installBanner { display:none; position:fixed; bottom:0; left:0; right:0; background:#fff; padding:15px; box-shadow:0 -5px 20px rgba(0,0,0,0.2); z-index:150; text-align:center; }
#installBanner button { padding:8px 15px; border-radius:10px; margin:3px; cursor:pointer; border:none; }
#installBanner button:first-of-type { background:#FF8C00; color:#fff; }
