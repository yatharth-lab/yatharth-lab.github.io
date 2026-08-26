import { getGitHubConfig } from "./api/config.js";


/* =========================================
   CONFIG
========================================= */

const config =
  getGitHubConfig();


/* =========================================
   CONSTANTS
========================================= */

const COUNTER_FILE =
  "gayatri-chetna/counter.json";

const IMAGE_FOLDER =
  "gayatri-chetna/images";

const STARTING_NUMBER =
  1000;

const GITHUB_API_VERSION =
  "2026-03-10";


/* =========================================
   ELEMENTS
========================================= */

const form =
  document.getElementById(
    "registrationForm"
  );


const imageInput =
  document.getElementById(
    "imageInput"
  );


const previewImage =
  document.getElementById(
    "previewImage"
  );


const photoText =
  document.getElementById(
    "photoText"
  );


const submitButton =
  document.getElementById(
    "submitButton"
  );


const statusMessage =
  document.getElementById(
    "statusMessage"
  );


const progressBar =
  document.getElementById(
    "progressBar"
  );


const successBox =
  document.getElementById(
    "successBox"
  );


const registrationIdElement =
  document.getElementById(
    "registrationId"
  );


/* =========================================
   DIKSHA ELEMENTS
========================================= */

const dikshaTaken =
  document.getElementById(
    "dikshaTaken"
  );


const dikshaDetails =
  document.getElementById(
    "dikshaDetails"
  );


const dikshaDate =
  document.getElementById(
    "dikshaDate"
  );


const dikshaPlace =
  document.getElementById(
    "dikshaPlace"
  );


/* =========================================
   IMAGE DATA
========================================= */

let imageBase64 =
  null;


/* =========================================
   GITHUB HEADERS
========================================= */

function githubHeaders() {

  return {

    "Accept":
      "application/vnd.github+json",

    "Authorization":
      `Bearer ${config.token}`,

    "Content-Type":
      "application/json",

    "X-GitHub-Api-Version":
      GITHUB_API_VERSION

  };

}


/* =========================================
   GITHUB CONTENTS URL
========================================= */

function githubContentsUrl(
  path
) {

  return (
    "https://api.github.com/repos/" +
    encodeURIComponent(config.owner) +
    "/" +
    encodeURIComponent(config.repo) +
    "/contents/" +
    path
      .split("/")
      .map(
        encodeURIComponent
      )
      .join("/")
  );

}


/* =========================================
   STATUS SYSTEM
========================================= */

function status(
  message,
  progress = 0,
  type = "normal"
) {

  statusMessage.textContent =
    message;

  progressBar.style.width =
    `${progress}%`;

  statusMessage.dataset.status =
    type;

}


/* =========================================
   CUSTOMER-FRIENDLY ERROR MESSAGE
========================================= */

