import { database } from './firebase-config.js';
import { ref, onValue, set, push } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-database.js";

// DOM Elements
const habitsBody = document.getElementById('habits-body');
const currentDate = document.getElementById('current-date');
const swethaDailyScore = document.getElementById('swetha-daily-score');
const akshayaDailyScore = document.getElementById('akshaya-daily-score');
const swethaOverallScore = document.getElementById('swetha-overall-score');
const akshayaOverallScore = document.getElementById('akshaya-overall-score');
const todayLeaderStatus = document.getElementById('today-leader-status');
const overallLeaderStatus = document.getElementById('overall-leader-status');
const addHabitForm = document.getElementById('add-habit-form');
const activityList = document.getElementById('activity-list');
const datePicker = document.getElementById('date-picker');

function getToday() {
    return new Date().toISOString().split('T')[0];
}

let selectedDate = getToday();
let scores = {
    swetha: { total: 0, daily: {} },
    akshaya: { total: 0, daily: {} }
};
let habits = [];

function updateDateDisplay() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    currentDate.textContent = new Date(selectedDate).toLocaleDateString('en-US', options);
}

function loadHabits() {
    const habitsRef = ref(database, 'habits');
    onValue(habitsRef, (snapshot) => {
        habits = snapshot.val() || [];
        renderHabits();
    });
}

function loadScores() {
    const scoresRef = ref(database, 'scores');
    onValue(scoresRef, (snapshot) => {
        scores = snapshot.val() || {
            swetha: { total: 0, daily: {} },
            akshaya: { total: 0, daily: {} }
        };
        updateScores();
    });
}

function loadActivityLog() {
    const activityRef = ref(database, 'activityLog');
    onValue(activityRef, (snapshot) => {
        const activities = snapshot.val() || [];
        renderActivityLog(activities);
    });
}

function renderHabits() {
    habitsBody.innerHTML = '';
    if (!Array.isArray(habits)) return;
    habits.forEach((habit, index) => {
        const row = document.createElement('tr');
        const swethaStatus = habit.status?.[selectedDate]?.swetha || 'pending';
        const akshayaStatus = habit.status?.[selectedDate]?.akshaya || 'pending';
        row.innerHTML = `
            <td>${habit.name}</td>
            <td>
                <span class="status-icon status-${swethaStatus}">
                    ${getStatusIcon(swethaStatus)}
                </span>
            </td>
            <td>
                <span class="status-icon status-${akshayaStatus}">
                    ${getStatusIcon(akshayaStatus)}
                </span>
            </td>
            <td>${habit.points}</td>
            <td>
                <button class="btn-done" data-user="swetha" data-status="done" data-index="${index}">Swetha Done</button>
                <button class="btn-missed" data-user="swetha" data-status="missed" data-index="${index}">Swetha Missed</button>
            </td>
            <td>
                <button class="btn-done" data-user="akshaya" data-status="done" data-index="${index}">Akshaya Done</button>
                <button class="btn-missed" data-user="akshaya" data-status="missed" data-index="${index}">Akshaya Missed</button>
            </td>
        `;
        habitsBody.appendChild(row);
    });
}

habitsBody.addEventListener('click', function(e) {
    if (e.target.tagName === 'BUTTON') {
        const index = e.target.getAttribute('data-index');
        const user = e.target.getAttribute('data-user');
        const status = e.target.getAttribute('data-status');
        if (index !== null && user && status) {
            updateStatus(Number(index), user, status);
        }
    }
});

function getStatusIcon(status) {
    switch(status) {
        case 'done': return '✅';
        case 'missed': return '❌';
        default: return '⏳';
    }
}

function ensureScoresStructure() {
    // Migrate old keys if present
    if (typeof scores.swetha === 'number') {
        scores.swetha = { total: scores.swetha, daily: {} };
    }
    if (typeof scores.akshaya === 'number') {
        scores.akshaya = { total: scores.akshaya, daily: {} };
    }
    // Handle legacy 'friend' key
    if (typeof scores.friend === 'number') {
        scores.akshaya = { total: scores.friend, daily: {} };
        delete scores.friend;
    }
    if (!scores.swetha) scores.swetha = { total: 0, daily: {} };
    if (!scores.akshaya) scores.akshaya = { total: 0, daily: {} };
    if (!scores.swetha.daily) scores.swetha.daily = {};
    if (!scores.akshaya.daily) scores.akshaya.daily = {};
}

function updateScores() {
    ensureScoresStructure();
    const swethaDaily = scores.swetha.daily[selectedDate] || 0;
    const akshayaDaily = scores.akshaya.daily[selectedDate] || 0;
    swethaDailyScore.textContent = swethaDaily;
    akshayaDailyScore.textContent = akshayaDaily;
    swethaOverallScore.textContent = scores.swetha.total;
    akshayaOverallScore.textContent = scores.akshaya.total;
    const dailyDiff = Math.abs(swethaDaily - akshayaDaily);
    if (swethaDaily > akshayaDaily) {
        todayLeaderStatus.textContent = `Swetha is leading today by ${dailyDiff} points`;
    } else if (akshayaDaily > swethaDaily) {
        todayLeaderStatus.textContent = `Akshaya is leading today by ${dailyDiff} points`;
    } else {
        todayLeaderStatus.textContent = 'Today\'s scores are tied!';
    }
    const totalDiff = Math.abs(scores.swetha.total - scores.akshaya.total);
    if (scores.swetha.total > scores.akshaya.total) {
        overallLeaderStatus.textContent = `Swetha is leading overall by ${totalDiff} points`;
    } else if (scores.akshaya.total > scores.swetha.total) {
        overallLeaderStatus.textContent = `Akshaya is leading overall by ${totalDiff} points`;
    } else {
        overallLeaderStatus.textContent = 'Overall scores are tied!';
    }
}

function updateStatus(habitIndex, user, status) {
    ensureScoresStructure();
    const habit = habits[habitIndex];
    const points = status === 'done' ? habit.points : -habit.points;
    if (!habit.status) habit.status = {};
    if (!habit.status[selectedDate]) habit.status[selectedDate] = {};
    habit.status[selectedDate][user] = status;
    if (!scores[user].daily[selectedDate]) scores[user].daily[selectedDate] = 0;
    scores[user].daily[selectedDate] += points;
    scores[user].total += points;
    set(ref(database, 'habits'), habits);
    set(ref(database, 'scores'), scores);
    const activity = {
        timestamp: Date.now(),
        message: `${user} ${status} ${habit.name} (${points > 0 ? '+' : ''}${points} points) on ${selectedDate}`
    };
    push(ref(database, 'activityLog'), activity);
}

function renderActivityLog(activities) {
    activityList.innerHTML = '';
    Object.values(activities).reverse().forEach(activity => {
        const item = document.createElement('div');
        item.className = 'activity-item';
        item.textContent = activity.message;
        activityList.appendChild(item);
    });
}

addHabitForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('habit-name').value;
    const points = parseInt(document.getElementById('habit-points').value);
    const newHabit = {
        name,
        points,
        status: {}
    };
    habits.push(newHabit);
    set(ref(database, 'habits'), habits);
    addHabitForm.reset();
});

function setDatePickerToToday() {
    const today = getToday();
    datePicker.value = today;
    selectedDate = today;
    updateDateDisplay();
    renderHabits();
    updateScores();
}

datePicker.addEventListener('change', (e) => {
    selectedDate = e.target.value;
    updateDateDisplay();
    renderHabits();
    updateScores();
});

setDatePickerToToday();
loadHabits();
loadScores();
loadActivityLog();

// Make updateStatus globally available (for inline buttons)
window.updateStatus = updateStatus; 