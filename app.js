// Mood data structure
const MOODS = [
    { emoji: '😢', level: 1, label: 'Bad', color: '#f87171' },
    { emoji: '😕', level: 2, label: 'Not Great', color: '#fb923c' },
    { emoji: '😐', level: 3, label: 'Neutral', color: '#facc15' },
    { emoji: '😊', level: 4, label: 'Good', color: '#a3e635' },
    { emoji: '😀', level: 5, label: 'Great', color: '#4ade80' }
];

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize mood buttons
    initializeMoodButtons();
    
    // Set up event listeners
    const saveButton = document.getElementById('save-mood');
    console.log('Save button element:', saveButton);
    
    saveButton.addEventListener('click', (e) => {
        console.log('Save button clicked!');
        e.preventDefault();
        saveMood();
    });
    
    document.getElementById('prev-month').addEventListener('click', () => changeMonth(-1));
    document.getElementById('next-month').addEventListener('click', () => changeMonth(1));
    
    // Initialize calendar and load data
    currentDate = new Date();
    loadMoodData();
    renderCalendar();
    updateMoodStats();
    renderRecentEntries();
});

// Global variables
let currentDate;
let moodData = {};
let selectedMood = null;
let selectedDate = null;

// Initialize mood buttons
function initializeMoodButtons() {
    const container = document.getElementById('mood-buttons');
    container.innerHTML = MOODS.map(mood => `
        <button class="mood-btn mood-${mood.level}" 
                data-mood="${mood.level}" 
                title="${mood.label}"
                onclick="selectMood(${mood.level})">
            ${mood.emoji}
        </button>
    `).join('');
}

// Select a mood
function selectMood(level) {
    console.log('selectMood called with level:', level);
    selectedMood = level;
    
    // Update UI for mood buttons
    document.querySelectorAll('.mood-btn').forEach(btn => {
        const btnLevel = parseInt(btn.dataset.mood);
        const isSelected = btnLevel === level;
        btn.classList.toggle('selected', isSelected);
        console.log(`Button ${btnLevel} selected:`, isSelected);
    });
    
    // Always enable save button when a mood is selected
    const saveButton = document.getElementById('save-mood');
    saveButton.disabled = false;
    saveButton.classList.remove('opacity-50', 'cursor-not-allowed');
    
    console.log('Current selectedMood:', selectedMood, 'selectedDate:', selectedDate);
}

// Save mood to localStorage
function saveMood() {
    console.log('saveMood called with selectedMood:', selectedMood);
    
    if (!selectedMood) {
        console.log('No mood selected, showing alert');
        alert('Please select a mood first!');
        return;
    }
    
    // If no specific date is selected, use today's date
    if (!selectedDate) {
        selectedDate = new Date();
        console.log('No date selected, using today:', selectedDate);
    }
    
    const note = document.getElementById('mood-note').value.trim();
    const dateStr = getDateString(selectedDate);
    
    // Reset the prompt after saving
    const moodPrompt = document.querySelector('#mood-prompt');
    if (moodPrompt) {
        moodPrompt.textContent = 'How are you feeling today?';
    }
    
    // Save mood data
    if (!moodData[dateStr]) {
        moodData[dateStr] = [];
    }
    
    // Create new mood entry with the selected date
    const newEntry = {
        mood: selectedMood,
        note: note || null,
        timestamp: selectedDate.toISOString()
    };
    
    // Replace existing entry for this date or add new one
    moodData[dateStr] = [newEntry];
    
    console.log('New entry created:', newEntry);
    
    // Save to localStorage
    console.log('Saving to localStorage:', JSON.stringify(moodData, null, 2));
    localStorage.setItem('moodData', JSON.stringify(moodData));
    console.log('Saved mood for date:', dateStr, 'with data:', JSON.stringify(newEntry, null, 2));
    
    // Reset form
    document.getElementById('mood-note').value = '';
    document.querySelectorAll('.mood-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // Reset selected mood but keep the date in case user wants to add more entries
    selectedMood = null;
    
    // Only reset the date if we're not in "today" mode
    if (selectedDate) {
        const today = new Date();
        const selected = new Date(selectedDate);
        if (selected.toDateString() === today.toDateString()) {
            // Keep selectedDate as today
            console.log('Keeping today as selected date');
        } else {
            selectedDate = null;
        }
    }
    
    // Reset calendar selection
    document.querySelectorAll('.calendar-day').forEach(el => {
        el.classList.remove('border-2', 'border-indigo-500');
    });
    
    // Disable save button until next selection
    const saveButton = document.getElementById('save-mood');
    saveButton.disabled = true;
    saveButton.classList.add('opacity-50', 'cursor-not-allowed');
    
    // Update UI
    renderCalendar();
    updateMoodStats();
    renderRecentEntries();
    
    // Show success message
    const saveBtn = document.getElementById('save-mood');
    const originalText = saveBtn.textContent;
    saveBtn.textContent = 'Saved!';
    saveBtn.classList.add('bg-green-500');
    setTimeout(() => {
        saveBtn.textContent = originalText;
        saveBtn.classList.remove('bg-green-500');
    }, 2000);
}

// Load mood data from localStorage
function loadMoodData() {
    const savedData = localStorage.getItem('moodData');
    if (savedData) {
        moodData = JSON.parse(savedData);
    }
}

// Render calendar
function renderCalendar() {
    const calendarEl = document.getElementById('calendar');
    const monthYearEl = document.getElementById('current-month');
    const today = new Date();
    const todayStr = getDateString(today);
    
    // Set month/year header
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    monthYearEl.textContent = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    
    // Get first and last day of month
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    // Get day of week for first day (0 = Sunday, 6 = Saturday)
    const startDay = firstDay.getDay();
    
    // Clear calendar
    calendarEl.innerHTML = '';
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startDay; i++) {
        calendarEl.appendChild(createDayElement(''));
    }
    
    // Add days of the month
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const dateStr = getDateString(date);
        const isToday = dateStr === todayStr;
        const dayMood = moodData[dateStr]?.[0]?.mood;
        
        const dayEl = createDayElement(day, dayMood, isToday);
        
        // Add click event to select date and show mood details
        dayEl.addEventListener('click', () => {
            if (dayMood) {
                showMoodDetails(dateStr);
            } else {
                // Set the selected date
                selectedDate = date;
                // Update UI to show which date is selected
                document.querySelectorAll('.calendar-day').forEach(el => {
                    el.classList.remove('border-2', 'border-indigo-500');
                });
                dayEl.classList.add('border-2', 'border-indigo-500');
                
                // Show which date is being edited
                const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                                  'July', 'August', 'September', 'October', 'November', 'December'];
                const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
                const monthName = monthNames[date.getMonth()];
                const dayOfMonth = date.getDate();
                const year = date.getFullYear();
                
                // Show a message indicating which date is selected
                const moodPrompt = document.querySelector('#mood-prompt');
                if (moodPrompt) {
                    moodPrompt.textContent = `How were you feeling on ${dayOfWeek}, ${monthName} ${dayOfMonth}, ${year}?`;
                }
            }
        });
        
        calendarEl.appendChild(dayEl);
    }
}

