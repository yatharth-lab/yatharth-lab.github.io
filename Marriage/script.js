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
                ${p.about&&p.about!=='No description'?`<div style="margin-top:10px;background:#fff7e0;padding:12px;border-radius:10px;"><strong>📝 About:</strong><br>${p.about}</div>`:''}
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

// ============ SHARE CARD ============
async function shareCard(id){
    const p=profiles.find(x=>x.id===id);
    if(!p)return;
    const canvas=document.createElement('canvas');
    const ctx=canvas.getContext('2d');
    canvas.width=1080;canvas.height=1920;
    const grad=ctx.createLinearGradient(0,0,0,1920);
    grad.addColorStop(0,'#FF8C00');grad.addColorStop(0.35,'#FFB300');grad.addColorStop(1,'#FFFFFF');
    ctx.fillStyle=grad;ctx.fillRect(0,0,1080,1920);
    ctx.fillStyle='#FFF';ctx.shadowColor='rgba(0,0,0,0.1)';ctx.shadowBlur=30;
    ctx.beginPath();ctx.roundRect(50,350,980,1420,50);ctx.fill();
    ctx.shadowColor='transparent';ctx.shadowBlur=0;
    ctx.fillStyle='#FF8C00';ctx.font='bold 50px Arial';ctx.textAlign='center';ctx.fillText('💑 VIVAH SUTRA',540,100);
    if(p.image){const img=new Image();img.src=p.image;await new Promise(r=>{img.onload=r;});ctx.save();ctx.beginPath();ctx.arc(540,280,130,0,Math.PI*2);ctx.clip();ctx.drawImage(img,410,150,260,260);ctx.restore();}
    else{ctx.fillStyle='#FFC107';ctx.beginPath();ctx.arc(540,280,130,0,Math.PI*2);ctx.fill();ctx.fillStyle='#FFF';ctx.font='80px Arial';ctx.fillText(p.gender==='Bride'?'👰':'🤵',540,310);}
    ctx.fillStyle='#333';ctx.font='bold 55px Arial';ctx.fillText(`${p.name}, ${p.age} yrs`,540,460);
    ctx.fillStyle='#FF8C00';ctx.font='35px Arial';ctx.fillText(p.gender==='Bride'?'👰 Bride':'🤵 Groom',540,520);
    let y=640;
    [['📏 Height',p.height],['⚖️ Weight',p.weight],['💍 Status',p.maritalStatus],['🕉️ Gotra',p.gotra],['👨 Father',p.fatherName],['👩 Mother',p.motherName],['💼 Profession',p.profession],['📍 Location',p.location],['👥 Community',p.community],['📞 Contact',p.mobile],['🎓 Education',p.education],['💰 Income',p.income]].forEach(([l,v])=>{
        if(v&&v!=='Not specified'){ctx.fillStyle='#FFF3E0';ctx.beginPath();ctx.roundRect(120,y-25,840,55,15);ctx.fill();ctx.fillStyle='#333';ctx.font='bold 30px Arial';ctx.textAlign='left';ctx.fillText(l+':',140,y+12);ctx.fillStyle='#555';ctx.font='30px Arial';ctx.fillText(v,500,y+12);y+=80;}
    });
    ctx.fillStyle='#FF8C00';ctx.font='bold 35px Arial';ctx.textAlign='center';ctx.fillText('💑 Vivah Sutra App',540,1820);
    const blob=await new Promise(r=>canvas.toBlob(r,'image/jpeg',0.9));
    const file=new File([blob],`${p.name}_Profile.jpg`,{type:'image/jpeg'});
    if(navigator.share&&navigator.canShare?.({files:[file]})){await navigator.share({title:`${p.name}`,files:[file]});}
    else{const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`${p.name}_Profile.jpg`;document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);alert('📥 Downloaded!');}
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
    // ⚠️ SAME TOKEN, OWNER, REPO DAALO
    const TOKEN = 'YOUR_GITHUB_TOKEN_HERE';
    const OWNER = 'YOUR_GITHUB_USERNAME_HERE';
    const REPO = 'vivah-profiles';
    
    try {
        const res = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/issues?labels=biodata&state=open&per_page=100`, {
            headers: { 'Authorization': `token ${TOKEN}`, 'User-Agent': 'VivahSutra' }
        });
        
        const issues = await res.json();
        
        const remoteProfiles = issues.map(issue => {
            try { return JSON.parse(issue.body); } catch(e) { return null; }
        }).filter(p => p !== null);
        
        // Replace local data with remote
        await clearAll();
        await bulkAdd(remoteProfiles);
        profiles = remoteProfiles;
        
        updateStats();
        renderGrid(profiles);
        alert(`✅ Synced! ${profiles.length} profiles`);
    } catch(err) {
        alert('📴 Offline - showing saved data');
    }
}
