/* =========================================================
   गायत्री चेतना केन्द्र
   SHOW ALL SYSTEM
   =========================================================

   FEATURES

   ✓ GitHub Issues से पंजीकरण
   ✓ Search
   ✓ Private Repository Photos
   ✓ IndexedDB Offline Data
   ✓ Offline Photos
   ✓ Automatic Online Sync
   ✓ Manual Sync
   ✓ Detail View
   ✓ Hindi ID Card PNG
   ✓ Manual Photo Crop
   ✓ Fixed Crop Ratio = 325 : 375
   ✓ Mobile Touch Crop
   ✓ Desktop Mouse Crop
   ✓ Service Worker

   IMPORTANT

   ID CARD PHOTO:
   325 × 375
   Ratio = 13 : 15

========================================================= */


/* =========================================================
   CONFIG
========================================================= */

const STORAGE_KEY =
  "gck_show_all_login";

const DB_NAME =
  "gayatri_chetna_offline_db";

const DB_VERSION = 1;

const STORE_NAME =
  "registrations";

const GITHUB_API_VERSION =
  "2022-11-28";


const PHOTO_WIDTH = 325;
const PHOTO_HEIGHT = 375;

const CROP_RATIO =
  PHOTO_WIDTH / PHOTO_HEIGHT;


/* =========================================================
   GLOBAL
========================================================= */

let githubConfig = null;

let registrations = [];


/* =========================================================
   DOM
========================================================= */

const loginView =
  document.getElementById("loginView");

const listView =
  document.getElementById("listView");

const detailView =
  document.getElementById("detailView");

const usernameInput =
  document.getElementById("username");

const repoInput =
  document.getElementById("repo");

const tokenInput =
  document.getElementById("token");

const loginButton =
  document.getElementById("loginButton");

const loginError =
  document.getElementById("loginError");

const searchBox =
  document.getElementById("search");

const refreshButton =
  document.getElementById("refreshButton");

const logoutButton =
  document.getElementById("logoutButton");

const syncBox =
  document.getElementById("syncBox");

const registrationList =
  document.getElementById("registrationList");

const backButton =
  document.getElementById("backButton");

const detailCard =
  document.getElementById("detailCard");


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHTML(value){

  return String(value ?? "")
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#039;");

}


/* =========================================================
   NORMALIZE
========================================================= */

function normalize(value){

  return String(value ?? "")
    .normalize("NFKC")
    .toLocaleLowerCase("hi-IN")
    .replace(/\s+/g," ")
    .trim();

}


/* =========================================================
   ERROR
========================================================= */

function showError(message){

  if(!loginError){
    return;
  }

  loginError.textContent =
    message || "";

  loginError.style.display =
    "block";

}


function hideError(){

  if(!loginError){
    return;
  }

  loginError.textContent =
    "";

  loginError.style.display =
    "none";

}


/* =========================================================
   SYNC MESSAGE
========================================================= */

function showSync(message){

  if(!syncBox){
    return;
  }

  syncBox.textContent =
    message || "";

  syncBox.style.display =
    message ? "block" : "none";

}


function hideSync(){

  if(!syncBox){
    return;
  }

  syncBox.textContent =
    "";

  syncBox.style.display =
    "none";

}


/* =========================================================
   GITHUB HEADERS
========================================================= */

function githubHeaders(){

  if(!githubConfig){
    throw new Error(
      "GitHub configuration उपलब्ध नहीं है।"
    );
  }

  return {

    "Accept":
      "application/vnd.github+json",

    "Authorization":
      `Bearer ${githubConfig.token}`,

    "X-GitHub-Api-Version":
      GITHUB_API_VERSION

  };

}


/* =========================================================
   GITHUB CONTENT URL
========================================================= */

function githubContentURL(path){

  const cleanPath =
    String(path || "")
      .trim()
      .replace(/^\/+/,"");

  if(!cleanPath){
    return "";
  }

  const encodedPath =
    cleanPath
      .split("/")
      .map(
        part =>
          encodeURIComponent(part)
      )
      .join("/");

  return (
    "https://api.github.com/repos/" +
    encodeURIComponent(
      githubConfig.username
    ) +
    "/" +
    encodeURIComponent(
      githubConfig.repo
    ) +
    "/contents/" +
    encodedPath
  );

}


/* =========================================================
   LOGIN STORAGE
========================================================= */

function saveLogin(){

  if(!githubConfig){
    return;
  }

  localStorage.setItem(

    STORAGE_KEY,

    JSON.stringify({

      username:
        githubConfig.username,

      repo:
        githubConfig.repo,

      token:
        githubConfig.token

    })

  );

}


function loadLogin(){

  try{

    const raw =
      localStorage.getItem(
        STORAGE_KEY
      );

    if(!raw){
      return false;
    }

    const saved =
      JSON.parse(raw);

    if(
      !saved.username ||
      !saved.repo ||
      !saved.token
    ){

      return false;

    }

    githubConfig = {

      username:
        saved.username,

      repo:
        saved.repo,

      token:
        saved.token

    };

    return true;

  }catch(error){

    console.warn(
      "Login load error:",
      error
    );

    return false;

  }

}


function clearLogin(){

  localStorage.removeItem(
    STORAGE_KEY
  );

  githubConfig = null;

}


/* =========================================================
   INDEXED DB
========================================================= */

function openDatabase(){

  return new Promise(
    (resolve,reject)=>{

      if(
        !window.indexedDB
      ){

        reject(
          new Error(
            "इस browser में IndexedDB उपलब्ध नहीं है।"
          )
        );

        return;

      }

      const request =
        indexedDB.open(
          DB_NAME,
          DB_VERSION
        );

      request.onupgradeneeded =
        function(){

          const db =
            request.result;

          if(
            !db.objectStoreNames.contains(
              STORE_NAME
            )
          ){

            db.createObjectStore(
              STORE_NAME,
              {
                keyPath:"key"
              }
            );

          }

        };

      request.onsuccess =
        function(){

          resolve(
            request.result
          );

        };

      request.onerror =
        function(){

          reject(
            request.error
          );

        };

    }
  );

}


/* =========================================================
   SAVE OFFLINE DATA
========================================================= */

async function saveOfflineData(){

  if(!githubConfig){
    return;
  }

  try{

    const db =
      await openDatabase();

    const key =
      githubConfig.username +
      "/" +
      githubConfig.repo;

    await new Promise(
      (resolve,reject)=>{

        const transaction =
          db.transaction(
            STORE_NAME,
            "readwrite"
          );

        const store =
          transaction.objectStore(
            STORE_NAME
          );

        store.put({

          key:key,

          savedAt:
            Date.now(),

          registrations:
            registrations

        });

        transaction.oncomplete =
          resolve;

        transaction.onerror =
          function(){

            reject(
              transaction.error
            );

          };

      }
    );

    db.close();

  }catch(error){

    console.warn(
      "Offline save error:",
      error
    );

  }

}


/* =========================================================
   LOAD OFFLINE DATA
========================================================= */