// Create a day element for the calendar
function createDayElement(day, mood = null, isToday = false) {
    const dayEl = document.createElement('div');
    dayEl.className = 'calendar-day';
    
    if (day === '') {
        dayEl.classList.add('empty');
        return dayEl;
    }
    
    dayEl.textContent = day;
    dayEl.classList.add('relative');
    
    if (isToday) {
        dayEl.classList.add('today');
    }
    
    if (mood) {
        const moodInfo = MOODS.find(m => m.level === mood);
        dayEl.style.backgroundColor = `${moodInfo.color}40`; // Add transparency
        dayEl.style.borderColor = moodInfo.color;
        
        // Add tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'mood-tooltip';
        tooltip.textContent = moodInfo.label;
        dayEl.appendChild(tooltip);
    }
    
    return dayEl;
}

// Change month
function changeMonth(offset) {
    currentDate.setMonth(currentDate.getMonth() + offset);
    renderCalendar();
}

// Update mood statistics
function updateMoodStats() {
    const statsEl = document.getElementById('mood-stats');
    const summaryEl = document.getElementById('mood-summary');
    
    // Get all mood entries
    const allEntries = [];
    Object.entries(moodData).forEach(([date, entries]) => {
        entries.forEach(entry => {
            allEntries.push({
                date,
                ...entry
            });
        });
    });
    
    // Clear previous content
    statsEl.innerHTML = '';
    summaryEl.innerHTML = '';
    
    if (allEntries.length === 0) {
        // Show message in the stats container instead of hiding the section
        statsEl.innerHTML = '<p class="text-gray-500 text-center py-8">No mood data yet. Start tracking your mood to see statistics!</p>';
        return;
    }
    
    // Group by mood level
    const moodCounts = MOODS.reduce((acc, mood) => {
        acc[mood.level] = 0;
        return acc;
    }, {});
    
    allEntries.forEach(entry => {
        moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
    });
    
    // Calculate percentages
    const totalEntries = allEntries.length;
    const moodPercentages = MOODS.map(mood => ({
        ...mood,
        count: moodCounts[mood.level] || 0,
        percentage: Math.round(((moodCounts[mood.level] || 0) / totalEntries) * 100) || 0
    }));
    
    // Create pie chart
    const data = [{
        values: moodPercentages.map(m => m.count),
        labels: moodPercentages.map(m => m.label),
        marker: {
            colors: moodPercentages.map(m => m.color)
        },
        type: 'pie',
        hole: 0.4,
        textinfo: 'label+percent',
        hoverinfo: 'label+percent+value',
        textposition: 'inside'
    }];
    
    const layout = {
        margin: { t: 0, b: 0, l: 0, r: 0 },
        showlegend: false,
        height: 250
    };
    
    Plotly.newPlot(statsEl, data, layout, { displayModeBar: false });
    
    // Update summary
    const averageMood = allEntries.reduce((sum, entry) => sum + entry.mood, 0) / totalEntries;
    const moodTrend = calculateMoodTrend(allEntries);
    
    summaryEl.innerHTML = `
        <div class="mt-4">
            <p>Average mood: <strong>${averageMood.toFixed(1)}/5</strong></p>
            <p>Total entries: <strong>${totalEntries}</strong></p>
            <p class="mt-2">${getMoodTrendText(moodTrend)}</p>
        </div>
        <div class="mood-legend">
            ${MOODS.map(mood => `
                <div class="legend-item">
                    <div class="legend-color" style="background-color: ${mood.color}"></div>
                    <span>${mood.label}</span>
                </div>
            `).join('')}
        </div>
    `;
}

