// ============ DATABASE ============
let db;
const DB_NAME='VivahDB', DB_VER=1;

function openDB(){
    return new Promise((ok,no)=>{
        const r=indexedDB.open(DB_NAME,DB_VER);
        r.onupgradeneeded=e=>{if(!e.target.result.objectStoreNames.contains('profiles'))e.target.result.createObjectStore('profiles',{keyPath:'id'});};
        r.onsuccess=e=>{db=e.target.result;ok();};
        r.onerror=e=>no(e);
    });
}
async function allProfiles(){
    return new Promise((ok,no)=>{
        const tx=db.transaction('profiles','readonly');
        const r=tx.objectStore('profiles').getAll();
        r.onsuccess=()=>ok(r.result);
        r.onerror=e=>no(e);
    });
}
async function save(p){
    return new Promise((ok,no)=>{
        const tx=db.transaction('profiles','readwrite');
        tx.objectStore('profiles').put(p);
        tx.oncomplete=()=>ok();
        tx.onerror=e=>no(e);
    });
}
async function del(id){
    return new Promise((ok,no)=>{
        const tx=db.transaction('profiles','readwrite');
        tx.objectStore('profiles').delete(id);
        tx.oncomplete=()=>ok();
    });
}
async function clearAll(){
    return new Promise((ok,no)=>{
        const tx=db.transaction('profiles','readwrite');
        tx.objectStore('profiles').clear();
        tx.oncomplete=()=>ok();
    });
}
async function bulkAdd(arr){
    return new Promise((ok,no)=>{
        const tx=db.transaction('profiles','readwrite');
        const s=tx.objectStore('profiles');
        arr.forEach(p=>s.put(p));
        tx.oncomplete=()=>ok();
    });
}

// ============ STATE ============
let profiles=[], cropper=null, deferredPrompt=null, currentPhotoData=null;

// ============ INIT ============
(async function(){
    await openDB();
    profiles=await allProfiles();
    updateStats();
    renderGrid(profiles);
    setTimeout(()=>{
        const s=document.getElementById('splashScreen');
        if(s){s.style.opacity='0';setTimeout(()=>s.remove(),500);}
    },800);
    
    window.addEventListener('beforeinstallprompt',e=>{
        e.preventDefault();deferredPrompt=e;
        setTimeout(()=>document.getElementById('installBanner').style.display='block',3000);
    });
})();

function installApp(){
    if(deferredPrompt){deferredPrompt.prompt();deferredPrompt=null;}
    document.getElementById('installBanner').style.display='none';
}

// ============ NAVIGATION ============
function showPage(page){
    document.querySelectorAll('.page').forEach(p=>p.classList.remove('active-page'));
    document.getElementById('page-'+page).classList.add('active-page');
    document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
    document.getElementById('nav-'+page).classList.add('active');
    if(page==='home') renderGrid(profiles);
}

// ============ STATS ============
function updateStats(){
    document.getElementById('totalProfiles').textContent=profiles.length;
    document.getElementById('groomCount').textContent=profiles.filter(p=>p.gender==='Groom').length;
    document.getElementById('brideCount').textContent=profiles.filter(p=>p.gender==='Bride').length;
}

// ============ SEARCH (REAL-TIME) ============
function doSearch(){
    const q=document.getElementById('searchInput')?.value?.toLowerCase()?.trim()||'';
    const g=document.getElementById('filterGender')?.value||'';
    
    let filtered=profiles;
    if(q) filtered=filtered.filter(p=>p.name?.toLowerCase()?.includes(q)||p.community?.toLowerCase()?.includes(q)||p.location?.toLowerCase()?.includes(q)||p.profession?.toLowerCase()?.includes(q));
    if(g) filtered=filtered.filter(p=>p.gender===g);
    renderGrid(filtered);
}
function clearSearch(){
    document.getElementById('searchInput').value='';
    document.getElementById('filterGender').value='';
    renderGrid(profiles);
}