function getFriendlyErrorMessage(
  error,
  defaultMessage =
    "वेबसाइट पर प्रक्रिया पूरी नहीं हो पाई। कृपया कुछ देर बाद दोबारा प्रयास करें।"
) {

  const message =
    String(
      error?.message ||
      ""
    ).toLowerCase();


  const statusCode =
    Number(
      error?.status ||
      0
    );


  /* -------------------------
     NETWORK / INTERNET
  ------------------------- */

  if (
    message.includes("failed to fetch") ||
    message.includes("network") ||
    message.includes("internet") ||
    message.includes("connection") ||
    message.includes("cors")
  ) {

    return (
      "इंटरनेट कनेक्शन में समस्या है। " +
      "कृपया अपना इंटरनेट जाँचें और दोबारा प्रयास करें।"
    );

  }


  /* -------------------------
     401
  ------------------------- */

  if (
    statusCode === 401 ||
    message.includes("401")
  ) {

    return (
      "वेबसाइट की सुरक्षा व्यवस्था में समस्या है। " +
      "कृपया थोड़ी देर बाद दोबारा प्रयास करें।"
    );

  }


  /* -------------------------
     402
  ------------------------- */

  if (
    statusCode === 402 ||
    message.includes("402")
  ) {

    return (
      "वेबसाइट की ऑनलाइन सेवा अभी अनुरोध स्वीकार नहीं कर रही है। " +
      "कृपया कुछ देर बाद दोबारा प्रयास करें।"
    );

  }


  /* -------------------------
     403
  ------------------------- */

  if (
    statusCode === 403 ||
    message.includes("403")
  ) {

    return (
      "वेबसाइट पर इस समय अनुरोध पूरा नहीं हो पाया। " +
      "कृपया कुछ देर बाद दोबारा प्रयास करें।"
    );

  }


  /* -------------------------
     404
  ------------------------- */

  if (
    statusCode === 404 ||
    message.includes("404")
  ) {

    return (
      "वेबसाइट पर आवश्यक सेवा उपलब्ध नहीं है। " +
      "कृपया कुछ देर बाद दोबारा प्रयास करें।"
    );

  }


  /* -------------------------
     409
  ------------------------- */

  if (
    statusCode === 409 ||
    message.includes("409")
  ) {

    return (
      "एक साथ कई अनुरोध प्राप्त हुए हैं। " +
      "कृपया कुछ सेकंड बाद दोबारा प्रयास करें।"
    );

  }


  /* -------------------------
     422
  ------------------------- */

  if (
    statusCode === 422 ||
    message.includes("422")
  ) {

    return (
      "दिया गया विवरण स्वीकार नहीं हो पाया। " +
      "कृपया जानकारी जाँचकर दोबारा प्रयास करें।"
    );

  }


  /* -------------------------
     429
  ------------------------- */

  if (
    statusCode === 429 ||
    message.includes("429") ||
    message.includes("rate limit")
  ) {

    return (
      "वेबसाइट पर इस समय बहुत अधिक अनुरोध आ रहे हैं। " +
      "कृपया 1–2 मिनट बाद दोबारा प्रयास करें।"
    );

  }


  /* -------------------------
     500+
  ------------------------- */

  if (
    statusCode >= 500
  ) {

    return (
      "वेबसाइट की ऑनलाइन सेवा में अस्थायी समस्या है। " +
      "कृपया कुछ देर बाद दोबारा प्रयास करें।"
    );

  }


  return defaultMessage;

}


/* =========================================
   ERROR
========================================= */

function showError(
  message,
  progress = 0
) {

  status(
    `❌ ${message}`,
    progress,
    "error"
  );

  successBox.classList.add(
    "hidden"
  );

}


/* =========================================
   SUCCESS
========================================= */

function showSuccess(
  message
) {

  status(
    `✓ ${message}`,
    100,
    "success"
  );

}


/* =========================================
   DIKSHA SHOW / HIDE
========================================= */

function updateDikshaFields() {

  if (
    dikshaTaken.value === "हाँ"
  ) {

    dikshaDetails.style.display =
      "block";

    dikshaDate.disabled =
      false;

    dikshaPlace.disabled =
      false;

    dikshaDate.required =
      true;

    dikshaPlace.required =
      true;

  } else {

    dikshaDetails.style.display =
      "none";

    dikshaDate.disabled =
      true;

    dikshaPlace.disabled =
      true;

    dikshaDate.required =
      false;

    dikshaPlace.required =
      false;

    dikshaDate.value =
      "";

    dikshaPlace.value =
      "";

  }

}


/* =========================================
   DIKSHA DROPDOWN EVENT
========================================= */

if (dikshaTaken) {

  dikshaTaken.addEventListener(
    "change",
    updateDikshaFields
  );

  updateDikshaFields();

}


/* =========================================
   GET CURRENT COUNTER FILE
========================================= */