// Calculate mood trend
function calculateMoodTrend(entries) {
    if (entries.length < 2) return 0;
    
    // Sort entries by date
    const sortedEntries = [...entries].sort((a, b) => 
        new Date(a.date) - new Date(b.date)
    );
    
    // Calculate average mood for first and second half
    const midPoint = Math.floor(sortedEntries.length / 2);
    const firstHalf = sortedEntries.slice(0, midPoint);
    const secondHalf = sortedEntries.slice(-midPoint);
    
    const firstAvg = firstHalf.reduce((sum, e) => sum + e.mood, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, e) => sum + e.mood, 0) / secondHalf.length;
    
    return secondAvg - firstAvg;
}

// Get mood trend text
function getMoodTrendText(trend) {
    if (Math.abs(trend) < 0.1) {
        return 'Your mood has been stable recently.';
    } else if (trend > 0) {
        return 'Your mood has been improving recently! 😊';
    } else {
        return 'Your mood has been declining recently. Take care of yourself. 💙';
    }
}

// Render recent entries
function renderRecentEntries() {
    const container = document.getElementById('recent-entries');
    
    // Get all entries and sort by date (newest first)
    const allEntries = [];
    Object.entries(moodData).forEach(([date, entries]) => {
        entries.forEach(entry => {
            allEntries.push({
                date,
                ...entry
            });
        });
    });
    
    allEntries.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (allEntries.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-4">No entries yet. Track your mood to see them here!</p>';
        return;
    }
    
    container.innerHTML = allEntries.slice(0, 5).map(entry => {
        const moodInfo = MOODS.find(m => m.level === entry.mood);
        const date = new Date(entry.date);
        const formattedDate = date.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
        });
        
        return `
            <div class="mood-entry border-b border-gray-100 py-3">
                <div class="flex items-center justify-between">
                    <div class="flex items-center">
                        <div class="w-8 h-8 rounded-full flex items-center justify-center text-lg mr-3" 
                             style="background-color: ${moodInfo.color}40; color: ${moodInfo.color}">
                            ${moodInfo.emoji}
                        </div>
                        <div>
                            <div class="font-medium">${moodInfo.label}</div>
                            <div class="text-sm text-gray-500">${formattedDate}</div>
                        </div>
                    </div>
                    ${entry.note ? `
                        <div class="text-sm text-gray-600 flex-1 ml-4 text-right">
                            "${entry.note}"
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Show mood details for a specific date
function showMoodDetails(dateStr) {
    const entry = moodData[dateStr]?.[0];
    if (!entry) return;
    
    const moodInfo = MOODS.find(m => m.level === entry.mood);
    const date = new Date(dateStr);
    const formattedDate = date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4" style="animation: fadeIn 0.3s">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-xl font-semibold">Mood Entry</h3>
                <button class="text-gray-500 hover:text-gray-700" onclick="this.closest('.fixed').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="text-center mb-6">
                <div class="text-5xl mb-2">${moodInfo.emoji}</div>
                <div class="text-2xl font-medium mb-1">${moodInfo.label}</div>
                <div class="text-gray-500">${formattedDate}</div>
            </div>
            ${entry.note ? `
                <div class="bg-gray-50 p-4 rounded-lg mb-6">
                    <h4 class="font-medium text-gray-700 mb-1">Your note:</h4>
                    <p class="text-gray-800">${entry.note}</p>
                </div>
            ` : ''}
            <div class="flex justify-between">
                <button class="text-red-500 hover:text-red-700" onclick="deleteEntry('${dateStr}')">
                    <i class="fas fa-trash mr-1"></i> Delete
                </button>
                <button class="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700" 
                        onclick="this.closest('.fixed').remove()">
                    Close
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close on escape key
    modal.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            modal.remove();
        }
    });
    
    // Focus the modal for keyboard navigation
    modal.focus();
}

// Delete an entry
function deleteEntry(dateStr) {
    if (!confirm('Are you sure you want to delete this entry? This cannot be undone.')) {
        return;
    }
    
    delete moodData[dateStr];
    localStorage.setItem('moodData', JSON.stringify(moodData));
    
    // Close the modal
    document.querySelector('.fixed.inset-0').remove();
    
    // Update UI
    renderCalendar();
    updateMoodStats();
    renderRecentEntries();
}

// Helper function to get date string in YYYY-MM-DD format
function getDateString(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Expose functions to global scope for HTML event handlers
window.selectMood = selectMood;
window.deleteEntry = deleteEntry;
