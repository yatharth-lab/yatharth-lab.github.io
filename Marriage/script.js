// ============ INDEXEDDB SETUP ============
const DB_NAME = 'VivahSutraDB';
const DB_VERSION = 1;
let db;

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('profiles')) {
                const store = db.createObjectStore('profiles', { keyPath: 'id' });
                store.createIndex('gender', 'gender', { unique: false });
                store.createIndex('age', 'age', { unique: false });
            }
        };
        
        request.onsuccess = (e) => { db = e.target.result; resolve(db); };
        request.onerror = (e) => reject(e.target.error);
    });
}

async function saveProfile(profile) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction('profiles', 'readwrite');
        tx.objectStore('profiles').put(profile);
        tx.oncomplete = () => resolve();
        tx.onerror = (e) => reject(e.target.error);
    });
}

async function getAllProfiles() {
    return new Promise((resolve, reject) => {
        const tx = db.transaction('profiles', 'readonly');
        const request = tx.objectStore('profiles').getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = (e) => reject(e.target.error);
    });
}

async function deleteProfileFromDB(id) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction('profiles', 'readwrite');
        tx.objectStore('profiles').delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = (e) => reject(e.target.error);
    });
}

async function clearAllProfilesDB() {
    return new Promise((resolve, reject) => {
        const tx = db.transaction('profiles', 'readwrite');
        tx.objectStore('profiles').clear();
        tx.oncomplete = () => resolve();
        tx.onerror = (e) => reject(e.target.error);
    });
}

async function bulkSaveProfiles(arr) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction('profiles', 'readwrite');
        const store = tx.objectStore('profiles');
        arr.forEach(p => store.put(p));
        tx.oncomplete = () => resolve();
        tx.onerror = (e) => reject(e.target.error);
    });
}
// ============ PAGE NAVIGATION ============
function showPage(page) {
    // Hide all pages
    document.getElementById('page-home').style.display = 'none';
    document.getElementById('page-add').style.display = 'none';
    document.getElementById('page-backup').style.display = 'none';
    
    // Remove active from all nav buttons
    document.getElementById('nav-home').style.background = 'white';
    document.getElementById('nav-home').style.color = '#555';
    document.getElementById('nav-home').style.border = '1px solid #ddd';
    
    document.getElementById('nav-add').style.background = 'white';
    document.getElementById('nav-add').style.color = '#555';
    document.getElementById('nav-add').style.border = '1px solid #ddd';
    
    document.getElementById('nav-backup').style.background = 'white';
    document.getElementById('nav-backup').style.color = '#555';
    document.getElementById('nav-backup').style.border = '1px solid #ddd';
    
    // Show selected page
    if (page === 'home') {
        document.getElementById('page-home').style.display = 'block';
        document.getElementById('nav-home').style.background = '#fff3e0';
        document.getElementById('nav-home').style.color = '#FF6F00';
        document.getElementById('nav-home').style.border = 'none';
        viewAllProfiles();
    } else if (page === 'add') {
        document.getElementById('page-add').style.display = 'block';
        document.getElementById('nav-add').style.background = '#fff3e0';
        document.getElementById('nav-add').style.color = '#FF6F00';
        document.getElementById('nav-add').style.border = 'none';
    } else if (page === 'backup') {
        document.getElementById('page-backup').style.display = 'block';
        document.getElementById('nav-backup').style.background = '#fff3e0';
        document.getElementById('nav-backup').style.color = '#FF6F00';
        document.getElementById('nav-backup').style.border = 'none';
    }
}
// ============ GLOBAL VARS ============
let profiles = [];
let cropper = null;
let deferredPrompt = null;

// ============ SPLASH ============
setTimeout(() => {
    const splash = document.getElementById('splashScreen');
    if (splash) { splash.style.opacity = '0'; setTimeout(() => splash.remove(), 500); }
}, 1200);

