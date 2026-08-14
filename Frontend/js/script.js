
// ===============================
// API CONFIGURATION
// ===============================

// Use the same host as the frontend for API calls
// const API_BASE_URL = `http://${window.location.hostname}:8080`;
const API_BASE_URL = "https://sigma-gpt-c5bt.onrender.com";


// ===============================
// DOM ELEMENTS
// ===============================

const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("messageInput");
const messagesContainer = document.getElementById("messagesContainer");
const welcomeScreen = document.getElementById("welcomeScreen");
const newChatBtn = document.getElementById("newChatBtn");
const historyList = document.getElementById("historyList");
const menuBtn = document.getElementById("menuBtn");
const sidebar = document.querySelector(".sidebar");
const logoutBtn = document.getElementById("logoutBtn");

// ===============================
// CURRENT THREAD
// ===============================

let currentThreadId = generateThreadId();


// ===============================
// GENERATE UNIQUE THREAD ID
// ===============================

function generateThreadId() {
    return "thread-" + Date.now() + "-" + Math.random()
        .toString(36)
        .substring(2, 8);
}


// ===============================
// SEND MESSAGE
// ===============================

chatForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const message = messageInput.value.trim();

    if (!message) {
        return;
    }

    // Hide welcome screen
    welcomeScreen.style.display = "none";

    // Show user message
    addMessage("user", message);

    // Clear input
    messageInput.value = "";

    // Disable input while waiting
    messageInput.disabled = true;

    showLoading();

    try {

        const response = await fetch(
            `${API_BASE_URL}/api/chat`,
            {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    threadId: currentThreadId,
                    message: message
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            // If 401, redirect to login
            if (response.status === 401) {
                window.location.href = "login.html";
                return;
            }
            throw new Error(data.error || "Something went wrong");
        }

        // Show Gemini response
        // Remove loading
    removeLoading();

    // Show Gemini response
    addMessage("assistant", data.reply);

        // Add thread to sidebar
        addHistoryItem(message, currentThreadId);

    } catch (error) {

        console.error("Chat Error:", error);

        removeLoading();

        addMessage(
            "assistant",
            "Sorry, something went wrong. Please try again."
        );

    } finally {

        // Enable input again
        messageInput.disabled = false;

        // Focus input
        messageInput.focus();
    }

});


// ===============================
// ADD MESSAGE TO CHAT
// ===============================

function addMessage(role, content) {

    const messageDiv = document.createElement("div");

    messageDiv.classList.add(
        "message",
        role
    );

    const contentDiv = document.createElement("div");

    contentDiv.classList.add("message-content");


    // =================================
    // ASSISTANT MESSAGE
    // =================================

    if (role === "assistant") {

        contentDiv.innerHTML = marked.parse(content);

        addCopyButtons(contentDiv);

    }

    // =================================
    // USER MESSAGE
    // =================================

    else {

        contentDiv.textContent = content;

    }


    messageDiv.appendChild(contentDiv);

    messagesContainer.appendChild(messageDiv);

    scrollToBottom();
}

// ===============================
// ADD COPY BUTTONS TO CODE BLOCKS
// ===============================

function addCopyButtons(container) {

    const codeBlocks = container.querySelectorAll("pre");

    codeBlocks.forEach((pre) => {

        const code = pre.querySelector("code");

        if (!code) {
            return;
        }


        // Wrapper
        const wrapper = document.createElement("div");

        wrapper.classList.add("code-wrapper");


        // Copy button
        const copyBtn = document.createElement("button");

        copyBtn.classList.add("copy-code-btn");

        copyBtn.textContent = "Copy";


        copyBtn.addEventListener("click", async () => {

            try {

                await navigator.clipboard.writeText(
                    code.innerText
                );

                copyBtn.textContent = "Copied!";


                setTimeout(() => {

                    copyBtn.textContent = "Copy";

                }, 1500);


            } catch (error) {

                console.error(
                    "Copy failed:",
                    error
                );

            }

        });


        // Replace pre position
        pre.parentNode.insertBefore(
            wrapper,
            pre
        );

        wrapper.appendChild(copyBtn);

        wrapper.appendChild(pre);

    });
}