async function loadOfflineData(){

  if(!githubConfig){
    return null;
  }

  try{

    const db =
      await openDatabase();

    const key =
      githubConfig.username +
      "/" +
      githubConfig.repo;

    const result =
      await new Promise(
        (resolve,reject)=>{

          const transaction =
            db.transaction(
              STORE_NAME,
              "readonly"
            );

          const store =
            transaction.objectStore(
              STORE_NAME
            );

          const request =
            store.get(key);

          request.onsuccess =
            function(){

              resolve(
                request.result ||
                null
              );

            };

          request.onerror =
            function(){

              reject(
                request.error
              );

            };

        }
      );

    db.close();

    return result;

  }catch(error){

    console.warn(
      "Offline load error:",
      error
    );

    return null;

  }

}


/* =========================================================
   GET ALL ISSUES
========================================================= */

async function getAllIssues(){

  let allIssues = [];

  for(
    let page = 1;
    page <= 20;
    page++
  ){

    const url =
      "https://api.github.com/repos/" +
      encodeURIComponent(
        githubConfig.username
      ) +
      "/" +
      encodeURIComponent(
        githubConfig.repo
      ) +
      "/issues" +
      "?state=all" +
      "&per_page=100" +
      "&page=" +
      page;

    let response;

    try{

      response =
        await fetch(
          url,
          {
            method:"GET",
            headers:
              githubHeaders()
          }
        );

    }catch(error){

      const err =
        new Error(
          "GitHub से कनेक्शन नहीं हो पाया। Internet check करें।"
        );

      err.status = 0;

      throw err;

    }

    let data = null;

    try{

      data =
        await response.json();

    }catch{

      data = null;

    }

    if(!response.ok){

      let message =
        data?.message ||
        "GitHub request failed";

      if(response.status === 401){

        message =
          "GitHub Token गलत या expired है।";

      }else if(response.status === 403){

        message =
          "Token के पास Repository access नहीं है या GitHub rate limit हो गई है।";

      }else if(response.status === 404){

        message =
          "Repository नहीं मिली। Username और Repository check करें।";

      }

      const error =
        new Error(message);

      error.status =
        response.status;

      throw error;

    }

    if(!Array.isArray(data)){
      break;
    }

    allIssues.push(...data);

    if(data.length < 100){
      break;
    }

  }

  return allIssues.filter(
    issue =>
      !issue.pull_request
  );

}


/* =========================================================
   FIELD READER
========================================================= */

function getField(body,label){

  const safeLabel =
    String(label)
      .replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

  const patterns = [

    new RegExp(
      "\\*\\*" +
      safeLabel +
      "\\s*:\\s*\\*\\*\\s*(.*)",
      "i"
    ),

    new RegExp(
      "\\*\\*" +
      safeLabel +
      "\\*\\*\\s*:\\s*(.*)",
      "i"
    ),

    new RegExp(
      "^" +
      safeLabel +
      "\\s*:\\s*(.*)",
      "im"
    )

  ];

  for(
    const regex of patterns
  ){

    const match =
      String(body || "")
        .match(regex);

    if(match){

      return String(
        match[1]
      )
        .replace(/^`/,"")
        .replace(/`$/,"")
        .trim();

    }

  }

  return "";

}


/* =========================================================
   IMAGE PATH
========================================================= */