// ============ INIT ============
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await openDB();
        profiles = await getAllProfiles();
        updateStats();
        viewAllProfiles();
    } catch (e) { console.error('DB Error:', e); }
    
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        setTimeout(() => {
            const p = document.getElementById('installPrompt');
            if (p) p.style.display = 'block';
        }, 3000);
    });
    
    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', function(e) {
            e.preventDefault();
            const t = document.querySelector(this.getAttribute('href'));
            if (t) t.scrollIntoView({ behavior: 'smooth' });
        });
    });
});

function installApp() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(() => { deferredPrompt = null; });
    }
    document.getElementById('installPrompt').style.display = 'none';
}

// ============ STATS ============
function updateStats() {
    const t = document.getElementById('totalProfiles');
    const g = document.getElementById('groomCount');
    const b = document.getElementById('brideCount');
    if (t) t.textContent = profiles.length;
    if (g) g.textContent = profiles.filter(p => p.gender === 'Groom').length;
    if (b) b.textContent = profiles.filter(p => p.gender === 'Bride').length;
}

// ============ IMAGE VIEWER ============
function viewFullImage(imageSrc) {
    if (imageSrc) {
        document.getElementById('fullImage').src = imageSrc;
        document.getElementById('imageViewer').style.display = 'flex';
    }
}

function closeImageViewer() {
    document.getElementById('imageViewer').style.display = 'none';
}

// ============ IMAGE UPLOAD & CROP ============
function handleImageSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { alert('❌ Max 10MB'); event.target.value = ''; return; }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('cropImage').src = e.target.result;
        document.getElementById('cropModal').style.display = 'flex';
        setTimeout(() => {
            if (cropper) cropper.destroy();
            const img = document.getElementById('cropImage');
            if (img) {
                cropper = new Cropper(img, {
                    aspectRatio: 9 / 16,
                    viewMode: 1,
                    autoCropArea: 1,
                    responsive: true,
                    background: false
                });
            }
        }, 200);
    };
    reader.readAsDataURL(file);
    event.target.value = '';
}

function openCropper() { document.getElementById('cropModal').style.display = 'flex'; }

function cropImage() {
    if (!cropper) return;
    const canvas = cropper.getCroppedCanvas({ width: 600, height: 1067 });
    if (!canvas) { alert('❌ Error'); return; }
    
    const imageData = canvas.toDataURL('image/jpeg', 0.85);
    
    const preview = document.getElementById('imagePreview');
    const cropBtn = document.getElementById('cropBtn');
    
    if (preview) {
        preview.innerHTML = `<img src="${imageData}" style="width:100%;height:100%;object-fit:cover;">`;
        preview.dataset.imageData = imageData;
        preview.classList.add('has-image');
    }
    if (cropBtn) cropBtn.style.display = 'inline-block';
    closeCropper();
}

function closeCropper() {
    if (cropper) { cropper.destroy(); cropper = null; }
    document.getElementById('cropModal').style.display = 'none';
}

// ============ ADD PROFILE ============
async function addProfile(event) {
    event.preventDefault();
    
    const preview = document.getElementById('imagePreview');
    const imageData = preview?.dataset?.imageData || null;
    
    const profile = {
        id: Date.now(),
        name: document.getElementById('name')?.value?.trim() || '',
        gender: document.getElementById('gender')?.value || '',
        age: parseInt(document.getElementById('age')?.value) || 0,
        height: document.getElementById('height')?.value?.trim() || '',
        weight: document.getElementById('weight')?.value?.trim() || '',
        maritalStatus: document.getElementById('maritalStatus')?.value || '',
        gotra: document.getElementById('gotra')?.value?.trim() || '',
        profession: document.getElementById('profession')?.value?.trim() || '',
        location: document.getElementById('location')?.value?.trim() || '',
        community: document.getElementById('community')?.value?.trim() || '',
        mobile: document.getElementById('mobile')?.value?.trim() || '',
        education: document.getElementById('education')?.value?.trim() || '',
        income: document.getElementById('income')?.value?.trim() || '',
        about: document.getElementById('about')?.value?.trim() || '',
        image: imageData,
        createdAt: new Date().toISOString()
    };
    
    try {
        await saveProfile(profile);
        profiles = await getAllProfiles();
        updateStats();
        alert('✅ Profile saved!');
        resetForm();
        viewAllProfiles();
        document.getElementById('backup')?.scrollIntoView({ behavior: 'smooth' });
    } catch (e) { alert('❌ Error: ' + e.message); }
}