// ============ RENDER CARDS ============
function renderGrid(arr){
    const grid=document.getElementById('profileGrid');
    if(!arr?.length){grid.innerHTML='<p style="text-align:center;padding:30px;color:#888;grid-column:1/-1;">📭 No profiles found</p>';return;}
    grid.innerHTML=arr.map(p=>`
        <div class="profile-card" onclick="openDetail(${p.id})">
            <div class="card-img">
                ${p.image?`<img src="${p.image}" alt="${p.name}">`:`<span class="card-img-placeholder">${p.gender==='Bride'?'👰':'🤵'}</span>`}
            </div>
            <div class="card-info">
                <h4>${p.name}, ${p.age}</h4>
                <div class="info-line">${p.gender==='Bride'?'👰':'🤵'} ${p.gender}</div>
                ${p.profession?`<div class="info-line">💼 ${p.profession}</div>`:''}
                ${p.location?`<div class="info-line">📍 ${p.location}</div>`:''}
                <div class="card-btns">
                    <button class="btn-card-share" onclick="event.stopPropagation();shareCard(${p.id})">📤</button>
                    <button class="btn-card-delete" onclick="event.stopPropagation();deleteProfile(${p.id})">🗑️</button>
                </div>
            </div>
        </div>
    `).join('');
}

// ============ DETAIL MODAL ============
function openDetail(id){
    const p=profiles.find(x=>x.id===id);
    if(!p)return;
    const modal=document.getElementById('detailModal');
    modal.innerHTML=`
        <button class="detail-close" onclick="closeDetail()">✕</button>
        <div class="detail-content">
            ${p.image?`<img src="${p.image}">`:`<div style="width:100%;height:300px;background:#FFC107;border-radius:20px;display:flex;align-items:center;justify-content:center;font-size:5rem;">${p.gender==='Bride'?'👰':'🤵'}</div>`}
            <h2>${p.name}, ${p.age} yrs</h2>
            <span style="background:#FF8C00;color:#fff;padding:4px 12px;border-radius:12px;font-size:0.85rem;">${p.gender==='Bride'?'👰 Bride':'🤵 Groom'}</span>
            <div style="margin-top:15px;">
                ${dl('📏 Height',p.height)}
                ${dl('⚖️ Weight',p.weight)}
                ${dl('💍 Status',p.maritalStatus)}
                ${dl('🕉️ Gotra',p.gotra)}
                ${dl('👨 Father',p.fatherName)}
                ${dl('👩 Mother',p.motherName)}
                ${dl('💼 Profession',p.profession)}
                ${dl('📍 Location',p.location)}
                ${dl('👥 Community',p.community)}
                ${dl('📞 Mobile',p.mobile)}
                ${dl('🎓 Education',p.education)}
                ${dl('💰 Income',p.income)}
            </div>
            <div class="detail-actions">
                <button style="background:#25D366;color:#fff;" onclick="shareCard(${p.id})">📤 Share</button>
                <button style="background:#ff4444;color:#fff;" onclick="deleteProfile(${p.id});closeDetail();">🗑️ Delete</button>
            </div>
        </div>
    `;
    modal.classList.add('show');
}
function closeDetail(){document.getElementById('detailModal').classList.remove('show');}
function dl(label,value){if(!value||value==='Not specified')return'';return`<div class="detail-row"><span>${label}</span><strong>${value}</strong></div>`;}

