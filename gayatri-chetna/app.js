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
   GITHUB BASE URL
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

  const response =
    await fetch(
      githubContentsUrl(
        COUNTER_FILE
      ),
      {
        method: "GET",
        headers: githubHeaders()
      }
    );


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

    throw new Error(
      `Counter file पढ़ा नहीं जा सका। GitHub API ${response.status}: ${
        data?.message ||
        "Unknown error"
      }`
    );

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
      "Counter file का Base64 data पढ़ा नहीं जा सका।"
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
      "counter.json का format गलत है।"
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
      "counter.json में lastNumber गलत है।"
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

/*
   IMPORTANT:

   यह function counter को atomically
   आगे बढ़ाने की कोशिश करता है।

   अगर दो लोग एक साथ submit करें:

   Person A -> 1001
   Person B -> 1002

   GitHub SHA conflict के कारण
   दूसरा request पुराने counter को
   overwrite नहीं कर पाएगा।

   वह दोबारा counter पढ़ेगा और
   अगला number लेगा।
*/

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


    /*
       Existing file update:
       SHA देना जरूरी है।
    */

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

    } catch (
      networkError
    ) {

      throw new Error(
        `Counter update के समय GitHub connection failed: ${networkError.message}`
      );

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

      /*
         इसका मतलब किसी दूसरे user ने
         इसी समय counter update कर दिया।

         इसलिए पुराने counter को छोड़कर
         फिर से latest counter पढ़ेंगे।
      */

      await new Promise(
        resolve =>
          setTimeout(
            resolve,
            150 + Math.random() * 500
          )
      );

      continue;

    }


    /* -------------------------
       OTHER ERROR
    ------------------------- */

    let data = null;


    try {

      data =
        await response.json();

    } catch {}


    throw new Error(
      `Counter update failed. GitHub API ${response.status}: ${
        data?.message ||
        "Unknown error"
      }`
    );

  }


  throw new Error(
    "एक ही समय में बहुत सारे registration attempts हुए। कृपया कुछ सेकंड बाद दोबारा प्रयास करें।"
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
                    "Browser canvas support उपलब्ध नहीं है।"
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
                          "फोटो को JPEG में convert नहीं किया जा सका।"
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
                              "Compressed फोटो पढ़ी नहीं जा सकी।"
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
                  "यह valid image file नहीं है।"
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

      imageBase64 =
        null;


      previewImage.style.display =
        "none";


      photoText.style.display =
        "block";


      showError(
        `फोटो Error: ${error.message}`
      );

    }

  }
);


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

  } catch (
    networkError
  ) {

    throw new Error(
      `GitHub से connection नहीं हो सका। Network/CORS समस्या हो सकती है। (${networkError.message})`
    );

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

    const githubMessage =
      data?.message ||
      "GitHub ने कोई स्पष्ट error message नहीं दिया।";


    let extra =
      "";


    if (
      response.status === 401
    ) {

      extra =
        " Token गलत, expired या invalid हो सकता है।";

    }


    else if (
      response.status === 403
    ) {

      extra =
        " Token के पास आवश्यक permission नहीं है।";

    }


    else if (
      response.status === 404
    ) {

      extra =
        " Repository या owner गलत हो सकता है।";

    }


    else if (
      response.status === 422
    ) {

      extra =
        " GitHub ने request data स्वीकार नहीं किया।";

    }


    throw new Error(
      `GitHub API ${response.status}: ${githubMessage}.${extra}`
    );

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


      /*
         यहीं से नया sequence number मिलेगा।

         First:
         1001

         Next:
         1002

         Next:
         1003
      */

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

**Encoding:** Base64

\`\`\`text
${imageBase64}
\`\`\`

---

**पंजीकरण क्रमांक:** \`${id}\`

`;


      /* =========================
         STEP 3
      ========================== */

      status(
        "GitHub पर पंजीकरण सुरक्षित किया जा रहा है…",
        55
      );


      /* =========================
         CREATE ISSUE
      ========================== */

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
        "GitHub Issue Created:",
        issue?.html_url ||
        issue
      );


    } catch (
      error
    ) {

      console.error(
        "REGISTRATION ERROR:",
        error
      );


      showError(
        error.message ||
        "अज्ञात error हुआ।"
      );


    } finally {

      submitButton.disabled =
        false;

    }

  }
);