// ============ DISPLAY PROFILES ============
function displayProfiles(arr, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (!arr?.length) {
        container.innerHTML = '<p style="text-align:center;padding:25px;color:#888;grid-column:1/-1;">📭 No profiles</p>';
        return;
    }
    
    container.innerHTML = arr.map(p => `
        <div class="profile-card fade-in">
            <div class="profile-img-container" onclick="viewFullImage('${p.image || ''}')">
                ${p.image 
                    ? `<img src="${p.image}" alt="${p.name}" loading="lazy">`
                    : `<div class="profile-img-placeholder">${p.gender === 'Bride' ? '👰' : '🤵'}</div>`
                }
                <div class="profile-img-overlay">🔍 View</div>
            </div>
            <div class="profile-info">
                <h4>${p.name}, ${p.age} <span class="badge">${p.gender === 'Bride' ? '👰' : '🤵'} ${p.gender}</span></h4>
                ${p.height ? `<div class="detail-row">📏 ${p.height}</div>` : ''}
                ${p.weight ? `<div class="detail-row">⚖️ ${p.weight}</div>` : ''}
                ${p.maritalStatus ? `<div class="detail-row">💍 ${p.maritalStatus}</div>` : ''}
                ${p.gotra ? `<div class="detail-row">🕉️ ${p.gotra}</div>` : ''}
                ${p.profession ? `<div class="detail-row">💼 ${p.profession}</div>` : ''}
                ${p.location ? `<div class="detail-row">📍 ${p.location}</div>` : ''}
                ${p.community ? `<div class="detail-row">👥 ${p.community}</div>` : ''}
                ${p.mobile ? `<div class="detail-row">📞 ${p.mobile}</div>` : ''}
                <div class="profile-actions">
                    <button class="btn-share" onclick="event.stopPropagation(); shareProfile(${p.id})">📤 Share</button>
                    <button class="btn-delete" onclick="event.stopPropagation(); deleteProfile(${p.id})">🗑️</button>
                </div>
            </div>
        </div>
    `).join('');
}

function viewAllProfiles() {
    displayProfiles(profiles, 'homeProfiles');
}