// ===============================
// SCROLL CHAT TO BOTTOM
// ===============================

function scrollToBottom() {

    const chatContainer = document.getElementById("chatContainer");

    chatContainer.scrollTop = chatContainer.scrollHeight;
}


// ===============================
// NEW CHAT
// ===============================

newChatBtn.addEventListener("click", () => {

    // Generate new thread
    currentThreadId = generateThreadId();

    // Clear messages
    messagesContainer.innerHTML = "";

    // Show welcome screen
    welcomeScreen.style.display = "flex";

    // Clear input
    messageInput.value = "";

    // Remove active history item
    document
        .querySelectorAll(".history-item")
        .forEach(item => item.classList.remove("active"));

    messageInput.focus();

    if (window.innerWidth <= 576) {
    sidebar.classList.remove("mobile-open");
}
});


// ===============================
// ADD CHAT TO SIDEBAR
// ===============================



function addHistoryItem(title, threadId) {

    let historyItem = document.querySelector(
        `[data-thread-id="${threadId}"]`
    );

    // ===============================
    // CREATE CHAT ITEM
    // ===============================

    if (!historyItem) {

        historyItem = document.createElement("div");

        historyItem.classList.add("history-item");

        historyItem.dataset.threadId = threadId;


        // Chat title
        const titleSpan = document.createElement("span");

        titleSpan.classList.add("history-title-text");

        titleSpan.textContent = title;


        // Delete button
        const deleteBtn = document.createElement("button");

        deleteBtn.classList.add("delete-chat-btn");

        deleteBtn.innerHTML = "×";

        deleteBtn.title = "Delete chat";


        // ===============================
        // CHAT CLICK
        // ===============================

        historyItem.addEventListener("click", () => {

            loadThread(threadId);

        });


        // ===============================
        // DELETE CLICK
        // ===============================

        deleteBtn.addEventListener("click", async (event) => {

            // Don't trigger chat click
            event.stopPropagation();

            await deleteThread(threadId, historyItem);

        });


        // Add elements
        historyItem.appendChild(titleSpan);

        historyItem.appendChild(deleteBtn);


        // Add to sidebar
        historyList.prepend(historyItem);

    } else {

        // ===============================
        // EXISTING CHAT
        // ===============================

        const titleSpan = historyItem.querySelector(
            ".history-title-text"
        );

        if (titleSpan) {
            titleSpan.textContent = title;
        }


        // Move updated chat to top
        historyList.prepend(historyItem);
    }
}



// ===============================
// DELETE THREAD
// ===============================

async function deleteThread(threadId, historyItem) {

    const confirmDelete = confirm(
        "Are you sure you want to delete this chat?"
    );

    if (!confirmDelete) {
        return;
    }

    try {

        const response = await fetch(
            `${API_BASE_URL}/api/thread/${threadId}`,
            {
                method: "DELETE",
                credentials: "include"
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error || "Failed to delete thread"
            );
        }


        // Remove from sidebar
        historyItem.remove();


        // If deleted chat was currently open
        if (currentThreadId === threadId) {

            currentThreadId = generateThreadId();

            messagesContainer.innerHTML = "";

            welcomeScreen.style.display = "flex";

            messageInput.value = "";

            messageInput.focus();
        }


    } catch (error) {

        console.error(
            "Delete Thread Error:",
            error
        );

        alert(
            "Failed to delete chat. Please try again."
        );
    }
}


// ===============================
// LOAD THREAD
// ===============================

