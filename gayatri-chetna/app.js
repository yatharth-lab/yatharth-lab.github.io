import { getGitHubConfig }
from "./api/config.js";


const config = getGitHubConfig();


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


let imageBase64 = null;


/* =================================
   STATUS
================================= */

function status(
  message,
  progress = 0
) {

  statusMessage.textContent =
    message;

  progressBar.style.width =
    progress + "%";

}


/* =================================
   REGISTRATION ID
================================= */

function createRegistrationId() {

  const year =
    new Date()
      .getFullYear();

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


/* =================================
   IMAGE COMPRESSION
================================= */

function compressImage(file) {

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
                          "फोटो process नहीं हो सकी।"
                        )
                      );

                      return;

                    }


                    /*
                      GitHub Issue body की limit
                      को देखते हुए image छोटी
                      रख रहे हैं।
                    */

                    if (
                      blob.size <=
                        500 * 1024 ||
                      quality <= 0.45
                    ) {

                      const fr =
                        new FileReader();


                      fr.onload =
                        () =>
                          resolve(
                            fr.result
                          );


                      fr.onerror =
                        () =>
                          reject(
                            new Error(
                              "फोटो पढ़ने में समस्या।"
                            )
                          );


                      fr.readAsDataURL(
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
            () =>
              reject(
                new Error(
                  "Invalid image."
                )
              );


          img.src =
            event.target.result;

        };


      reader.onerror =
        () =>
          reject(
            new Error(
              "फोटो पढ़ी नहीं जा सकी।"
            )
          );


      reader.readAsDataURL(
        file
      );

    }
  );

}


/* =================================
   IMAGE SELECT
================================= */

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

      alert(
        "फोटो अधिकतम 5 MB की होनी चाहिए।"
      );

      imageInput.value =
        "";

      return;

    }


    try {

      status(
        "फोटो तैयार की जा रही है…",
        10
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
        "✓ फोटो सफलतापूर्वक तैयार है।",
        25
      );


    } catch (error) {

      imageBase64 =
        null;


      previewImage.style.display =
        "none";


      photoText.style.display =
        "block";


      status(
        "❌ " +
        error.message,
        0
      );

    }

  }
);


/* =================================
   GITHUB API
================================= */

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


  const response =
    await fetch(
      url,
      {

        method: "POST",

        headers: {

          "Accept":
            "application/vnd.github+json",

          "Authorization":
            "Bearer " +
            config.token,

          "Content-Type":
            "application/json",

          "X-GitHub-Api-Version":
            "2022-11-28"

        },

        body:
          JSON.stringify({
            title: title,
            body: body
          })

      }
    );


  const data =
    await response.json();


  if (!response.ok) {

    throw new Error(
      data.message ||
      "GitHub API error"
    );

  }


  return data;

}


/* =================================
   SUBMIT
================================= */

form.addEventListener(
  "submit",
  async event => {

    event.preventDefault();


    successBox.classList.add(
      "hidden"
    );


    if (!imageBase64) {

      status(
        "❌ कृपया पहले फोटो चुनें।",
        0
      );

      return;

    }


    const name =
      document
        .getElementById(
          "name"
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


    const dikshaDate =
      document
        .getElementById(
          "dikshaDate"
        )
        .value;


    const dikshaPlace =
      document
        .getElementById(
          "dikshaPlace"
        )
        .value
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


    if (
      !name ||
      !age ||
      !dikshaDate ||
      !dikshaPlace ||
      !city ||
      !education ||
      !income
    ) {

      status(
        "❌ सभी आवश्यक विवरण भरें।",
        0
      );

      return;

    }


    submitButton.disabled =
      true;


    try {

      /* =========================
         ID
      ========================== */

      const id =
        createRegistrationId();


      status(
        "पंजीकरण ID बनाई जा रही है…",
        30
      );


      /* =========================
         ISSUE BODY
      ========================== */

      const issueBody = `# गायत्री चेतना केन्द्र

## पंजीकरण विवरण

**Registration ID:** \`${id}\`

---

### व्यक्तिगत विवरण

**नाम:** ${name}

**आयु:** ${age}

**दीक्षा की तिथि:** ${dikshaDate}

**दीक्षा का स्थान:** ${dikshaPlace}

**जिला:** प्रतापगढ़ (उ.प्र.)

**शहर / कस्बा / ग्राम:** ${city}

**शिक्षा:** ${education}

**आय / Income:** ${income}

---

## फोटो

नीचे Base64 encoded image data सुरक्षित रूप से रखा गया है।

**Format:** JPEG

**Encoding:** Base64

\`\`\`text
${imageBase64}
\`\`\`

---

**Registration ID:** \`${id}\`

`;



      status(
        "GitHub से connection किया जा रहा है…",
        50
      );


      /* =========================
         CREATE ISSUE
      ========================== */

      const issue =
        await createGitHubIssue(
          `GCK Registration - ${id} - ${name}`,
          issueBody
        );


      status(
        "✓ GitHub Issue सफलतापूर्वक बन गई।",
        100
      );


      registrationIdElement
        .textContent =
        id;


      successBox
        .classList
        .remove("hidden");


      form.reset();


      imageBase64 =
        null;


      previewImage.style.display =
        "none";


      photoText.style.display =
        "block";


      console.log(
        "GitHub Issue:",
        issue.html_url
      );


    } catch (error) {

      console.error(
        error
      );


      status(
        "❌ Error: " +
        error.message,
        0
      );


    } finally {

      submitButton.disabled =
        false;

    }

  }
);