// ============ SHARE AS CARD IMAGE ============
async function shareProfile(id) {
    const p = profiles.find(x => x.id === id);
    if (!p) return;
    
    // Loading indicator
    const loadingMsg = document.createElement('div');
    loadingMsg.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.8);color:white;padding:20px 30px;border-radius:15px;z-index:999;font-size:1.2rem;text-align:center;';
    loadingMsg.innerHTML = '⏳<br>Creating card...';
    document.body.appendChild(loadingMsg);
    
    try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = 1080;
        canvas.height = 1920;
        
        // Background gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, 1920);
        gradient.addColorStop(0, '#FF8C00');
        gradient.addColorStop(0.35, '#FFB300');
        gradient.addColorStop(1, '#FFFFFF');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1080, 1920);
        
        // White card
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = 'rgba(0,0,0,0.1)';
        ctx.shadowBlur = 30;
        ctx.beginPath();
        ctx.roundRect(50, 350, 980, 1400, 50);
        ctx.fill();
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        
        // Header
        ctx.fillStyle = '#FF8C00';
        ctx.font = 'bold 50px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('💑 VIVAH SUTRA', 540, 100);
        ctx.fillStyle = '#666';
        ctx.font = '30px Arial';
        ctx.fillText('Matrimony Profile', 540, 150);
        
        // Profile image
        if (p.image) {
            const img = new Image();
            img.src = p.image;
            await new Promise((resolve) => { img.onload = resolve; });
            ctx.save();
            ctx.beginPath();
            ctx.arc(540, 280, 130, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(img, 410, 150, 260, 260);
            ctx.restore();
        } else {
            ctx.fillStyle = '#FFC107';
            ctx.beginPath();
            ctx.arc(540, 280, 130, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 80px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(p.gender === 'Bride' ? '👰' : '🤵', 540, 310);
        }
        
        // Name & Age
        ctx.fillStyle = '#333';
        ctx.font = 'bold 55px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${p.name}, ${p.age} yrs`, 540, 460);
        ctx.fillStyle = '#FF8C00';
        ctx.font = 'bold 35px Arial';
        ctx.fillText(p.gender === 'Bride' ? '👰 Bride' : '🤵 Groom', 540, 520);
        
        // Divider
        ctx.strokeStyle = '#FFB300';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(150, 560);
        ctx.lineTo(930, 560);
        ctx.stroke();
        
        // Details
        const details = [
            ['📏 Height', p.height],
            ['⚖️ Weight', p.weight],
            ['💍 Status', p.maritalStatus],
            ['🕉️ Gotra', p.gotra],
            ['💼 Profession', p.profession],
            ['📍 Location', p.location],
            ['👥 Community', p.community],
            ['🎓 Education', p.education],
            ['💰 Income', p.income],
            ['📞 Contact', p.mobile]
        ];
        
        let yPos = 640;
        details.forEach(([label, value]) => {
            if (value && value !== 'Not specified') {
                ctx.fillStyle = '#FFF3E0';
                ctx.beginPath();
                ctx.roundRect(120, yPos - 25, 840, 55, 15);
                ctx.fill();
                ctx.fillStyle = '#333';
                ctx.font = 'bold 30px Arial';
                ctx.textAlign = 'left';
                ctx.fillText(label + ':', 140, yPos + 12);
                ctx.fillStyle = '#555';
                ctx.font = '30px Arial';
                ctx.fillText(value, 500, yPos + 12);
                yPos += 80;
            }
        });
        
        // About
        if (p.about && p.about !== 'No description') {
            yPos += 20;
            ctx.fillStyle = '#FF8C00';
            ctx.font = 'bold 32px Arial';
            ctx.fillText('📝 About:', 140, yPos);
            ctx.fillStyle = '#555';
            ctx.font = '28px Arial';
            const words = p.about.split(' ');
            let line = '', lineY = yPos + 50;
            words.forEach(word => {
                if (ctx.measureText(line + word + ' ').width > 800 && line) {
                    ctx.fillText(line, 140, lineY);
                    line = word + ' ';
                    lineY += 45;
                } else line += word + ' ';
            });
            ctx.fillText(line, 140, lineY);
        }
        
        // Footer
        ctx.fillStyle = '#FF8C00';
        ctx.font = 'bold 35px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('💑 Vivah Sutra App', 540, 1820);
        ctx.fillStyle = '#999';
        ctx.font = '25px Arial';
        ctx.fillText('Find your perfect match', 540, 1860);
        
        // Convert & Share
        const blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', 0.9));
        const file = new File([blob], `${p.name.replace(/\s+/g,'_')}_Profile.jpg`, { type: 'image/jpeg' });
        
        document.body.removeChild(loadingMsg);
        
        if (navigator.share && navigator.canShare?.({ files: [file] })) {
            await navigator.share({ title: `${p.name} Profile`, text: `💑 ${p.name} - Vivah Sutra`, files: [file] });
        } else {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = `${p.name}_Profile.jpg`;
            document.body.appendChild(a); a.click();
            document.body.removeChild(a); URL.revokeObjectURL(url);
            alert('📥 Card downloaded! Share manually.');
        }
    } catch (err) {
        document.body.removeChild(loadingMsg);
        console.error(err);
    }
}

