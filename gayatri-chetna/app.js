import { getGitHubConfig } from "./api/config.js";

const config = getGitHubConfig();

const form = document.getElementById("registrationForm");
const imageInput = document.getElementById("imageInput");
const previewImage = document.getElementById("previewImage");
const photoText = document.getElementById("photoText");
const submitButton = document.getElementById("submitButton");
const statusMessage = document.getElementById("statusMessage");
const progressBar = document.getElementById("progressBar");
const successBox = document.getElementById("successBox");
const registrationIdElement = document.getElementById("registrationId");

let imageBase64 = null;


/* =========================================
   STATUS SYSTEM
========================================= */

function status(message, progress = 0, type = "normal") {

  statusMessage.textContent = message;

  progressBar.style.width = `${progress}%`;

  statusMessage.dataset.status = type;

}


/* =========================================
   ERROR MESSAGE
========================================= */

function showError(message, progress = 0) {

  status(
    `❌ ${message}`,
    progress,
    "error"
  );

  successBox.classList.add("hidden");

}


/* =========================================
   SUCCESS MESSAGE
========================================= */

function showSuccess(message) {

  status(
    `✓ ${message}`,
    100,
    "success"
  );

}


/* =========================================
   REGISTRATION ID
========================================= */

function createRegistrationId() {

  const year =
    new Date().getFullYear();

  const time =
    Date.now()
      .toString(36)
      .toUpperCase();

  const random =
    Math.random()
      .toString(36)
      .substring(2, 7)
      .toUpperCase();

  return `GCK-${year}-${time}-${random}`;

}


/* =========================================
   IMAGE COMPRESSION
========================================= */