function getImagePath(body){

  const text =
    String(body || "");

  let match =
    text.match(
      /\*\*Image Path:\*\*\s*`([^`]+)`/i
    );

  if(match){
    return match[1].trim();
  }

  match =
    text.match(
      /\*\*Image Path:\*\*\s*([^\r\n]+)/i
    );

  if(match){

    return match[1]
      .trim()
      .replace(/^`/,"")
      .replace(/`$/,"");

  }

  match =
    text.match(
      /\*\*(?:फोटो पथ|फोटो का पथ):\*\*\s*`([^`]+)`/i
    );

  if(match){
    return match[1].trim();
  }

  match =
    text.match(
      /\*\*(?:फोटो पथ|फोटो का पथ):\*\*\s*([^\r\n]+)/i
    );

  if(match){

    return match[1]
      .trim()
      .replace(/^`/,"")
      .replace(/`$/,"");

  }

  return "";

}


/* =========================================================
   PARSE ISSUE
========================================================= */

function parseIssue(issue){

  const body =
    issue.body || "";

  const registrationID =
    getField(
      body,
      "पंजीकरण क्रमांक"
    );

  const name =
    getField(
      body,
      "नाम"
    );

  const fatherName =
    getField(
      body,
      "पिता का नाम"
    );

  const mobile =
    getField(
      body,
      "मोबाइल नंबर"
    );

  const age =
    getField(
      body,
      "आयु"
    );

  const city =
    getField(
      body,
      "शहर / कस्बा / ग्राम"
    );

  const education =
    getField(
      body,
      "शिक्षा"
    );

  const income =
    getField(
      body,
      "आय / Income"
    );

  const dikshaTaken =
    getField(
      body,
      "दीक्षा ली है?"
    );

  const dikshaDate =
    getField(
      body,
      "दीक्षा की तिथि"
    );

  const dikshaPlace =
    getField(
      body,
      "दीक्षा का स्थान"
    );


  let anshdaan = "";

  const anshMatch =
    body.match(
      /##\s*अंशदान\s*([\s\S]*?)(?=---|##\s*समयदान|##\s*फोटो|$)/i
    );

  if(anshMatch){

    anshdaan =
      anshMatch[1].trim();

  }


  let samaydaan = "";

  const samayMatch =
    body.match(
      /##\s*समयदान\s*([\s\S]*?)(?=---|##\s*फोटो|$)/i
    );

  if(samayMatch){

    samaydaan =
      samayMatch[1].trim();

  }


  return {

    issueNumber:
      issue.number,

    id:
      registrationID,

    name:
      name,

    fatherName:
      fatherName,

    mobile:
      mobile,

    age:
      age,

    city:
      city,

    education:
      education,

    income:
      income,

    dikshaTaken:
      dikshaTaken,

    dikshaDate:
      dikshaDate,

    dikshaPlace:
      dikshaPlace,

    anshdaan:
      anshdaan,

    samaydaan:
      samaydaan,

    imagePath:
      getImagePath(body),

    image:
      "",

    croppedImage:
      "",

    issueURL:
      issue.html_url || "",

    createdAt:
      issue.created_at || ""

  };

}


/* =========================================================
   PRIVATE IMAGE
========================================================= */

async function loadPrivateImage(
  imagePath
){

  if(
    !githubConfig ||
    !imagePath
  ){

    return "";

  }

  try{

    const url =
      githubContentURL(
        imagePath
      );

    if(!url){
      return "";
    }

    const response =
      await fetch(
        url,
        {
          method:"GET",
          headers:
            githubHeaders()
        }
      );

    if(!response.ok){

      console.warn(
        "Private image failed:",
        imagePath,
        response.status
      );

      return "";

    }

    const data =
      await response.json();

    if(
      !data ||
      !data.content
    ){

      return "";

    }

    const base64 =
      String(data.content)
        .replace(/\s/g,"");

    let mime =
      "image/jpeg";

    const lower =
      imagePath.toLowerCase();

    if(lower.endsWith(".png")){

      mime =
        "image/png";

    }else if(lower.endsWith(".webp")){

      mime =
        "image/webp";

    }else if(lower.endsWith(".gif")){

      mime =
        "image/gif";

    }

    return (
      "data:" +
      mime +
      ";base64," +
      base64
    );

  }catch(error){

    console.warn(
      "Private image error:",
      imagePath,
      error
    );

    return "";

  }

}


/* =========================================================
   LOAD ALL IMAGES
========================================================= */

async function loadImages(items){

  const total =
    items.length;

  let loaded = 0;

  for(
    const item of items
  ){

    loaded++;

    if(item.image){
      continue;
    }

    if(!item.imagePath){
      continue;
    }

    showSync(
      `फोटो लोड हो रही है... ${loaded}/${total}`
    );

    const image =
      await loadPrivateImage(
        item.imagePath
      );

    if(image){

      item.image =
        image;

    }

  }

  hideSync();

  return items;

}


/* =========================================================
   SYNC
========================================================= */

async function syncFromGitHub(){

  showSync(
    "GitHub से पंजीकरण जानकारी लोड हो रही है..."
  );

  const issues =
    await getAllIssues();

  let parsed =
    issues.map(
      parseIssue
    );

  parsed =
    parsed.filter(
      item =>
        item.id ||
        item.name ||
        item.mobile
    );

  parsed.sort(
    (a,b)=>{

      const aTime =
        new Date(
          a.createdAt
        ).getTime() || 0;

      const bTime =
        new Date(
          b.createdAt
        ).getTime() || 0;

      return bTime - aTime;

    }
  );

  parsed =
    await loadImages(
      parsed
    );

  registrations =
    parsed;

  await saveOfflineData();

  return registrations;

}


/* =========================================================
   RENDER LIST
========================================================= */

function renderList(items){

  if(
    !items ||
    !items.length
  ){

    registrationList.innerHTML = `
      <div class="status">
        कोई पंजीकरण नहीं मिला।
      </div>
    `;

    return;

  }

  registrationList.innerHTML =
    "";

  items.forEach(
    item => {

      const card =
        document.createElement(
          "div"
        );

      card.className =
        "registration";


      let photoHTML;


      if(item.image){

        photoHTML = `
          <img
            class="thumb"
            src="${escapeHTML(item.image)}"
            alt="पंजीकरण फोटो"
          >
        `;

      }else{

        photoHTML = `
          <div class="no-photo">
            फोटो<br>नहीं
          </div>
        `;

      }


      card.innerHTML = `

        ${photoHTML}

        <div class="basic">

          <div class="name">
            ${escapeHTML(
              item.name ||
              "नाम उपलब्ध नहीं"
            )}
          </div>

          <div class="place">
            ${escapeHTML(
              item.city ||
              "स्थान उपलब्ध नहीं"
            )}
          </div>

          <div class="regid">
            ${escapeHTML(
              item.id ||
              "पंजीकरण क्रमांक उपलब्ध नहीं"
            )}
          </div>

        </div>

        <button
          class="make-card"
          type="button"
        >
          आईडी कार्ड
        </button>

        <div
          class="arrow"
          aria-label="विवरण देखें"
        >
          ›
        </div>

      `;


      card.addEventListener(
        "click",
        function(){

          showDetail(item);

        }
      );


      const idButton =
        card.querySelector(
          ".make-card"
        );


      if(idButton){

        idButton.addEventListener(
          "click",
          async function(event){

            event.preventDefault();

            event.stopPropagation();

            await downloadIDCard(
              item
            );

          }
        );

      }


      registrationList.appendChild(
        card
      );

    }
  );

}


/* =========================================================
   SEARCH
========================================================= */

function performSearch(){

  if(!searchBox){
    return;
  }

  const query =
    normalize(
      searchBox.value
    );

  if(!query){

    renderList(
      registrations
    );

    return;

  }

  const filtered =
    registrations.filter(
      item => {

        return [

          item.name,
          item.id,
          item.mobile,
          item.fatherName,
          item.city,
          item.education

        ].some(
          value =>
            normalize(value)
              .includes(query)
        );

      }
    );

  renderList(
    filtered
  );

}


if(searchBox){

  searchBox.addEventListener(
    "input",
    performSearch
  );

}


/* =========================================================
   DETAIL ROW
========================================================= */

function detailRow(
  label,
  value
){

  return `

    <div class="detail-row">

      <div class="detail-label">
        ${escapeHTML(label)}
      </div>

      <div class="detail-value">
        ${escapeHTML(
          value || "—"
        )}
      </div>

    </div>

  `;

}


/* =========================================================
   DETAIL VIEW
========================================================= */

function showDetail(item){

  if(!listView || !detailView){
    return;
  }

  listView.style.display =
    "none";

  detailView.style.display =
    "block";


  let photoHTML;


  if(item.image){

    photoHTML = `

      <div class="detail-photo">

        <img
          src="${escapeHTML(
            item.croppedImage ||
            item.image
          )}"
          alt="पंजीकरण फोटो"
        >

      </div>

    `;

  }else{

    photoHTML = `

      <div class="detail-no-photo">
        फोटो उपलब्ध नहीं है।
      </div>

    `;

  }


  let cropButtonHTML =
    "";


  if(item.image){

    cropButtonHTML = `

      <button
        id="detailCropButton"
        class="crop-btn"
        type="button"
      >
        ✂️ फोटो क्रॉप करें
        ${
          item.croppedImage
            ? "(दोबारा)"
            : ""
        }
      </button>

    `;

  }


  detailCard.innerHTML = `

    ${photoHTML}

    ${cropButtonHTML}

    <h2 class="detail-title">
      ${escapeHTML(
        item.name ||
        "पंजीकरण"
      )}
    </h2>

    <div class="detail-registration-id">
      ${escapeHTML(
        item.id || ""
      )}
    </div>


    ${detailRow(
      "नाम",
      item.name
    )}

    ${detailRow(
      "पिता का नाम",
      item.fatherName
    )}

    ${detailRow(
      "मोबाइल नंबर",
      item.mobile
    )}

    ${detailRow(
      "आयु",
      item.age
    )}

    ${detailRow(
      "शहर / कस्बा / ग्राम",
      item.city
    )}

    ${detailRow(
      "शिक्षा",
      item.education
    )}

    ${detailRow(
      "आय",
      item.income
    )}

    ${detailRow(
      "दीक्षा ली है?",
      item.dikshaTaken
    )}

    ${detailRow(
      "दीक्षा की तिथि",
      item.dikshaDate
    )}

    ${detailRow(
      "दीक्षा का स्थान",
      item.dikshaPlace
    )}


    <h3 class="section-title">
      दान विवरण
    </h3>


    ${detailRow(
      "अंशदान",
      item.anshdaan
    )}

    ${detailRow(
      "समयदान",
      item.samaydaan
    )}


    <button
      id="detailIDCardButton"
      class="main-button"
      type="button"
    >
      आईडी कार्ड डाउनलोड करें
    </button>

  `;


  const button =
    document.getElementById(
      "detailIDCardButton"
    );


  if(button){

    button.addEventListener(
      "click",
      async function(event){

        event.preventDefault();

        await downloadIDCard(
          item
        );

      }
    );

  }


  const cropButton =
    document.getElementById(
      "detailCropButton"
    );


  if(cropButton){

    cropButton.addEventListener(
      "click",
      async function(event){

        event.preventDefault();

        await openCropForItem(
          item
        );

      }
    );

  }


  window.scrollTo(
    0,
    0
  );

}


/* =========================================================
   BACK
========================================================= */

if(backButton){

  backButton.addEventListener(
    "click",
    function(){

      detailView.style.display =
        "none";

      listView.style.display =
        "block";

      window.scrollTo(
        0,
        0
      );

    }
  );

}


/* =========================================================
   CANVAS IMAGE LOADER
========================================================= */

function loadImageForCanvas(
  source
){

  return new Promise(
    (resolve,reject)=>{

      const image =
        new Image();

      image.onload =
        function(){

          resolve(image);

        };

      image.onerror =
        function(){

          reject(
            new Error(
              "फोटो/लोगो लोड नहीं हो पाया।"
            )
          );

        };

      image.src =
        source;

    }
  );

}


/* =========================================================
   ROUNDED RECT
========================================================= */

function roundedRect(
  ctx,
  x,
  y,
  width,
  height,
  radius
){

  const r =
    Math.min(
      radius,
      width / 2,
      height / 2
    );

  ctx.beginPath();

  ctx.moveTo(
    x + r,
    y
  );

  ctx.arcTo(
    x + width,
    y,
    x + width,
    y + height,
    r
  );

  ctx.arcTo(
    x + width,
    y + height,
    x,
    y + height,
    r
  );

  ctx.arcTo(
    x,
    y + height,
    x,
    y,
    r
  );

  ctx.arcTo(
    x,
    y,
    x + width,
    y,
    r
  );

  ctx.closePath();

}


/* =========================================================
   COVER IMAGE
========================================================= */

function drawCoverImage(
  ctx,
  image,
  x,
  y,
  width,
  height,
  radius
){

  const sourceWidth =
    image.naturalWidth;

  const sourceHeight =
    image.naturalHeight;

  const scale =
    Math.max(
      width / sourceWidth,
      height / sourceHeight
    );

  const cropWidth =
    width / scale;

  const cropHeight =
    height / scale;

  const sourceX =
    (sourceWidth -
      cropWidth) / 2;

  const sourceY =
    (sourceHeight -
      cropHeight) / 2;


  ctx.save();

  roundedRect(
    ctx,
    x,
    y,
    width,
    height,
    radius
  );

  ctx.clip();

  ctx.drawImage(

    image,

    sourceX,
    sourceY,
    cropWidth,
    cropHeight,

    x,
    y,
    width,
    height

  );

  ctx.restore();

}


/* =========================================================
   TEXT FIT
========================================================= */

function fitText(
  ctx,
  text,
  maxWidth,
  startSize,
  minimumSize
){

  let size =
    startSize;

  while(
    size > minimumSize
  ){

    ctx.font =
      `700 ${size}px "Noto Sans Devanagari", "Nirmala UI", "Mangal", Arial, sans-serif`;

    if(
      ctx.measureText(text)
        .width <= maxWidth
    ){

      break;

    }

    size--;

  }

  return size;

}


/* =========================================================
   DECORATION
========================================================= */

function drawDecoration(
  ctx,
  x,
  y
){

  ctx.save();

  ctx.strokeStyle =
    "#f28c00";

  ctx.lineWidth =
    3;

  ctx.beginPath();

  ctx.arc(
    x,
    y,
    18,
    0,
    Math.PI * 2
  );

  ctx.stroke();

  ctx.beginPath();

  ctx.arc(
    x,
    y,
    9,
    0,
    Math.PI * 2
  );

  ctx.stroke();

  ctx.restore();

}


/* =========================================================
   CROP STATE
========================================================= */

const cropState = {

  imageElement:null,

  naturalWidth:0,

  naturalHeight:0,

  displayWidth:0,

  displayHeight:0,

  x:0,

  y:0,

  width:0,

  height:0,

  startPointerX:0,

  startPointerY:0,

  startX:0,

  startY:0,

  dragging:false

};


/* =========================================================
   CREATE CROP MODAL
========================================================= */

function createCropModal(){

  const old =
    document.getElementById(
      "cropModal"
    );

  if(old){
    old.remove();
  }


  const modal =
    document.createElement(
      "div"
    );

  modal.id =
    "cropModal";

  modal.className =
    "crop-modal";


  modal.innerHTML = `

    <div class="crop-panel">

      <div class="crop-title">
        📸 फोटो क्रॉप करें
      </div>

      <div class="crop-subtitle">
        फोटो को खींचकर सही क्षेत्र चुनें — 325×375 (13:15)
      </div>

      <div class="crop-workspace">

        <div class="crop-image-wrap">

          <img
            id="cropImage"
            class="crop-image"
            alt="Crop"
            draggable="false"
          >

          <div
            id="cropOverlay"
            class="crop-overlay"
          >

            <div class="crop-shade"></div>

            <div
              id="cropSelection"
              class="crop-selection"
            >

              <div class="crosshair-h"></div>
              <div class="crosshair-v"></div>

              <div class="crop-corners">

                <span class="tl"></span>
                <span class="tr"></span>
                <span class="bl"></span>
                <span class="br"></span>

              </div>

            </div>

          </div>

        </div>

      </div>

      <div class="crop-info">

        <strong>325 × 375</strong> &nbsp;•&nbsp; <strong>13 : 15</strong> &nbsp;•&nbsp; आईडी कार्ड फोटो अनुपात

      </div>

      <div class="crop-buttons">

        <button
          id="cropCancelButton"
          class="crop-cancel"
          type="button"
        >
          ✕ रद्द करें
        </button>

        <button
          id="cropConfirmButton"
          class="crop-confirm"
          type="button"
        >
          ✓ क्रॉप करें
        </button>

      </div>

    </div>

  `;


  document.body.appendChild(
    modal
  );


  return {

    modal:
      modal,

    image:
      modal.querySelector(
        "#cropImage"
      ),

    selection:
      modal.querySelector(
        "#cropSelection"
      ),

    cancel:
      modal.querySelector(
        "#cropCancelButton"
      ),

    confirm:
      modal.querySelector(
        "#cropConfirmButton"
      )

  };

}


/* =========================================================
   CALCULATE CROP SIZE
========================================================= */

function calculateCropSize(){

  const imageWidth =
    cropState.displayWidth;

  const imageHeight =
    cropState.displayHeight;


  /*
    Maximum crop size.
    Ratio हमेशा 13:15 रहेगा।
  */

  let width =
    imageWidth * 0.75;

  let height =
    width / CROP_RATIO;


  if(
    height >
    imageHeight * 0.85
  ){

    height =
      imageHeight * 0.85;

    width =
      height * CROP_RATIO;

  }


  width =
    Math.min(
      width,
      imageWidth
    );

  height =
    Math.min(
      height,
      imageHeight
    );


  /*
    Final exact ratio
  */

  if(
    width / height >
    CROP_RATIO
  ){

    width =
      height * CROP_RATIO;

  }else{

    height =
      width / CROP_RATIO;

  }


  return {
    width,
    height
  };

}


/* =========================================================
   UPDATE CROP SELECTION
========================================================= */

function updateCropSelection(){

  const selection =
    document.getElementById(
      "cropSelection"
    );

  if(!selection){
    return;
  }

  // Ensure selection stays within bounds
  const maxX =
    Math.max(0, cropState.displayWidth - cropState.width);
  const maxY =
    Math.max(0, cropState.displayHeight - cropState.height);

  cropState.x =
    Math.max(0, Math.min(maxX, cropState.x));

  cropState.y =
    Math.max(0, Math.min(maxY, cropState.y));

  selection.style.left =
    `${cropState.x}px`;

  selection.style.top =
    `${cropState.y}px`;

  selection.style.width =
    `${cropState.width}px`;

  selection.style.height =
    `${cropState.height}px`;

}


/* =========================================================
   CLAMP CROP
========================================================= */

function clampCropPosition(){

  const maxX =
    Math.max(
      0,
      cropState.displayWidth -
      cropState.width
    );

  const maxY =
    Math.max(
      0,
      cropState.displayHeight -
      cropState.height
    );

  cropState.x =
    Math.max(
      0,
      Math.min(
        maxX,
        cropState.x
      )
    );

  cropState.y =
    Math.max(
      0,
      Math.min(
        maxY,
        cropState.y
      )
    );

}


/* =========================================================
   POINTER POSITION
========================================================= */

function getCropPointerPosition(
  event
){

  const image =
    cropState.imageElement;

  if(!image){

    return {
      x:0,
      y:0
    };

  }


  const rect =
    image.getBoundingClientRect();


  return {

    x:
      event.clientX -
      rect.left,

    y:
      event.clientY -
      rect.top

  };

}


/* =========================================================
   POINTER DOWN
========================================================= */

function cropPointerDown(
  event
){

  event.preventDefault();

  const pointer =
    getCropPointerPosition(
      event
    );

  cropState.dragging =
    true;

  cropState.startPointerX =
    pointer.x;

  cropState.startPointerY =
    pointer.y;

  cropState.startX =
    cropState.x;

  cropState.startY =
    cropState.y;


  try{

    event.currentTarget.setPointerCapture(
      event.pointerId
    );

  }catch{}

}


/* =========================================================
   POINTER MOVE
========================================================= */

function cropPointerMove(
  event
){

  if(!cropState.dragging){
    return;
  }

  event.preventDefault();

  const pointer =
    getCropPointerPosition(
      event
    );

  const dx =
    pointer.x -
    cropState.startPointerX;

  const dy =
    pointer.y -
    cropState.startPointerY;

  cropState.x =
    cropState.startX +
    dx;

  cropState.y =
    cropState.startY +
    dy;

  clampCropPosition();

  updateCropSelection();

}


/* =========================================================
   POINTER UP
========================================================= */

function cropPointerUp(
  event
){

  cropState.dragging =
    false;

  try{

    if(
      event.currentTarget.hasPointerCapture(
        event.pointerId
      )
    ){

      event.currentTarget.releasePointerCapture(
        event.pointerId
      );

    }

  }catch{}

}


/* =========================================================
   SETUP CROP POINTER
========================================================= */

function setupCropPointerEvents(
  selection
){

  selection.addEventListener(
    "pointerdown",
    cropPointerDown
  );

  selection.addEventListener(
    "pointermove",
    cropPointerMove
  );

  selection.addEventListener(
    "pointerup",
    cropPointerUp
  );

  selection.addEventListener(
    "pointercancel",
    cropPointerUp
  );

}


/* =========================================================
   CLEANUP CROP
========================================================= */

function cleanupCrop(){

  cropState.dragging =
    false;

  cropState.imageElement =
    null;

}


/* =========================================================
   SHOW CROP MODAL
========================================================= */

function showCropModal(
  imageSource
){

  return new Promise(
    (resolve,reject)=>{

      const ui =
        createCropModal();


      const modal =
        ui.modal;

      const image =
        ui.image;

      const selection =
        ui.selection;

      const cancel =
        ui.cancel;

      const confirm =
        ui.confirm;


      let finished =
        false;


      function finishCancel(){

        if(finished){
          return;
        }

        finished =
          true;

        cleanupCrop();

        modal.remove();

        reject(
          new Error(
            "क्रॉप रद्द किया गया"
          )
        );

      }


      function finishConfirm(){

        if(finished){
          return;
        }


        try{

          if(
            !cropState.imageElement ||
            !cropState.naturalWidth ||
            !cropState.naturalHeight
          ){

            throw new Error(
              "फोटो अभी तैयार नहीं है।"
            );

          }


          // Calculate accurate crop coordinates
          const scaleX =
            cropState.naturalWidth /
            cropState.displayWidth;

          const scaleY =
            cropState.naturalHeight /
            cropState.displayHeight;


          let x =
            cropState.x *
            scaleX;

          let y =
            cropState.y *
            scaleY;

          let width =
            cropState.width *
            scaleX;

          let height =
            cropState.height *
            scaleY;


          /*
            Exact 13:15 ratio
          */

          const ratio =
            CROP_RATIO;


          // Ensure exact ratio
          if (width / height > ratio) {
            width = height * ratio;
          } else {
            height = width / ratio;
          }


          /*
            Boundary correction
          */

          if (
            x + width >
            cropState.naturalWidth
          ) {
            width =
              cropState.naturalWidth -
              x;
            height =
              width / ratio;
          }

          if (
            y + height >
            cropState.naturalHeight
          ) {
            height =
              cropState.naturalHeight -
              y;
            width =
              height * ratio;
          }

          // Re-check boundaries after ratio adjustment
          if (
            x + width >
            cropState.naturalWidth
          ) {
            width =
              cropState.naturalWidth -
              x;
            height =
              width / ratio;
          }

          if (
            y + height >
            cropState.naturalHeight
          ) {
            height =
              cropState.naturalHeight -
              y;
            width =
              height * ratio;
          }

          // Final check
          if (
            width <= 2 ||
            height <= 2 ||
            x < 0 ||
            y < 0
          ) {
            throw new Error(
              "Crop area सही नहीं है।"
            );
          }


          finished =
            true;

          cleanupCrop();

          modal.remove();


          /*
            IMPORTANT:
            केवल यहाँ resolve होगा।
            इसके बाद ही ID Card बनेगा।
          */

          resolve({

            x,
            y,
            width,
            height

          });


        }catch(error){

          console.error(
            "Crop confirm error:",
            error
          );

          alert(
            error.message ||
            "Crop पूरा नहीं हो पाया।"
          );

        }

      }


      /*
        Image error
      */

      image.onerror =
        function(){

          if(finished){
            return;
          }

          finished =
            true;

          cleanupCrop();

          modal.remove();

          reject(
            new Error(
              "Crop के लिए फोटो लोड नहीं हो पाई।"
            )
          );

        };


      /*
        Image load
      */

      image.onload =
        function(){

          /*
            Browser layout को settle होने दो।
          */

          requestAnimationFrame(
            function(){

              requestAnimationFrame(
                function(){

                  if(finished){
                    return;
                  }


                  const rect =
                    image.getBoundingClientRect();


                  let width =
                    rect.width;

                  let height =
                    rect.height;


                  /*
                    अगर browser ने dimensions
                    zero दिए तो natural size से
                    fallback।
                  */

                  if(
                    width <= 0 ||
                    height <= 0
                  ){

                    width =
                      image.naturalWidth;

                    height =
                      image.naturalHeight;

                  }


                  if(
                    width <= 0 ||
                    height <= 0
                  ){

                    finishCancel();

                    alert(
                      "फोटो का आकार निर्धारित नहीं हो पाया।"
                    );

                    return;

                  }


                  cropState.imageElement =
                    image;

                  cropState.naturalWidth =
                    image.naturalWidth;

                  cropState.naturalHeight =
                    image.naturalHeight;

                  cropState.displayWidth =
                    width;

                  cropState.displayHeight =
                    height;


                  const cropSize =
                    calculateCropSize();


                  cropState.width =
                    cropSize.width;

                  cropState.height =
                    cropSize.height;


                  cropState.x =
                    (
                      width -
                      cropState.width
                    ) / 2;

                  cropState.y =
                    (
                      height -
                      cropState.height
                    ) / 2;


                  // Ensure crop is within bounds
                  const maxX =
                    Math.max(0, width - cropState.width);
                  const maxY =
                    Math.max(0, height - cropState.height);

                  cropState.x =
                    Math.max(0, Math.min(maxX, cropState.x));

                  cropState.y =
                    Math.max(0, Math.min(maxY, cropState.y));

                  updateCropSelection();


                  /*
                    Modal अब दिखाई देगा।
                  */

                  modal.classList.add(
                    "open"
                  );

                }
              );

            }
          );

        };


      /*
        Pointer events
      */

      setupCropPointerEvents(
        selection
      );


      /*
        Cancel
      */

      cancel.addEventListener(
        "click",
        function(event){

          event.preventDefault();

          finishCancel();

        }
      );


      /*
        Confirm
      */

      confirm.addEventListener(
        "click",
        function(event){

          event.preventDefault();

          finishConfirm();

        }
      );


      /*
        ESC = Cancel
      */

      function escapeHandler(event){

        if(
          event.key === "Escape"
        ){

          finishCancel();

          document.removeEventListener(
            "keydown",
            escapeHandler
          );

        }

      }


      document.addEventListener(
        "keydown",
        escapeHandler
      );


      /*
        Start image loading
      */

      image.src =
        imageSource;

    }
  );

}


/* =========================================================
   CROP IMAGE
========================================================= */

function cropImage(
  sourceImage,
  cropData
){

  return new Promise(
    (resolve,reject)=>{

      try{

        const canvas =
          document.createElement(
            "canvas"
          );

        canvas.width =
          PHOTO_WIDTH;

        canvas.height =
          PHOTO_HEIGHT;


        const ctx =
          canvas.getContext(
            "2d"
          );

        if(!ctx){

          throw new Error(
            "Canvas उपलब्ध नहीं है।"
          );

        }


        ctx.imageSmoothingEnabled =
          true;

        ctx.imageSmoothingQuality =
          "high";


        ctx.drawImage(

          sourceImage,

          cropData.x,
          cropData.y,
          cropData.width,
          cropData.height,

          0,
          0,

          PHOTO_WIDTH,
          PHOTO_HEIGHT

        );


        const result =
          canvas.toDataURL(
            "image/jpeg",
            0.95
          );


        if(
          !result ||
          result.length < 100
        ){

          throw new Error(
            "Crop image generate नहीं हुई।"
          );

        }


        resolve(
          result
        );

      }catch(error){

        reject(error);

      }

    }
  );

}


/* =========================================================
   PHOTO CROP (DETAIL VIEW)

   IMPORTANT:
   Crop अब सीधे ID Card बटन से नहीं खुलता।
   यह केवल Detail View के "फोटो क्रॉप करें" बटन से खुलेगा।
   Crop करने के बाद परिणाम item.croppedImage में सेव होगा
   और Offline Storage में भी सेव होगा, ताकि ID Card बनाते
   समय वही Crop की हुई फोटो इस्तेमाल हो।
========================================================= */

async function openCropForItem(
  item
){

  try{

    if(
      !item.image &&
      item.imagePath &&
      navigator.onLine
    ){

      showSync(
        "फोटो लोड हो रही है..."
      );

      const image =
        await loadPrivateImage(
          item.imagePath
        );

      if(image){

        item.image =
          image;

        await saveOfflineData();

      }

      hideSync();

    }


    if(!item.image){

      alert(
        "इस पंजीकरण की फोटो उपलब्ध नहीं है। पहले Internet के साथ सिंक करें।"
      );

      return;

    }


    let cropData;

    try{

      cropData =
        await showCropModal(
          item.image
        );

    }catch(cropError){

      /*
        User ने Crop रद्द किया।
        कुछ नहीं बदलेगा।
      */

      return;

    }


    showSync(
      "फोटो Crop की जा रही है..."
    );


    const originalPhoto =
      await loadImageForCanvas(
        item.image
      );

    const croppedDataURL =
      await cropImage(
        originalPhoto,
        cropData
      );


    item.croppedImage =
      croppedDataURL;

    await saveOfflineData();


    hideSync();

    showSync(
      "✓ फोटो Crop सेव हो गई"
    );

    setTimeout(
      hideSync,
      2000
    );


    /*
      अगर Detail View इसी item के लिए
      खुला है तो फोटो preview update करो।
    */

    if(
      detailView &&
      detailView.style.display !==
        "none"
    ){

      showDetail(
        item
      );

    }


  }catch(error){

    console.error(
      "CROP ERROR:",
      error
    );

    hideSync();

    alert(
      error?.message ||
      "फोटो Crop नहीं हो पाई।"
    );

  }

}


/* =========================================================
   ID CARD
========================================================= */

async function downloadIDCard(
  item
){

  try{

    /*
      पहले photo उपलब्ध कराओ।
    */

    if(
      !item.image &&
      item.imagePath &&
      navigator.onLine
    ){

      showSync(
        "आईडी कार्ड के लिए फोटो लोड हो रही है..."
      );

      const image =
        await loadPrivateImage(
          item.imagePath
        );

      if(image){

        item.image =
          image;

        await saveOfflineData();

      }

      hideSync();

    }


    if(!item.image){

      throw new Error(
        "इस पंजीकरण की फोटो उपलब्ध नहीं है। पहले Internet के साथ सिंक करें।"
      );

    }


    /* -----------------------------------------
       LOGO
    ----------------------------------------- */

    showSync(
      "आईडी कार्ड तैयार किया जा रहा है..."
    );

    const logo =
      await loadImageForCanvas(
        "./logo.png"
      );


    /* -----------------------------------------
       PHOTO

       IMPORTANT:
       अगर Detail View से पहले फोटो Crop की
       जा चुकी है (item.croppedImage), तो वही
       फोटो इस्तेमाल होगी। वरना Original फोटो
       को अपने आप बीच से Cover-Fit किया जाएगा।

       यहाँ अब कोई Crop Modal नहीं खुलेगा।
    ----------------------------------------- */

    const photoSource =
      item.croppedImage ||
      item.image;

    const photo =
      await loadImageForCanvas(
        photoSource
      );


    /* -----------------------------------------
       CANVAS
    ----------------------------------------- */

    const canvas =
      document.createElement(
        "canvas"
      );

    canvas.width =
      1400;

    canvas.height =
      820;


    const ctx =
      canvas.getContext(
        "2d"
      );

    if(!ctx){

      throw new Error(
        "ID Card Canvas उपलब्ध नहीं है।"
      );

    }


    const hindiFont =
      '"Noto Sans Devanagari", "Nirmala UI", "Mangal", Arial, sans-serif';

    const hindiBold =
      `700 32px ${hindiFont}`;


    /* -----------------------------------------
       BACKGROUND
    ----------------------------------------- */

    ctx.fillStyle =
      "#fffaf0";

    ctx.fillRect(
      0,
      0,
      canvas.width,
      canvas.height
    );


    /* -----------------------------------------
       OUTER BORDER
    ----------------------------------------- */

    ctx.strokeStyle =
      "#f28c00";

    ctx.lineWidth =
      12;

    roundedRect(
      ctx,
      12,
      12,
      1376,
      796,
      34
    );

    ctx.stroke();


    /* -----------------------------------------
       INNER BORDER
    ----------------------------------------- */

    ctx.strokeStyle =
      "#8b5a20";

    ctx.lineWidth =
      3;

    roundedRect(
      ctx,
      30,
      30,
      1340,
      760,
      27
    );

    ctx.stroke();


    /* -----------------------------------------
       HEADER
    ----------------------------------------- */

    ctx.fillStyle =
      "#f28c00";

    roundedRect(
      ctx,
      38,
      38,
      1324,
      190,
      25
    );

    ctx.fill();


    ctx.strokeStyle =
      "#ffe2a8";

    ctx.lineWidth =
      3;

    roundedRect(
      ctx,
      52,
      52,
      1296,
      162,
      20
    );

    ctx.stroke();


    /* -----------------------------------------
       LOGO
    ----------------------------------------- */

    ctx.save();

    ctx.beginPath();

    ctx.arc(
      135,
      133,
      75,
      0,
      Math.PI * 2
    );

    ctx.clip();

    ctx.fillStyle =
      "#fff";

    ctx.fillRect(
      60,
      58,
      150,
      150
    );

    ctx.drawImage(
      logo,
      60,
      58,
      150,
      150
    );

    ctx.restore();


    ctx.strokeStyle =
      "#fff";

    ctx.lineWidth =
      5;

    ctx.beginPath();

    ctx.arc(
      135,
      133,
      78,
      0,
      Math.PI * 2
    );

    ctx.stroke();


    /* -----------------------------------------
       HEADER TEXT
    ----------------------------------------- */

    const title =
      "गायत्री चेतना केन्द्र चिलबिला प्रतापगढ़";

    const subtitle =
      "अखिल विश्व गायत्री परिवार शांतिकुंज";


    ctx.textAlign =
      "center";

    ctx.textBaseline =
      "middle";


    const titleSize =
      fitText(
        ctx,
        title,
        980,
        43,
        25
      );


    ctx.font =
      `700 ${titleSize}px ${hindiFont}`;

    ctx.fillStyle =
      "#fff";


    ctx.fillText(
      title,
      770,
      105
    );


    const subtitleSize =
      fitText(
        ctx,
        subtitle,
        850,
        26,
        16
      );


    ctx.font =
      `600 ${subtitleSize}px ${hindiFont}`;


    ctx.fillText(
      subtitle,
      770,
      158
    );


    /* -----------------------------------------
       MAIN BOX
    ----------------------------------------- */

    ctx.fillStyle =
      "#fff";

    roundedRect(
      ctx,
      65,
      260,
      1270,
      475,
      25
    );

    ctx.fill();


    ctx.strokeStyle =
      "#edcf9e";

    ctx.lineWidth =
      2;

    roundedRect(
      ctx,
      65,
      260,
      1270,
      475,
      25
    );

    ctx.stroke();


    /* -----------------------------------------
       CROPPED PHOTO
       
       EXACT 325 × 375
    ----------------------------------------- */

    drawCoverImage(
      ctx,
      photo,
      105,
      305,
      PHOTO_WIDTH,
      PHOTO_HEIGHT,
      18
    );


    ctx.strokeStyle =
      "#f28c00";

    ctx.lineWidth =
      6;

    roundedRect(
      ctx,
      105,
      305,
      PHOTO_WIDTH,
      PHOTO_HEIGHT,
      18
    );

    ctx.stroke();


    /* -----------------------------------------
       DETAILS
    ----------------------------------------- */

    const detailX =
      500;

    const rightX =
      1060;


    ctx.textAlign =
      "left";


    /* NAME */

    ctx.fillStyle =
      "#8b5a20";

    ctx.font =
      hindiBold;

    ctx.fillText(
      "नाम",
      detailX,
      330
    );


    const name =
      item.name || "—";


    const nameSize =
      fitText(
        ctx,
        name,
        500,
        39,
        21
      );


    ctx.font =
      `700 ${nameSize}px ${hindiFont}`;

    ctx.fillStyle =
      "#4b2b0b";


    ctx.fillText(
      name,
      detailX,
      375
    );


    /* AGE */

    ctx.fillStyle =
      "#8b5a20";

    ctx.font =
      hindiBold;

    ctx.fillText(
      "आयु",
      rightX,
      330
    );


    ctx.fillStyle =
      "#4b2b0b";

    ctx.font =
      `700 34px ${hindiFont}`;


    ctx.fillText(
      item.age || "—",
      rightX,
      375
    );


    /* FIX 1: REGISTRATION ID - properly sized, same format,
       positioned below age in the same section */

    ctx.fillStyle =
      "#8b5a20";

    ctx.font =
      `600 18px ${hindiFont}`;

    ctx.textAlign =
      "right";

    ctx.fillText(
      "पंजीकरण क्रमांक:",
      rightX - 10,
      418
    );


    ctx.fillStyle =
      "#4b2b0b";

    ctx.font =
      `700 18px ${hindiFont}`;

    ctx.fillText(
      item.id || "—",
      rightX,
      418
    );


    /* DIVIDER */

    ctx.strokeStyle =
      "#edcf9e";

    ctx.lineWidth =
      2;

    ctx.beginPath();

    ctx.moveTo(
      detailX,
      440
    );

    ctx.lineTo(
      1285,
      440
    );

    ctx.stroke();


    /* MOBILE */

    ctx.textAlign =
      "left";

    ctx.fillStyle =
      "#8b5a20";

    ctx.font =
      hindiBold;


    ctx.fillText(
      "मोबाइल नंबर",
      detailX,
      480
    );


    ctx.fillStyle =
      "#4b2b0b";

    ctx.font =
      `700 34px ${hindiFont}`;


    ctx.fillText(
      item.mobile || "—",
      detailX,
      525
    );


    /* DIVIDER */

    ctx.strokeStyle =
      "#edcf9e";

    ctx.beginPath();

    ctx.moveTo(
      detailX,
      555
    );

    ctx.lineTo(
      1285,
      555
    );

    ctx.stroke();


    /* ADDRESS (पता) */

    ctx.fillStyle =
      "#8b5a20";

    ctx.font =
      hindiBold;


    ctx.fillText(
      "पता",
      detailX,
      595
    );


    const address =
      item.city || "—";


    const addressSize =
      fitText(
        ctx,
        address,
        760,
        34,
        18
      );


    ctx.fillStyle =
      "#4b2b0b";

    ctx.font =
      `700 ${addressSize}px ${hindiFont}`;


    ctx.fillText(
      address,
      detailX,
      640
    );


    /* FIX 2: FOOTER - moved to right side */

    ctx.textAlign =
      "right";

    ctx.fillStyle =
      "#8b5a20";

    ctx.font =
      `600 18px ${hindiFont}`;


    ctx.fillText(
      "गायत्री चेतना केन्द्र",
      1285,
      700
    );


    /* -----------------------------------------
       CORNERS
    ----------------------------------------- */

    drawDecoration(
      ctx,
      80,
      250
    );

    drawDecoration(
      ctx,
      1320,
      250
    );

    drawDecoration(
      ctx,
      80,
      725
    );

    drawDecoration(
      ctx,
      1320,
      725
    );


    /* -----------------------------------------
       DOWNLOAD
    ----------------------------------------- */

    const safeID =
      String(
        item.id ||
        item.issueNumber ||
        "पंजीकरण"
      )
        .replace(
          /[^a-zA-Z0-9_-]+/g,
          "_"
        );


    const link =
      document.createElement(
        "a"
      );


    link.download =
      "गायत्री-आईडी-कार्ड-" +
      safeID +
      ".png";


    link.href =
      canvas.toDataURL(
        "image/png"
      );


    document.body.appendChild(
      link
    );


    link.click();

    link.remove();


    hideSync();

    showSync(
      "✓ आईडी कार्ड डाउनलोड हो गया"
    );


    setTimeout(
      hideSync,
      2000
    );


  }catch(error){

    console.error(
      "ID CARD ERROR:",
      error
    );

    hideSync();


    alert(
      error?.message ||
      "आईडी कार्ड नहीं बन पाया।"
    );

  }

}


/* =========================================================
   MANUAL SYNC
========================================================= */

if(refreshButton){

  refreshButton.addEventListener(
    "click",
    async function(){

      if(!githubConfig){

        alert(
          "पहले GitHub से लॉगिन करें।"
        );

        return;

      }


      refreshButton.disabled =
        true;

      refreshButton.textContent =
        "सिंक हो रहा है...";


      try{

        registrations =
          await syncFromGitHub();


        performSearch();


        showSync(
          `✓ सिंक पूरा हुआ • ${registrations.length} पंजीकरण उपलब्ध`
        );


        setTimeout(
          hideSync,
          3000
        );


      }catch(error){

        console.error(
          error
        );


        if(
          registrations.length
        ){

          showSync(
            "नया डेटा नहीं मिला। सेव किया हुआ डेटा दिखाया जा रहा है।"
          );

        }else{

          alert(
            error.message ||
            "डेटा लोड नहीं हो पाया।"
          );

        }

      }finally{

        refreshButton.disabled =
          false;

        refreshButton.textContent =
          "↻ सिंक";

      }

    }
  );

}


/* =========================================================
   LOGOUT
========================================================= */

if(logoutButton){

  logoutButton.addEventListener(
    "click",
    function(){

      clearLogin();

      registrations =
        [];


      if(registrationList){

        registrationList.innerHTML =
          "";

      }


      if(searchBox){

        searchBox.value =
          "";

      }


      if(listView){

        listView.style.display =
          "none";

      }

      if(detailView){

        detailView.style.display =
          "none";

      }

      if(loginView){

        loginView.style.display =
          "block";

      }


      if(usernameInput){

        usernameInput.value =
          "";

      }

      if(repoInput){

        repoInput.value =
          "";

      }

      if(tokenInput){

        tokenInput.value =
          "";

      }


      hideError();

      hideSync();

    }
  );

}


/* =========================================================
   LOGIN
========================================================= */

if(loginButton){

  loginButton.addEventListener(
    "click",
    async function(){

      hideError();


      const username =
        usernameInput.value.trim();

      const repo =
        repoInput.value.trim();

      const token =
        tokenInput.value.trim();


      if(
        !username ||
        !repo ||
        !token
      ){

        showError(
          "GitHub Username, Repository और Token तीनों भरें।"
        );

        return;

      }


      githubConfig = {

        username:
          username,

        repo:
          repo,

        token:
          token

      };


      loginButton.disabled =
        true;

      loginButton.textContent =
        "डेटा लोड हो रहा है...";


      try{

        registrations =
          await syncFromGitHub();


        saveLogin();


        loginView.style.display =
          "none";

        detailView.style.display =
          "none";

        listView.style.display =
          "block";


        renderList(
          registrations
        );


        showSync(
          `✓ ऑनलाइन • ${registrations.length} पंजीकरण लोड हुए`
        );


        setTimeout(
          hideSync,
          3000
        );


      }catch(error){

        console.error(
          "LOGIN ERROR:",
          error
        );


        const saved =
          await loadOfflineData();


        if(
          saved &&
          Array.isArray(
            saved.registrations
          )
        ){

          registrations =
            saved.registrations;


          saveLogin();


          loginView.style.display =
            "none";

          detailView.style.display =
            "none";

          listView.style.display =
            "block";


          renderList(
            registrations
          );


          showSync(
            `ऑफलाइन मोड • ${registrations.length} पंजीकरण उपलब्ध`
          );


        }else{

          githubConfig =
            null;


          showError(
            error.message ||
            "डेटा लोड नहीं हो पाया।"
          );

        }

      }finally{

        loginButton.disabled =
          false;

        loginButton.textContent =
          "सुरक्षित रूप से खोलें";

      }

    }
  );

}


/* =========================================================
   START APPLICATION
========================================================= */

async function startApplication(){

  /*
    SERVICE WORKER
  */

  if(
    "serviceWorker" in
    navigator
  ){

    try{

      await navigator.serviceWorker.register(
        "./sw.js"
      );

      console.log(
        "Service Worker registered."
      );

    }catch(error){

      console.warn(
        "Service Worker error:",
        error
      );

    }

  }


  /*
    SAVED LOGIN
  */

  if(!loadLogin()){

    return;

  }


  /*
    OFFLINE DATA FIRST
  */

  const saved =
    await loadOfflineData();


  if(
    saved &&
    Array.isArray(
      saved.registrations
    )
  ){

    registrations =
      saved.registrations;


    loginView.style.display =
      "none";

    detailView.style.display =
      "none";

    listView.style.display =
      "block";


    renderList(
      registrations
    );


    showSync(
      `ऑफलाइन सेव डेटा • ${registrations.length} पंजीकरण`
    );

  }


  /*
    ONLINE FRESH SYNC
  */

  if(
    navigator.onLine
  ){

    try{

      registrations =
        await syncFromGitHub();


      loginView.style.display =
        "none";

      detailView.style.display =
        "none";

      listView.style.display =
        "block";


      renderList(
        registrations
      );


      showSync(
        `✓ ऑनलाइन सिंक • ${registrations.length} पंजीकरण`
      );


      setTimeout(
        hideSync,
        3000
      );


    }catch(error){

      console.warn(
        "Startup sync failed:",
        error
      );


      if(
        registrations.length === 0
      ){

        loginView.style.display =
          "block";

        listView.style.display =
          "none";


        showError(
          error.message
        );

      }

    }

  }

}


/* =========================================================
   INTERNET वापस आने पर AUTO SYNC
========================================================= */

window.addEventListener(
  "online",
  async function(){

    if(!githubConfig){
      return;
    }


    try{

      showSync(
        "इंटरनेट वापस आ गया। डेटा सिंक हो रहा है..."
      );


      registrations =
        await syncFromGitHub();


      performSearch();


      showSync(
        `✓ सिंक पूरा • ${registrations.length} पंजीकरण उपलब्ध`
      );


      setTimeout(
        hideSync,
        3000
      );


    }catch(error){

      console.warn(
        "Online sync error:",
        error
      );

    }

  }
);


/* =========================================================
   START
========================================================= */

startApplication();