// ============ PHOTO ============
function handlePhoto(e){
    const f=e.target.files[0];
    if(!f)return;
    if(f.size>10*1024*1024){alert('Max 10MB');e.target.value='';return;}
    const reader=new FileReader();
    reader.onload=ev=>{
        document.getElementById('cropImage').src=ev.target.result;
        document.getElementById('cropModal').classList.add('show');
        setTimeout(()=>{
            if(cropper)cropper.destroy();
            cropper=new Cropper(document.getElementById('cropImage'),{aspectRatio:9/16,viewMode:1,autoCropArea:1,responsive:true,background:false});
        },200);
    };
    reader.readAsDataURL(f);
    e.target.value='';
}
function openCrop(){document.getElementById('cropModal').classList.add('show');}
function doCrop(){
    if(!cropper)return;
    const c=cropper.getCroppedCanvas({width:600,height:1067});
    if(!c){alert('Error');return;}
    const data=c.toDataURL('image/jpeg',0.85);
    const prev=document.getElementById('photoPreview');
    prev.innerHTML=`<img src="${data}">`;
    currentPhotoData=data;
    document.getElementById('cropBtn').style.display='inline-block';
    closeCrop();
}
function closeCrop(){
    if(cropper){cropper.destroy();cropper=null;}
    document.getElementById('cropModal').classList.remove('show');
}

// ============ SAVE PROFILE ============
async function saveProfile(){
    const get=v=>document.getElementById(v)?.value?.trim()||'';
    const p={
        id:Date.now(),
        name:get('fName'),gender:get('fGender'),age:parseInt(get('fAge'))||0,
        height:get('fHeight'),weight:get('fWeight'),maritalStatus:get('fMarital'),
        gotra:get('fGotra'),fatherName:get('fFather'),motherName:get('fMother'),
        profession:get('fProfession'),location:get('fLocation'),community:get('fCommunity'),
        mobile:get('fMobile'),education:get('fEducation'),income:get('fIncome'),
        about:get('fAbout'),image:currentPhotoData,createdAt:new Date().toISOString()
    };
    if(!p.name||!p.gender||!p.age||!p.profession||!p.location||!p.community){alert('Fill required fields (*)');return;}
    await save(p);
    profiles=await allProfiles();
    updateStats();renderGrid(profiles);resetForm();
    alert('✅ Saved!');
    showPage('home');
}
function resetForm(){
    document.getElementById('profileForm').reset();
    document.getElementById('photoPreview').innerHTML='<span>📷 Tap to select</span>';
    currentPhotoData=null;
    document.getElementById('cropBtn').style.display='none';
    if(cropper){cropper.destroy();cropper=null;}
}

// ============ DELETE ============
async function deleteProfile(id){
    if(!confirm('Delete?'))return;
    await del(id);
    profiles=await allProfiles();
    updateStats();renderGrid(profiles);
}