function compressImage(file) {

  return new Promise((resolve, reject) => {

    const reader = new FileReader();

    reader.onload = event => {

      const img = new Image();

      img.onload = () => {

        let width = img.width;
        let height = img.height;

        const MAX = 900;

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
            Math.round(width * ratio);

          height =
            Math.round(height * ratio);

        }


        const canvas =
          document.createElement("canvas");

        canvas.width = width;
        canvas.height = height;


        const ctx =
          canvas.getContext("2d");

        ctx.drawImage(
          img,
          0,
          0,
          width,
          height
        );


        let quality = 0.82;


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
                blob.size <= 500 * 1024 ||
                quality <= 0.45
              ) {

                const fileReader =
                  new FileReader();


                fileReader.onload = () => {

                  resolve(
                    fileReader.result
                  );

                };


                fileReader.onerror = () => {

                  reject(
                    new Error(
                      "Compressed फोटो पढ़ी नहीं जा सकी।"
                    )
                  );

                };


                fileReader.readAsDataURL(blob);

                return;

              }


              quality -= 0.07;

              compress();

            },

            "image/jpeg",

            quality

          );

        }


        compress();

      };


      img.onerror = () => {

        reject(
          new Error(
            "यह valid image file नहीं है।"
          )
        );

      };


      img.src = event.target.result;

    };


    reader.onerror = () => {

      reject(
        new Error(
          "फोटो पढ़ने में समस्या हुई।"
        )
      );

    };


    reader.readAsDataURL(file);

  });

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

      showError(
        "फोटो 5 MB से बड़ी है। कृपया छोटी फोटो चुनें।"
      );

      imageInput.value = "";

      return;

    }


    try {

      status(
        "फोटो तैयार की जा रही है…",
        10
      );


      imageBase64 =
        await compressImage(file);


      previewImage.src =
        imageBase64;

      previewImage.style.display =
        "block";

      photoText.style.display =
        "none";


      showSuccess(
        "फोटो सफलतापूर्वक तैयार हो गई।"
      );


      progressBar.style.width = "25%";


    } catch (error) {

      imageBase64 = null;

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
   GITHUB API
========================================= */

async function createGitHubIssue(
  title,
  body
) {

  const url =
    "https://api.github.com/repos/" +
    encodeURIComponent(config.owner) +
    "/" +
    encodeURIComponent(config.repo) +
    "/issues";


  let response;


  try {

    response =
      await fetch(
        url,
        {
          method: "POST",

          headers: {

            "Accept":
              "application/vnd.github+json",

            "Authorization":
              `Bearer ${config.token}`,

            "Content-Type":
              "application/json",

            "X-GitHub-Api-Version":
              "2022-11-28"

          },

          body:
            JSON.stringify({
              title,
              body
            })

        }
      );

  } catch (networkError) {

    throw new Error(
      `GitHub से connection नहीं हो सका। Network/CORS समस्या हो सकती है। (${networkError.message})`
    );

  }


  let data = null;


  try {

    data =
      await response.json();

  } catch {

    data = null;

  }


  if (!response.ok) {

    const githubMessage =
      data?.message ||
      "GitHub ने कोई स्पष्ट error message नहीं दिया।";


    let extra = "";


    if (response.status === 401) {

      extra =
        " Token गलत, expired या invalid हो सकता है।";

    }


    else if (response.status === 403) {

      extra =
        " Token के पास आवश्यक permission नहीं है या GitHub ने request को रोक दिया है।";

    }


    else if (response.status === 404) {

      extra =
        " Repository/owner गलत हो सकता है या token को repository दिखाई नहीं दे रही है।";

    }


    else if (response.status === 422) {

      extra =
        " GitHub ने request data को स्वीकार नहीं किया।";

    }


    throw new Error(
      `GitHub API ${response.status}: ${githubMessage}.${extra}`
    );

  }


  return data;

}


/* =========================================
   SUBMIT
========================================= */

form.addEventListener(
  "submit",
  async event => {

    event.preventDefault();


    successBox.classList.add(
      "hidden"
    );


    /* =========================
       PHOTO
    ========================== */

    if (!imageBase64) {

      showError(
        "पहले फोटो चुनें और फोटो के सफलतापूर्वक तैयार होने का संदेश आने दें।"
      );

      return;

    }


    /* =========================
       FORM DATA
    ========================== */

    const name =
      document
        .getElementById("name")
        .value
        .trim();


    const fatherName =
      document
        .getElementById("fatherName")
        .value
        .trim();


    const mobile =
      document
        .getElementById("mobile")
        .value
        .trim();


    const age =
      document
        .getElementById("age")
        .value
        .trim();


    const dikshaDate =
      document
        .getElementById("dikshaDate")
        .value;


    const dikshaPlace =
      document
        .getElementById("dikshaPlace")
        .value
        .trim();


    const city =
      document
        .getElementById("city")
        .value
        .trim();


    const education =
      document
        .getElementById("education")
        .value
        .trim();


    const income =
      document
        .getElementById("income")
        .value
        .trim();


    /* =========================
       REQUIRED
    ========================== */

    if (
      !name ||
      !fatherName ||
      !mobile ||
      !age ||
      !dikshaDate ||
      !dikshaPlace ||
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
       MOBILE
    ========================== */

    if (
      !/^[6-9][0-9]{9}$/.test(mobile)
    ) {

      showError(
        "मोबाइल नंबर गलत है। 10 अंकों का भारतीय मोबाइल नंबर डालें।"
      );

      return;

    }


    /* =========================
       AGE
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


    submitButton.disabled = true;


    try {

      /* =========================
         STEP 1
      ========================== */

      status(
        "पंजीकरण क्रमांक बनाया जा रहा है…",
        30
      );


      const id =
        createRegistrationId();


      /* =========================
         STEP 2
      ========================== */

      status(
        "पंजीकरण विवरण तैयार किया जा रहा है…",
        40
      );


      const issueBody = `# गायत्री चेतना केन्द्र चिलबिला, प्रतापगढ़

## पंजीकरण विवरण

**पंजीकरण क्रमांक:** \`${id}\`

---

### व्यक्तिगत विवरण

**नाम:** ${name}

**पिता का नाम:** ${fatherName}

**मोबाइल नंबर:** ${mobile}

**आयु:** ${age}

**दीक्षा की तिथि:** ${dikshaDate}

**दीक्षा का स्थान:** ${dikshaPlace}

---

### स्थान

**जिला:** प्रतापगढ़ (उ.प्र.)

**शहर / कस्बा / ग्राम:** ${city}

---

### शिक्षा एवं आय

**शिक्षा:** ${education}

**आय / Income:** ${income}

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
        "GitHub से connection किया जा रहा है…",
        55
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


      registrationIdElement.textContent =
        id;


      successBox.classList.remove(
        "hidden"
      );


      /* =========================
         RESET
      ========================== */

      form.reset();

      imageBase64 = null;

      previewImage.style.display =
        "none";

      photoText.style.display =
        "block";


      console.log(
        "GitHub Issue Created:",
        issue?.html_url || issue
      );


    } catch (error) {

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
