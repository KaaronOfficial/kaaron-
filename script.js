let currentUser = null;
let chart;
let currentEntry = {};
let chatStarted = false;

// --- Keywords ---
const vagueWords = ["uh","um","umm","uhh","uhhh","idk","i dont know","not sure","maybe","meh"];
const positiveMood = ["good","happy","amazing","great","fantastic","awesome","fine"];
const neutralMood  = ["okay","meh","fine"];
const negativeMood = ["bad","sad","tired","rough","awful"];
const positiveSleep = ["good","excellent","great","amazing","fantastic","solid"];
const neutralSleep  = ["okay","meh","fair"];
const negativeSleep = ["poor","bad","terrible","rough"];

// --- LOGIN FUNCTIONS ---
function signUp() {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    const msg = document.getElementById("loginMsg");
    if (!username || !password) { msg.innerText = "Please fill all fields."; return; }
    if (localStorage.getItem(username)) { msg.innerText = "Username exists! Please log in."; return; }
    localStorage.setItem(username, JSON.stringify({password, entries: []}));
    msg.innerText = "Account created! You can now log in.";
}

function logIn() {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    const msg = document.getElementById("loginMsg");
    if (!username || !password) { msg.innerText = "Please fill all fields."; return; }
    const userStr = localStorage.getItem(username);
    if (!userStr) { msg.innerText = "Username not found!"; return; }
    const user = JSON.parse(userStr);
    if (user.password !== password) { msg.innerText = "Incorrect password!"; return; }
    currentUser = username;
    document.getElementById("login").classList.add("hidden");
    document.getElementById("app").classList.remove("hidden");
    msg.innerText = "";
    currentEntry = {};
    chatStarted = false;
    addMessage("Hi! I'm your Sleep & Mood AI. Type anything to start chatting 🙂", "ai");
    document.getElementById("userInput").disabled = false;
    document.getElementById("submitBtn").disabled = false;
    loadChart();
}

function logout() {
    currentUser = null;
    document.getElementById("app").classList.add("hidden");
    document.getElementById("login").classList.remove("hidden");
    document.getElementById("messages").innerHTML = "";
    document.getElementById("userInput").disabled = true;
    document.getElementById("submitBtn").disabled = true;
}

// --- CHAT FUNCTIONS ---
function addMessage(text, sender){
    const chatBox = document.getElementById("messages");
    const div = document.createElement("div");
    div.className = "message " + sender;
    div.innerText = text;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Check for filler / vague words
function isVague(text){
    const lower = text.toLowerCase();
    const simplified = lower.replace(/(.)\1+/g,"$1"); // reduces "uhhh" -> "uh"
    return vagueWords.some(word => simplified.includes(word)) || text.length < 2;
}

// Submit user input
function submitAnswer(){
    const input = document.getElementById("userInput").value.trim();
    if(!input) return;
    addMessage(input,"user");
    document.getElementById("userInput").value = "";

    if(!chatStarted){
        chatStarted = true;
        addMessage("Nice to meet you! Let's chat about your mood and sleep. How are you feeling today?", "ai");
        return;
    }

    if(isVague(input)){
        addMessage(randomChoice([
            "Hmm, can you explain a bit more?",
            "Got it, could you give a few more details?",
            "No worries, what exactly did you feel?"
        ]), "ai");
        return;
    }

    // Record mood
    if(!currentEntry.mood){
        currentEntry.mood = input;
        addMessage(randomChoice([
            "Got it! How was your sleep quality last night?",
            "Thanks! And how would you rate your sleep?"
        ]), "ai");
        return;
    }

    // Record sleep quality
    if(!currentEntry.sleepQuality){
        currentEntry.sleepQuality = input;
        addMessage("Great! How many hours did you sleep?", "ai");
        return;
    }

    // Record sleep duration
    if(!currentEntry.sleepDuration){
        const duration = Number(input);
        if(isNaN(duration) || duration<0 || duration>24){
            addMessage("Please enter a number of hours between 0 and 24.", "ai");
            return;
        }
        currentEntry.sleepDuration = duration;
        finalizeEntry();
        return;
    }

    // Default chatbot response for free chat
    addMessage(randomChoice([
        "Interesting! Tell me more.",
        "Oh, I see. Can you elaborate?",
        "Got it, anything else about your day?"
    ]), "ai");
}

// --- FINALIZE ENTRY & FEEDBACK ---
function finalizeEntry(){
    const user = JSON.parse(localStorage.getItem(currentUser));
    currentEntry.date = new Date().toLocaleDateString();
    user.entries.push(currentEntry);
    localStorage.setItem(currentUser, JSON.stringify(user));

    let feedback = "";

    // Mood tips
    const mood = currentEntry.mood.toLowerCase();
    if(positiveMood.some(w=>mood.includes(w))) feedback += randomChoice([
        "Great mood! Try keeping it up with a short walk or light stretching.",
        "Awesome mood! Writing a gratitude list can help maintain positivity."
    ]);
    else if(neutralMood.some(w=>mood.includes(w))) feedback += randomChoice([
        "Neutral mood today. Doing something you enjoy might lift your spirits.",
        "Okay day. Try 5–10 minutes of deep breathing or meditation."
    ]);
    else if(negativeMood.some(w=>mood.includes(w))) feedback += randomChoice([
        "Rough day? Journaling or a relaxing activity can help improve your mood.",
        "Not feeling great? A short walk or meditation may help."
    ]);

    // Sleep quality tips
    const quality = currentEntry.sleepQuality.toLowerCase();
    if(positiveSleep.some(w=>quality.includes(w))) feedback += " " + randomChoice([
        "Your sleep quality is solid. Keeping a consistent bedtime helps maintain it.",
        "Great rest! Make your room cool and dark for better sleep."
    ]);
    else if(neutralSleep.some(w=>quality.includes(w))) feedback += " " + randomChoice([
        "Sleep was okay. Reducing screens before bed may improve quality.",
        "Not bad, but a consistent pre-sleep routine might help."
    ]);
    else if(negativeSleep.some(w=>quality.includes(w))) feedback += " " + randomChoice([
        "Poor sleep? Try winding down 30 min before bed and keeping a regular schedule.",
        "Rest was rough. Dark room and avoiding caffeine can help."
    ]);

    // Sleep duration tips
    const duration = currentEntry.sleepDuration;
    if(duration>=7 && duration<=10) feedback += " You got a healthy amount of sleep. 👍";
    else if(duration>=6) feedback += " Slightly less sleep than recommended. Consider a short nap or earlier bedtime.";
    else if(duration<6) feedback += " Too little sleep! Try to go to bed earlier tonight for better rest.";
    else if(duration>10) feedback += " That's a long sleep. Maintain consistent bedtime/wake-up hours for best energy.";

    addMessage(feedback,"ai");
    loadChart();
}

// --- HELPER ---
function randomChoice(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

// --- CHART ---
function loadChart(){
    const user = JSON.parse(localStorage.getItem(currentUser));
    const entries = user.entries || [];
    const labels = entries.map(e=>e.date);
    const moods = entries.map(e=>{
        const m = e.mood.toLowerCase();
        if(positiveMood.some(w=>m.includes(w))) return 5;
        else if(neutralMood.some(w=>m.includes(w))) return 3;
        else if(negativeMood.some(w=>m.includes(w))) return 1;
        else return 3;
    });

    if(chart) chart.destroy();
    chart = new Chart(document.getElementById("chart"), {
        type:"line",
        data:{
            labels,
            datasets:[{
                label:"Mood Over Time",
                data:moods,
                borderColor:"#4caf50",
                tension:0.3
            }]
        }
    });
}