// ============ SHARE CARD (WITHOUT ABOUT SECTION) ============
async function shareCard(id) {
    const p = profiles.find(x => x.id === id);
    if (!p) return;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 1080;
    canvas.height = 1920;

    // 1. Deep Orange Background
    ctx.fillStyle = '#E86A17'; 
    ctx.fillRect(0, 0, 1080, 1920);

    // 2. White Card with Drop Shadow
    const cardX = 30, cardY = 30, cardW = 1020, cardH = 1860, radius = 60;
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 10;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, radius);
    ctx.fillStyle = '#FFFDF8';
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // 3. Top & Bottom Floral Corner Decorations
    drawFloralCorner(ctx, 30, 30, 1, 1);
    drawFloralCorner(ctx, 1050, 30, -1, 1);
    drawFloralCorner(ctx, 30, 1890, 1, -1);
    drawFloralCorner(ctx, 1050, 1890, -1, -1);

    // 4. Top Center Decorative Line + Flower
    drawTopDecoration(ctx, 540, 80);

    // ================= PROFILE IMAGE / PLACEHOLDER =================
    const imgX = 324, imgY = 120, imgW = 432, imgH = 768;
    
    if (p.image && p.image !== '') {
        const img = new Image();
        img.src = p.image;
        await new Promise(r => { img.onload = r; });

        const targetW = 432, targetH = 768;
        const imgRatio = img.width / img.height;
        const targetRatio = targetW / targetH;
        let sx, sy, sw, sh;
        if (imgRatio > targetRatio) {
            sh = img.height; sw = img.height * targetRatio;
            sx = (img.width - sw) / 2; sy = 0;
        } else {
            sw = img.width; sh = img.width / targetRatio;
            sx = 0; sy = (img.height - sh) / 2;
        }
        
        ctx.shadowColor = 'rgba(200, 100, 20, 0.3)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetY = 5;
        ctx.fillStyle = '#E86A17';
        ctx.beginPath();
        ctx.roundRect(imgX - 8, imgY - 8, imgW + 16, imgH + 16, 30);
        ctx.fill();
        
        ctx.shadowColor = 'transparent';
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.roundRect(imgX - 4, imgY - 4, imgW + 8, imgH + 8, 25);
        ctx.fill();

        ctx.save();
        ctx.beginPath();
        ctx.roundRect(imgX, imgY, imgW, imgH, 20);
        ctx.clip();
        ctx.drawImage(img, sx, sy, sw, sh, imgX, imgY, imgW, imgH);
        ctx.restore();
    } else {
        ctx.shadowColor = 'rgba(200, 100, 20, 0.2)';
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#E86A17';
        ctx.beginPath();
        ctx.roundRect(imgX - 8, imgY - 8, imgW + 16, imgH + 16, 30);
        ctx.fill();

        ctx.shadowColor = 'transparent';
        ctx.fillStyle = '#FFF9F0';
        ctx.beginPath();
        ctx.roundRect(imgX - 4, imgY - 4, imgW + 8, imgH + 8, 25);
        ctx.fill();

        const gradient = ctx.createLinearGradient(imgX, imgY, imgX + imgW, imgY + imgH);
        gradient.addColorStop(0, '#FFF0E0');
        gradient.addColorStop(1, '#FFDCC0');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(imgX, imgY, imgW, imgH, 20);
        ctx.fill();

        ctx.fillStyle = '#C95A0E';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        let initial = p.name.charAt(0).toUpperCase();
        ctx.font = 'bold 180px Georgia, "Times New Roman", serif';
        ctx.fillText(initial, 540, 480);
        
        ctx.font = '60px Arial, sans-serif';
        ctx.fillStyle = '#E86A17';
        ctx.fillText(p.gender === 'Bride' ? '👰' : '🤵', 540, 650);
        ctx.textBaseline = 'alphabetic';
    }

    // 5. Name (Auto-scaling)
    ctx.fillStyle = '#C95A0E';
    ctx.textAlign = 'center';
    let nameFontSize = 80;
    ctx.font = `bold ${nameFontSize}px Georgia, "Times New Roman", serif`;
    const maxWidth = 700;
    while (ctx.measureText(p.name).width > maxWidth && nameFontSize > 40) {
        nameFontSize -= 2;
        ctx.font = `bold ${nameFontSize}px Georgia, "Times New Roman", serif`;
    }
    ctx.fillText(p.name, 540, 970);

    // 6. Age & Gender
    ctx.fillStyle = '#444';
    ctx.font = '32px Arial, sans-serif';
    ctx.fillText(`${p.age} yrs • ${p.gender === 'Bride' ? '👰 Bride' : '🤵 Groom'}`, 540, 1025);

    // 7. Designer Divider
    drawDesignerDivider(ctx, 540, 1060);

    // 8. Details Grid (2 Columns) - NO ABOUT SECTION
    const details = [
        ['📏 Height', p.height], ['⚖️ Weight', p.weight],
        ['💍 Status', p.maritalStatus], ['🕉️ Gotra', p.gotra],
        ['👨 Father', p.fatherName], ['👩 Mother', p.motherName],
        ['💼 Profession', p.profession], ['🎓 Education', p.education],
        ['💰 Income', p.income], ['👥 Community', p.community],
        ['📍 Location', p.location], ['📞 Contact', p.mobile]
    ];

    let yBase = 1110;

    for (let i = 0; i < details.length; i += 2) {
        const left = details[i];
        const right = details[i + 1];

        const leftShow = left && left[1] && left[1].trim() !== "" && left[1] !== "Not specified";
        const rightShow = right && right[1] && right[1].trim() !== "" && right[1] !== "Not specified";

        if (!leftShow && !rightShow) continue;

        if (leftShow) drawPremiumBox(ctx, left, 135, yBase, 380);
        if (rightShow) drawPremiumBox(ctx, right, 565, yBase, 380);

        yBase += 100;
    }

    yBase += 80;

    // 9. Bottom Floral Decoration
    drawBottomDecoration(ctx, 540, yBase + 60);

    // 10. App Name 
    ctx.fillStyle = '#C95A0E';
    ctx.font = 'bold 50px Georgia, "Times New Roman", serif';
    ctx.textAlign = 'center';
    ctx.fillText('Gayatri Vivah Sutra', 540, 1850);

    // Share/Download
    const blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', 0.95));
    const file = new File([blob], `${p.name}_Profile.jpg`, { type: 'image/jpeg' });
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: `${p.name}`, files: [file] });
    } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `${p.name}_Profile.jpg`;
        document.body.appendChild(a); a.click();
        document.body.removeChild(a); URL.revokeObjectURL(url);
        alert('📥 Downloaded!');
    }
}