async function getCounterFile() {

  let response;


  try {

    response =
      await fetch(
        githubContentsUrl(
          COUNTER_FILE
        ),
        {
          method: "GET",
          headers: githubHeaders()
        }
      );

  } catch (error) {

    const friendly =
      getFriendlyErrorMessage(
        error,
        "पंजीकरण क्रमांक प्राप्त नहीं हो पाया। कृपया इंटरनेट कनेक्शन जाँचकर दोबारा प्रयास करें।"
      );

    const friendlyError =
      new Error(
        friendly
      );

    friendlyError.status =
      0;

    throw friendlyError;

  }


  /* -------------------------
     FILE DOES NOT EXIST
  ------------------------- */

  if (
    response.status === 404
  ) {

    return {

      exists: false,

      sha: null,

      lastNumber:
        STARTING_NUMBER

    };

  }


  /* -------------------------
     OTHER ERROR
  ------------------------- */

  if (
    !response.ok
  ) {

    let data = null;

    try {

      data =
        await response.json();

    } catch {}


    const error =
      new Error(
        data?.message ||
        "Counter file पढ़ा नहीं जा सका।"
      );

    error.status =
      response.status;

    throw error;

  }


  const data =
    await response.json();


  let decoded = "";


  try {

    decoded =
      atob(
        data.content
          .replace(/\n/g, "")
      );

  } catch {

    throw new Error(
      "पंजीकरण क्रमांक की जानकारी पढ़ी नहीं जा सकी।"
    );

  }


  let counter;


  try {

    counter =
      JSON.parse(
        decoded
      );

  } catch {

    throw new Error(
      "पंजीकरण क्रमांक की जानकारी सही format में नहीं है।"
    );

  }


  const lastNumber =
    Number(
      counter.lastNumber
    );


  if (
    !Number.isInteger(
      lastNumber
    ) ||
    lastNumber < STARTING_NUMBER
  ) {

    throw new Error(
      "पंजीकरण क्रमांक की जानकारी गलत है।"
    );

  }


  return {

    exists: true,

    sha:
      data.sha,

    lastNumber:
      lastNumber

  };

}


/* =========================================
   RESERVE NEXT REGISTRATION NUMBER
========================================= */

async function reserveNextNumber() {

  const MAX_RETRIES =
    12;


  for (
    let attempt = 1;
    attempt <= MAX_RETRIES;
    attempt++
  ) {

    const counter =
      await getCounterFile();


    const nextNumber =
      counter.lastNumber + 1;


    const newCounter = {

      lastNumber:
        nextNumber

    };


    const content =
      btoa(
        JSON.stringify(
          newCounter,
          null,
          2
        )
      );


    const body = {

      message:
        `Update registration counter to ${nextNumber}`,

      content:
        content,

      branch:
        config.branch ||
        undefined

    };


    if (
      counter.exists
    ) {

      body.sha =
        counter.sha;

    }


    let response;


    try {

      response =
        await fetch(
          githubContentsUrl(
            COUNTER_FILE
          ),
          {

            method:
              "PUT",

            headers:
              githubHeaders(),

            body:
              JSON.stringify(
                body
              )

          }
        );

    } catch (networkError) {

      const error =
        new Error(
          "पंजीकरण क्रमांक सुरक्षित नहीं हो पाया।"
        );

      error.status =
        0;

      error.original =
        networkError;

      throw error;

    }


    /* -------------------------
       SUCCESS
    ------------------------- */

    if (
      response.ok
    ) {

      return nextNumber;

    }


    /* -------------------------
       CONFLICT
    ------------------------- */

    if (
      response.status === 409
    ) {

      await new Promise(
        resolve =>
          setTimeout(
            resolve,
            150 +
            Math.random() * 500
          )
      );

      continue;

    }


    let data = null;


    try {

      data =
        await response.json();

    } catch {}


    const error =
      new Error(
        data?.message ||
        "पंजीकरण क्रमांक सुरक्षित नहीं हो पाया।"
      );


    error.status =
      response.status;


    throw error;

  }


  throw new Error(
    "एक साथ बहुत सारे पंजीकरण प्रयास हो रहे हैं। कृपया कुछ सेकंड बाद दोबारा प्रयास करें।"
  );

}


/* =========================================
   CREATE REGISTRATION ID
========================================= */

