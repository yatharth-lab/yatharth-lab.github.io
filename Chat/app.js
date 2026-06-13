import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    doc,
    setDoc,
    getDoc,
    collection,
    getDocs,
    addDoc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const auth = window.auth;
const db = window.db;

const authScreen = document.getElementById("authScreen");
const chatScreen = document.getElementById("chatScreen");

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const signupBtn = document.getElementById("signupBtn");
const loginBtn = document.getElementById("loginBtn");
const googleBtn = document.getElementById("googleBtn");
const logoutBtn = document.getElementById("logoutBtn");

const usersList = document.getElementById("usersList");
const messagesDiv = document.getElementById("messages");

const sendBtn = document.getElementById("sendBtn");
const messageInput = document.getElementById("messageInput");

const userName = document.getElementById("userName");
const userEmail = document.getElementById("userEmail");
const userPhoto = document.getElementById("userPhoto");

const chatUserName = document.getElementById("chatUserName");
const chatStatus = document.getElementById("chatStatus");

let currentUser = null;
let selectedUser = null;
let unsubscribeMessages = null;

/* ---------------- SAVE USER ---------------- */

async function saveUser(user) {

    await setDoc(
        doc(db, "users", user.uid),
        {
            uid: user.uid,
            name:
                user.displayName ||
                user.email.split("@")[0],

            email: user.email,

            photo:
                user.photoURL ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    user.email
                )}`,

            online: true
        },
        { merge: true }
    );
}

/* ---------------- SIGNUP ---------------- */

signupBtn.onclick = async () => {

    try {

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        const result =
            await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

        await saveUser(result.user);

    } catch (e) {

        alert(e.message);

    }

};

/* ---------------- LOGIN ---------------- */

loginBtn.onclick = async () => {

    try {

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        await signInWithEmailAndPassword(
            auth,
            email,
            password
        );

    } catch (e) {

        alert(e.message);

    }

};

/* ---------------- GOOGLE LOGIN ---------------- */

googleBtn.onclick = async () => {

    try {

        const provider =
            new GoogleAuthProvider();

        const result =
            await signInWithPopup(
                auth,
                provider
            );

        await saveUser(result.user);

    } catch (e) {

        alert(e.message);

    }

};

/* ---------------- LOGOUT ---------------- */

logoutBtn.onclick = async () => {

    if (currentUser) {

        await setDoc(
            doc(db, "users", currentUser.uid),
            { online: false },
            { merge: true }
        );

    }

    await signOut(auth);

};

/* ---------------- AUTH STATE ---------------- */

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            authScreen.classList.remove("hidden");
            chatScreen.classList.add("hidden");

            return;
        }

        currentUser = user;

        await saveUser(user);

        authScreen.classList.add("hidden");
        chatScreen.classList.remove("hidden");

        userName.textContent =
            user.displayName ||
            user.email.split("@")[0];

        userEmail.textContent =
            user.email;

        userPhoto.src =
            user.photoURL ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                user.email
            )}`;

        loadUsers();

    }
);

/* ---------------- LOAD USERS ---------------- */

async function loadUsers() {

    usersList.innerHTML = "";

    const snapshot =
        await getDocs(
            collection(db, "users")
        );

    snapshot.forEach((docSnap) => {

        const data = docSnap.data();

        if (
            data.uid === currentUser.uid
        ) return;

        const div =
            document.createElement("div");

        div.className =
            "user-card";

        div.innerHTML = `
            <img src="${data.photo}">
            <div>
                <h4>${data.name}</h4>
                <p>
                    ${data.online ? "Online" : "Offline"}
                </p>
            </div>
        `;

        div.onclick = () => {

            selectedUser = data;

            chatUserName.textContent =
                data.name;

            chatStatus.textContent =
                data.online
                    ? "Online"
                    : "Offline";

            loadMessages();

        };

        usersList.appendChild(div);

    });

}

/* ---------------- CHAT ID ---------------- */

function getChatId(uid1, uid2) {

    return [uid1, uid2]
        .sort()
        .join("_");

}

/* ---------------- SEND ---------------- */

sendBtn.onclick = async () => {

    if (!selectedUser) {

        alert("Select user");

        return;
    }

    const text =
        messageInput.value.trim();

    if (!text) return;

    const chatId =
        getChatId(
            currentUser.uid,
            selectedUser.uid
        );

    await addDoc(
        collection(
            db,
            "chats",
            chatId,
            "messages"
        ),
        {
            text,
            sender:
                currentUser.uid,
            createdAt:
                serverTimestamp()
        }
    );

    messageInput.value = "";

};

/* ---------------- LOAD MESSAGES ---------------- */

function loadMessages() {

    if (!selectedUser) return;

    if (unsubscribeMessages)
        unsubscribeMessages();

    messagesDiv.innerHTML = "";

    const chatId =
        getChatId(
            currentUser.uid,
            selectedUser.uid
        );

    const q =
        query(
            collection(
                db,
                "chats",
                chatId,
                "messages"
            ),
            orderBy(
                "createdAt",
                "asc"
            )
        );

    unsubscribeMessages =
        onSnapshot(
            q,
            (snapshot) => {

                messagesDiv.innerHTML = "";

                snapshot.forEach(
                    (docSnap) => {

                        const msg =
                            docSnap.data();

                        const div =
                            document.createElement(
                                "div"
                            );

                        div.className =
                            "message " +
                            (
                                msg.sender ===
                                currentUser.uid
                                    ? "me"
                                    : "other"
                            );

                        div.textContent =
                            msg.text;

                        messagesDiv.appendChild(
                            div
                        );

                    }
                );

                messagesDiv.scrollTop =
                    messagesDiv.scrollHeight;

            }
        );

}

/* ---------------- ENTER SEND ---------------- */

messageInput.addEventListener(
    "keydown",
    (e) => {

        if (e.key === "Enter") {

            sendBtn.click();

        }

    }
);