// ================= HELPER FUNCTIONS =================
function drawFloralCorner(ctx, x, y, dirX, dirY) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(dirX, dirY);
    ctx.strokeStyle = '#E86A17';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(60, 0, 100, 40, 100, 100);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(0, 60, 40, 100, 100, 100);
    ctx.stroke();
    ctx.fillStyle = '#E86A17';
    for(let i=0; i<3; i++){
        let px = 30 + i*20, py = 30 + i*10;
        ctx.beginPath();
        ctx.ellipse(px, py-10, 12, 6, 0.5, 0, Math.PI*2);
        ctx.fill();
    }
    ctx.restore();
}

function drawTopDecoration(ctx, cx, y) {
    ctx.strokeStyle = '#E86A17'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx-150, y); ctx.lineTo(cx-50, y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx-140, y+15); ctx.lineTo(cx-60, y+15); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx+150, y); ctx.lineTo(cx+50, y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx+140, y+15); ctx.lineTo(cx+60, y+15); ctx.stroke();
    ctx.fillStyle = '#E86A17';
    for(let i=0; i<6; i++){
        let angle = (i * 60) * Math.PI / 180;
        ctx.beginPath(); ctx.ellipse(cx + Math.cos(angle)*15, y+5 + Math.sin(angle)*15, 12, 6, angle, 0, Math.PI*2);
        ctx.fill();
    }
    ctx.beginPath(); ctx.arc(cx, y+5, 8, 0, Math.PI*2); ctx.fillStyle = '#FFF'; ctx.fill(); ctx.fillStyle = '#E86A17'; ctx.beginPath(); ctx.arc(cx, y+5, 3, 0, Math.PI*2); ctx.fill();
}

function drawDesignerDivider(ctx, cx, y) {
    ctx.strokeStyle = '#E86A17'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx-300, y); ctx.lineTo(cx-40, y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx+300, y); ctx.lineTo(cx+40, y); ctx.stroke();
    ctx.fillStyle = '#E86A17';
    for(let i=0; i<3; i++){
        let px = cx - 250 + i*80;
        ctx.beginPath(); ctx.ellipse(px, y-12, 10, 5, -0.3, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(px, y+12, 10, 5, 0.3, 0, Math.PI*2); ctx.fill();
    }
    ctx.beginPath(); ctx.arc(cx, y, 8, 0, Math.PI*2); ctx.fillStyle = '#E86A17'; ctx.fill();
    ctx.beginPath(); ctx.arc(cx, y, 3, 0, Math.PI*2); ctx.fillStyle = '#FFF'; ctx.fill();
}