function createRegistrationId(
  sequenceNumber
) {

  const year =
    new Date()
      .getFullYear();


  return (
    `GCK-${year}-AWGP-PBH-${sequenceNumber}`
  );

}


/* =========================================
   IMAGE COMPRESSION
========================================= */

function compressImage(
  file
) {

  return new Promise(
    (resolve, reject) => {

      const reader =
        new FileReader();


      reader.onload =
        event => {

          const img =
            new Image();


          img.onload =
            () => {

              let width =
                img.width;


              let height =
                img.height;


              const MAX =
                900;


              if (
                width > MAX ||
                height > MAX
              ) {

                const ratio =
                  Math.min(
                    MAX / width,
                    MAX / height
                  );


                width =
                  Math.round(
                    width * ratio
                  );


                height =
                  Math.round(
                    height * ratio
                  );

              }


              const canvas =
                document.createElement(
                  "canvas"
                );


              canvas.width =
                width;


              canvas.height =
                height;


              const ctx =
                canvas.getContext(
                  "2d"
                );


              if (!ctx) {

                reject(
                  new Error(
                    "फोटो तैयार नहीं हो सकी।"
                  )
                );

                return;

              }


              ctx.drawImage(
                img,
                0,
                0,
                width,
                height
              );


              let quality =
                0.82;


              function compress() {

                canvas.toBlob(
                  blob => {

                    if (!blob) {

                      reject(
                        new Error(
                          "फोटो तैयार नहीं हो सकी।"
                        )
                      );

                      return;

                    }


                    if (
                      blob.size <=
                        500 * 1024 ||
                      quality <= 0.45
                    ) {

                      const fileReader =
                        new FileReader();


                      fileReader.onload =
                        () => {

                          resolve(
                            fileReader.result
                          );

                        };


                      fileReader.onerror =
                        () => {

                          reject(
                            new Error(
                              "तैयार की गई फोटो पढ़ी नहीं जा सकी।"
                            )
                          );

                        };


                      fileReader.readAsDataURL(
                        blob
                      );


                      return;

                    }


                    quality -=
                      0.07;


                    compress();

                  },

                  "image/jpeg",

                  quality

                );

              }


              compress();

            };


          img.onerror =
            () => {

              reject(
                new Error(
                  "यह सही image file नहीं है। कृपया दूसरी फोटो चुनें।"
                )
              );

            };


          img.src =
            event.target.result;

        };


      reader.onerror =
        () => {

          reject(
            new Error(
              "फोटो पढ़ने में समस्या हुई।"
            )
          );

        };


      reader.readAsDataURL(
        file
      );

    }
  );

}


/* =========================================
   IMAGE SELECT
========================================= */

imageInput.addEventListener(
  "change",
  async () => {

    const file =
      imageInput.files[0];


    if (!file) {

      return;

    }


    /* -------------------------
       FILE TYPE CHECK
    ------------------------- */

    const allowedTypes = [

      "image/jpeg",

      "image/png",

      "image/webp"

    ];


    if (
      !allowedTypes.includes(
        file.type
      )
    ) {

      imageBase64 =
        null;


      showError(
        "कृपया JPG, PNG या WebP फोटो चुनें।"
      );


      imageInput.value =
        "";


      return;

    }


    /* -------------------------
       FILE SIZE CHECK
    ------------------------- */

    if (
      file.size >
      5 * 1024 * 1024
    ) {

      imageBase64 =
        null;


      showError(
        "फोटो 5 MB से बड़ी है। कृपया छोटी फोटो चुनें।"
      );


      imageInput.value =
        "";


      return;

    }


    try {

      status(
        "फोटो तैयार की जा रही है…",
        10,
        "normal"
      );


      imageBase64 =
        await compressImage(
          file
        );


      previewImage.src =
        imageBase64;


      previewImage.style.display =
        "block";


      photoText.style.display =
        "none";


      status(
        "फोटो सफलतापूर्वक तैयार हो गई।",
        25,
        "success"
      );


    } catch (error) {

      console.error(
        "IMAGE PREPARATION ERROR:",
        error
      );


      imageBase64 =
        null;


      previewImage.style.display =
        "none";


      photoText.style.display =
        "block";


      showError(
        error.message ||
        "फोटो तैयार नहीं हो सकी। कृपया दूसरी फोटो चुनें।"
      );

    }

  }
);