async function loadThread(threadId) {

    try {

        const response = await fetch(
            `${API_BASE_URL}/api/thread/${threadId}`,
            {
                credentials: "include"
            }
        );

        const messages = await response.json();

        if (!response.ok) {

            throw new Error(
                messages.error || "Failed to load thread"
            );

        }

        // Set current thread
        currentThreadId = threadId;

        // Clear current messages
        messagesContainer.innerHTML = "";

        // Hide welcome screen
        welcomeScreen.style.display = "none";

        // Render messages
        messages.forEach((message) => {

            addMessage(
                message.role,
                message.content
            );

        });

        if (window.innerWidth <= 576) {
    sidebar.classList.remove("mobile-open");
}

        // Update active sidebar item
        document
            .querySelectorAll(".history-item")
            .forEach((item) => {

                item.classList.remove("active");

                if (
                    item.dataset.threadId === threadId
                ) {

                    item.classList.add("active");

                }

            });

        // Scroll to bottom
        scrollToBottom();

        // Focus input
        messageInput.focus();

    } catch (error) {

        console.error(
            "Load Thread Error:",
            error
        );

    }

}


// ===============================
// INITIAL FOCUS
// ===============================

messageInput.focus();


// ===============================
// AUTH CHECK
// ===============================

async function ensureAuthenticated() {

    try {

        const response = await fetch(
            `${API_BASE_URL}/api/auth/me`,
            {
                credentials: "include"
            }
        );

        if (!response.ok) {
            window.location.href = "login.html";
            return false;
        }

        return true;

    } catch (error) {

        console.error("Auth check failed:", error);
        window.location.href = "login.html";
        return false;

    }

}


// ===============================
// LOAD CHAT HISTORY
// ===============================

async function loadChatHistory() {

    try {

        const response = await fetch(
            `${API_BASE_URL}/api/thread`,
            {
                credentials: "include"
            }
        );

        const threads = await response.json();

        if (!response.ok) {
            // Silently fail for now - user will be prompted when trying to send message
            if (response.status === 401) {
                console.log("Not authenticated - history not loaded");
                return;
            }
            throw new Error(
                threads.error || "Failed to load chat history"
            );
        }

        historyList.innerHTML = "";

        threads.forEach((thread) => {

            addHistoryItem(
                thread.title,
                thread.threadId
            );

        });

    } catch (error) {

        console.error(
            "History Error:",
            error
        );

    }
}

// ===============================
// LOAD HISTORY WHEN PAGE OPENS
// ===============================

// Delay load to allow session to stabilize after login redirect
(async () => {

    const authenticated = await ensureAuthenticated();

    if (!authenticated) {
        return;
    }

    await loadChatHistory();

})();

// ===============================
// SHOW LOADING MESSAGE
// ===============================

function showLoading() {

    const loadingDiv = document.createElement("div");

    loadingDiv.classList.add(
        "message",
        "assistant",
        "loading-message"
    );

    loadingDiv.id = "loadingMessage";

    const contentDiv = document.createElement("div");

    contentDiv.classList.add("message-content");

    contentDiv.textContent = "Thinking...";

    loadingDiv.appendChild(contentDiv);

    messagesContainer.appendChild(loadingDiv);

    scrollToBottom();
}

// ===============================
// REMOVE LOADING MESSAGE
// ===============================

function removeLoading() {

    const loadingMessage = document.getElementById(
        "loadingMessage"
    );

    if (loadingMessage) {
        loadingMessage.remove();
    }
}


// ===============================
// MOBILE SIDEBAR
// ===============================

menuBtn.addEventListener("click", () => {

    sidebar.classList.toggle("mobile-open");

});

logoutBtn.addEventListener("click", async () => {

    try {

        const response = await fetch(
            `${API_BASE_URL}/api/auth/logout`,
            {
                method: "POST",
                credentials: "include"
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error || "Logout failed"
            );
        }

        console.log(data.message);

        window.location.href = "login.html";

    } catch (error) {

        console.error(
            "Logout Error:",
            error
        );

    }

});