function drawPremiumBox(ctx, detail, x, y, width) {
    let [label, value] = detail;
    if (!value || value === 'Not specified' || value === '') return;
    ctx.shadowColor = 'rgba(0,0,0,0.03)'; ctx.shadowBlur = 5;
    ctx.fillStyle = '#FFFBF5';
    ctx.strokeStyle = '#E86A17'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.roundRect(x, y, width, 75, 12); ctx.fill(); ctx.stroke();
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = '#C95A0E'; ctx.font = 'bold 18px Arial, sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(label, x + 18, y + 32);
    ctx.fillStyle = '#222'; ctx.font = '22px Arial, sans-serif';
    ctx.fillText(value, x + 18, y + 62);
}

function drawBottomDecoration(ctx, cx, y) {
    ctx.strokeStyle = '#E86A17'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(cx-250, y); ctx.lineTo(cx-50, y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx+250, y); ctx.lineTo(cx+50, y); ctx.stroke();
    ctx.fillStyle = '#E86A17';
    for(let i=0; i<4; i++){
        let px = cx - 150 + i*100;
        ctx.beginPath(); ctx.ellipse(px, y-10, 10, 5, 0, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(px, y+10, 10, 5, 0, 0, Math.PI*2); ctx.fill();
    }
    ctx.beginPath(); ctx.arc(cx, y, 10, 0, Math.PI*2); ctx.fillStyle = '#FFF'; ctx.fill(); ctx.fillStyle = '#E86A17'; ctx.beginPath(); ctx.arc(cx, y, 4, 0, Math.PI*2); ctx.fill();
}

// Polyfill for roundRect
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
        if (r > w / 2) r = w / 2; if (r > h / 2) r = h / 2;
        this.moveTo(x + r, y); this.lineTo(x + w - r, y);
        this.quadraticCurveTo(x + w, y, x + w, y + r);
        this.lineTo(x + w, y + h - r); this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        this.lineTo(x + r, y + h); this.quadraticCurveTo(x, y + h, x, y + h - r);
        this.lineTo(x, y + r); this.quadraticCurveTo(x, y, x + r, y);
        return this;
    };
}

// ============ IMAGE VIEWER ============
function viewFull(src){if(src){document.getElementById('fullImage').src=src;document.getElementById('imageViewer').classList.add('show');}}
function closeImageViewer(){document.getElementById('imageViewer').classList.remove('show');}

// ============ BACKUP ============
async function downloadBackup(){
    const all=await allProfiles();
    const data={version:"7.0",timestamp:new Date().toISOString(),total:all.length,profiles:all};
    const str=JSON.stringify(data);
    const blob=new Blob([str],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download=`vivah-backup-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);
    alert(`✅ Backup done! ${all.length} profiles`);
}
async function restoreBackup(e){
    const f=e.target.files[0];if(!f)return;
    const reader=new FileReader();
    reader.onload=async ev=>{
        try{
            const data=JSON.parse(ev.target.result);
            if(!data.profiles?.length)throw new Error('Empty');
            if(confirm(`Restore ${data.profiles.length} profiles?`)){
                await clearAll();await bulkAdd(data.profiles);
                profiles=await allProfiles();updateStats();renderGrid(profiles);
                alert('✅ Restored!');
            }
        }catch(err){alert('❌ Invalid file');}
    };
    reader.readAsText(f);e.target.value='';
}
async function clearAllData(){
    if(!confirm('Delete ALL?'))return;
    await clearAll();
    profiles=[];updateStats();renderGrid(profiles);
    alert('✅ Cleared');
}

// ============ SW ============
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js');

// ============ SYNC FROM GITHUB ============
async function syncFromGitHub() {
    try {
        const res = await fetch('https://long-dream-947d.yatharthg833.workers.dev/', {
            cache: 'no-cache'
        });
        const remote = await res.json();
        
        if (remote && remote.length > 0) {
            await clearAll();
            await bulkAdd(remote);
            profiles = remote;
            updateStats();
            renderGrid(profiles);
            alert('✅ ' + profiles.length + ' profiles loaded');
        } else {
            alert('📭 No profiles found');
        }
    } catch(err) {
        alert('📴 Offline - using saved data');
    }
            }