/* =========================================
   UPLOAD IMAGE TO REPOSITORY
========================================= */

async function uploadImageToRepository(
  imageDataUrl,
  registrationId
) {

  if (
    !imageDataUrl
  ) {

    throw new Error(
      "फोटो उपलब्ध नहीं है।"
    );

  }


  /* -------------------------
     EXTRACT BASE64
     
     Base64 is used only for
     GitHub image upload.
     
     It will NOT be stored
     inside the Issue.
  ------------------------- */

  const parts =
    imageDataUrl.split(",");


  if (
    parts.length < 2
  ) {

    throw new Error(
      "फोटो का data सही format में नहीं है।"
    );

  }


  const base64Content =
    parts[1];


  if (
    !base64Content
  ) {

    throw new Error(
      "फोटो का data उपलब्ध नहीं है।"
    );

  }


  /* -------------------------
     IMAGE FILE PATH
     
     gayatri-chetna/
       images/
         GCK-....jpg
  ------------------------- */

  const imagePath =
    `${IMAGE_FOLDER}/${registrationId}.jpg`;


  let response;


  try {

    response =
      await fetch(
        githubContentsUrl(
          imagePath
        ),
        {

          method:
            "PUT",

          headers:
            githubHeaders(),

          body:
            JSON.stringify({

              message:
                `Add registration photo ${registrationId}`,

              content:
                base64Content,

              branch:
                config.branch ||
                undefined

            })

        }
      );

  } catch (networkError) {

    const error =
      new Error(
        "वेबसाइट पर फोटो अपलोड नहीं हो पाई। कृपया अपना इंटरनेट कनेक्शन जाँचकर दोबारा प्रयास करें।"
      );


    error.status =
      0;


    error.original =
      networkError;


    throw error;

  }


  let data =
    null;


  try {

    data =
      await response.json();

  } catch {}


  /* -------------------------
     UPLOAD ERROR
  ------------------------- */

  if (
    !response.ok
  ) {

    const error =
      new Error(
        "वेबसाइट पर फोटो अपलोड नहीं हो पाई। कृपया कुछ देर बाद दोबारा प्रयास करें।"
      );


    error.status =
      response.status;


    error.originalMessage =
      data?.message ||
      "";


    throw error;

  }


  /* -------------------------
     IMAGE URL
  ------------------------- */

  const branch =
    config.branch ||
    "main";


  const encodedPath =
    imagePath
      .split("/")
      .map(
        encodeURIComponent
      )
      .join("/");


  const imageUrl =
    `https://raw.githubusercontent.com/` +
    `${encodeURIComponent(config.owner)}/` +
    `${encodeURIComponent(config.repo)}/` +
    `${encodeURIComponent(branch)}/` +
    encodedPath;


  return {

    path:
      imagePath,

    url:
      imageUrl,

    sha:
      data?.content?.sha ||
      null

  };

}


/* =========================================
   GITHUB ISSUE
========================================= */

async function createGitHubIssue(
  title,
  body
) {

  const url =
    "https://api.github.com/repos/" +
    encodeURIComponent(
      config.owner
    ) +
    "/" +
    encodeURIComponent(
      config.repo
    ) +
    "/issues";


  let response;


  try {

    response =
      await fetch(
        url,
        {

          method:
            "POST",

          headers:
            githubHeaders(),

          body:
            JSON.stringify({

              title:
                title,

              body:
                body

            })

        }
      );

  } catch (networkError) {

    const error =
      new Error(
        "पंजीकरण सुरक्षित नहीं हो पाया। कृपया अपना इंटरनेट कनेक्शन जाँचें और दोबारा प्रयास करें।"
      );


    error.status =
      0;


    error.original =
      networkError;


    throw error;

  }


  let data =
    null;


  try {

    data =
      await response.json();

  } catch {

    data =
      null;

  }


  if (
    !response.ok
  ) {

    const error =
      new Error(
        "पंजीकरण सुरक्षित नहीं हो पाया। कृपया कुछ देर बाद दोबारा प्रयास करें।"
      );


    error.status =
      response.status;


    error.originalMessage =
      data?.message ||
      "";


    throw error;

  }


  return data;

}