// ============ SEARCH ============
function searchProfiles() {
    const name = document.getElementById('searchName')?.value?.toLowerCase()?.trim() || '';
    const gender = document.getElementById('searchGender')?.value || '';
    const ageRange = document.getElementById('searchAge')?.value || '';
    const community = document.getElementById('searchCommunity')?.value?.toLowerCase()?.trim() || '';
    
    let filtered = [...profiles];
    if (name) filtered = filtered.filter(p => p.name?.toLowerCase()?.includes(name));
    if (gender) filtered = filtered.filter(p => p.gender === gender);
    if (ageRange) {
        const [min, max] = ageRange.split('-');
        if (max === '+') filtered = filtered.filter(p => p.age >= parseInt(min));
        else if (min && max) filtered = filtered.filter(p => p.age >= parseInt(min) && p.age <= parseInt(max));
    }
    if (community) filtered = filtered.filter(p => p.community?.toLowerCase()?.includes(community));
    displayProfiles(filtered, 'searchResults');
}

// ============ DELETE ============
async function deleteProfile(id) {
    if (!confirm('⚠️ Delete permanently?')) return;
    await deleteProfileFromDB(id);
    profiles = await getAllProfiles();
    updateStats();
    viewAllProfiles();
    searchProfiles();
}

// ============ RESET ============
function resetForm() {
    document.getElementById('profileForm')?.reset();
    const preview = document.getElementById('imagePreview');
    if (preview) {
        preview.innerHTML = '<span style="font-size:3rem;">📷</span><span style="color:#888;font-size:0.85rem;">Tap to add photo</span>';
        preview.classList.remove('has-image');
        delete preview.dataset.imageData;
    }
    document.getElementById('cropBtn').style.display = 'none';
    if (cropper) { cropper.destroy(); cropper = null; }
}

// ============ BACKUP ============
async function downloadBackup() {
    const all = await getAllProfiles();
    const data = { version:"5.0", app:"Vivah Sutra 💑", timestamp:new Date().toISOString(), total:all.length, profiles:all };
    const str = JSON.stringify(data);
    const mb = (str.length/1024/1024).toFixed(2);
    if (parseFloat(mb)>50 && !confirm(`⚠️ ${mb}MB. Continue?`)) return;
    
    const blob = new Blob([str],{type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href=url; a.download=`vivah-backup-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
    alert(`✅ Backup done!\n👥 ${all.length} profiles\n📦 ${mb} MB`);
}

// ============ RESTORE ============
async function restoreBackup(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 100*1024*1024) { alert('❌ Max 100MB'); event.target.value=''; return; }
    
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (!data.profiles?.length) throw new Error('Empty');
            if (confirm(`📋 Restore ${data.profiles.length} profiles?\n📅 ${new Date(data.timestamp).toLocaleString()}\n\n⚠️ Replaces current ${profiles.length} profiles.`)) {
                await clearAllProfilesDB();
                await bulkSaveProfiles(data.profiles);
                profiles = await getAllProfiles();
                updateStats(); viewAllProfiles(); searchProfiles();
                alert('✅ Restored!');
            }
        } catch(err) { alert('❌ Invalid file'); }
    };
    reader.readAsText(file);
    event.target.value='';
}

// ============ CLEAR ============
async function clearAllData() {
    if (!confirm('⚠️ DELETE ALL?\nDownload backup first!')) return;
    if (!confirm('FINAL: Irreversible!')) return;
    await clearAllProfilesDB();
    profiles = [];
    updateStats(); viewAllProfiles();
    document.getElementById('searchResults').innerHTML = '<p style="text-align:center;padding:20px;grid-column:1/-1;">No profiles</p>';
    alert('✅ Cleared');
}

// ============ SERVICE WORKER ============
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(()=>{}));
                                                              }