/* =========================================
   FORM SUBMIT
========================================= */

form.addEventListener(
  "submit",
  async event => {

    event.preventDefault();


    successBox.classList.add(
      "hidden"
    );


    /* =========================
       PHOTO CHECK
    ========================== */

    if (!imageBase64) {

      showError(
        "पहले फोटो चुनें और फोटो तैयार होने दें।"
      );

      return;

    }


    /* =========================
       GET FORM VALUES
    ========================== */

    const name =
      document
        .getElementById(
          "name"
        )
        .value
        .trim();


    const fatherName =
      document
        .getElementById(
          "fatherName"
        )
        .value
        .trim();


    const mobile =
      document
        .getElementById(
          "mobile"
        )
        .value
        .trim();


    const age =
      document
        .getElementById(
          "age"
        )
        .value
        .trim();


    const dikshaStatus =
      dikshaTaken.value;


    const dikshaDateValue =
      dikshaDate.value;


    const dikshaPlaceValue =
      dikshaPlace.value
        .trim();


    const city =
      document
        .getElementById(
          "city"
        )
        .value
        .trim();


    const education =
      document
        .getElementById(
          "education"
        )
        .value
        .trim();


    const income =
      document
        .getElementById(
          "income"
        )
        .value
        .trim();


    /* =========================
       DONATION
    ========================== */

    const anshdaan =
      document
        .getElementById(
          "anshdaan"
        )
        .value
        .trim();


    const samaydaan =
      document
        .getElementById(
          "samaydaan"
        )
        .value
        .trim();


    /* =========================
       REQUIRED CHECK
    ========================== */

    if (
      !name ||
      !fatherName ||
      !mobile ||
      !age ||
      !dikshaStatus ||
      !city ||
      !education ||
      !income
    ) {

      showError(
        "सभी आवश्यक विवरण भरना जरूरी है।"
      );

      return;

    }


    /* =========================
       DIKSHA CHECK
    ========================== */

    if (
      dikshaStatus === "हाँ"
    ) {

      if (
        !dikshaDateValue ||
        !dikshaPlaceValue
      ) {

        showError(
          "यदि दीक्षा ली है तो दीक्षा की तिथि और स्थान भरना जरूरी है।"
        );

        return;

      }

    }


    /* =========================
       MOBILE VALIDATION
    ========================== */

    if (
      !/^[6-9][0-9]{9}$/.test(
        mobile
      )
    ) {

      showError(
        "मोबाइल नंबर गलत है। 10 अंकों का भारतीय मोबाइल नंबर डालें।"
      );

      return;

    }


    /* =========================
       AGE VALIDATION
    ========================== */

    const numericAge =
      Number(age);


    if (
      numericAge < 1 ||
      numericAge > 120
    ) {

      showError(
        "आयु 1 से 120 वर्ष के बीच होनी चाहिए।"
      );

      return;

    }


    /* =========================
       SUBMIT START
    ========================== */

    submitButton.disabled =
      true;


    try {

      /* =========================
         STEP 1
      ========================== */

      status(
        "पंजीकरण क्रमांक सुरक्षित किया जा रहा है…",
        30
      );


      const sequenceNumber =
        await reserveNextNumber();


      const id =
        createRegistrationId(
          sequenceNumber
        );


      /* =========================
         STEP 2
      ========================== */

      status(
        `पंजीकरण क्रमांक ${id} तैयार किया जा रहा है…`,
        40
      );


      /* =========================
         DIKSHA DISPLAY
      ========================== */

      const dikshaDateForIssue =
        dikshaStatus === "हाँ"
          ? dikshaDateValue
          : "लागू नहीं";


      const dikshaPlaceForIssue =
        dikshaStatus === "हाँ"
          ? dikshaPlaceValue
          : "लागू नहीं";


      /* =========================
         STEP 3
         UPLOAD PHOTO
      ========================== */

      status(
        "फोटो वेबसाइट पर सुरक्षित की जा रही है…",
        50,
        "normal"
      );


      const uploadedImage =
        await uploadImageToRepository(
          imageBase64,
          id
        );


      /* =========================
         STEP 4
         ISSUE BODY
      ========================== */

      const issueBody =
`# गायत्री चेतना केन्द्र चिलबिला, प्रतापगढ़

## पंजीकरण विवरण

**पंजीकरण क्रमांक:** \`${id}\`

**Sequence Number:** ${sequenceNumber}

---

### व्यक्तिगत विवरण

**नाम:** ${name}

**पिता का नाम:** ${fatherName}

**मोबाइल नंबर:** ${mobile}

**आयु:** ${age}

**दीक्षा ली है?:** ${dikshaStatus}

**दीक्षा की तिथि:** ${dikshaDateForIssue}

**दीक्षा का स्थान:** ${dikshaPlaceForIssue}

---

### स्थान

**जिला:** प्रतापगढ़ (उ.प्र.)

**शहर / कस्बा / ग्राम:** ${city}

---

### शिक्षा एवं आय

**शिक्षा:** ${education}

**आय / Income:** ${income}

---

# आपके द्वारा किया गया दान

## अंशदान

${anshdaan || "कोई विवरण नहीं दिया गया।"}

---

## समयदान

${samaydaan || "कोई विवरण नहीं दिया गया।"}

---

## फोटो

**Format:** JPEG

**Image Path:** \`${uploadedImage.path}\`

**Image URL:** ${uploadedImage.url}

![पंजीकरण फोटो](${uploadedImage.url})

---

**पंजीकरण क्रमांक:** \`${id}\`

`;


      /* =========================
         STEP 5
         CREATE REGISTRATION
      ========================== */

      status(
        "पंजीकरण सुरक्षित किया जा रहा है…",
        75,
        "normal"
      );


      const issue =
        await createGitHubIssue(
          `GCK Registration - ${id} - ${name}`,
          issueBody
        );


      /* =========================
         SUCCESS
      ========================== */

      showSuccess(
        "पंजीकरण सफलतापूर्वक जमा हो गया।"
      );


      registrationIdElement
        .textContent =
        id;


      successBox.classList.remove(
        "hidden"
      );


      /* =========================
         RESET FORM
      ========================== */

      form.reset();


      imageBase64 =
        null;


      previewImage.style.display =
        "none";


      photoText.style.display =
        "block";


      updateDikshaFields();


      /* =========================
         CONSOLE
      ========================== */

      console.log(
        "Registration ID:",
        id
      );


      console.log(
        "Sequence:",
        sequenceNumber
      );


      console.log(
        "Image Path:",
        uploadedImage.path
      );


      console.log(
        "Image URL:",
        uploadedImage.url
      );


      console.log(
        "Registration Saved:",
        issue?.html_url ||
        issue
      );


    } catch (error) {

      console.error(
        "REGISTRATION ERROR:",
        error
      );


      /*
         Customer को technical
         GitHub/API error नहीं दिखाना।
      */

      let friendlyMessage =
        error.message ||
        "पंजीकरण पूरा नहीं हो पाया। कृपया दोबारा प्रयास करें।";


      /*
         अगर हमारे functions ने
         status code attach किया है
         तो उसे friendly message में बदलेंगे।
      */

      if (
        error.status
      ) {

        friendlyMessage =
          getFriendlyErrorMessage(
            error
          );

      }


      showError(
        friendlyMessage
      );


    } finally {

      submitButton.disabled =
        false;

    }

  }
);
