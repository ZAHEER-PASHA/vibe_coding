// Enhanced data store with additional fields
let items = [];

// Chart.js configuration
const chartColors = {
    lost: '#ef4444',
    found: '#10b981',
    claimed: '#3b82f6',
    electronics: '#3b82f6',
    documents: '#f59e0b',
    clothing: '#db2777',
    jewelry: '#10b981',
    other: '#6b7280'
};

// Chart instances
let itemsOverTimeChart;
let categoryDistributionChart;
let statusBreakdownChart;

// Notification settings
let notificationSettings = {
    email: false,
    push: false
};

// Update notification settings
document.getElementById('email-notifications').addEventListener('change', (e) => {
    notificationSettings.email = e.target.checked;
    updateNotificationSettings();
});

document.getElementById('push-notifications').addEventListener('change', (e) => {
    notificationSettings.push = e.target.checked;
    updateNotificationSettings();
});

// Update notification settings in localStorage
function updateNotificationSettings() {
    localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings));
}

// Load notification settings from localStorage
function loadNotificationSettings() {
    const savedSettings = localStorage.getItem('notificationSettings');
    if (savedSettings) {
        notificationSettings = JSON.parse(savedSettings);
        document.getElementById('email-notifications').checked = notificationSettings.email;
        document.getElementById('push-notifications').checked = notificationSettings.push;
    }
}

// Dashboard statistics
function updateDashboardStats() {
    const totalItems = items.length;
    const itemsFound = items.filter(item => item.status === 'found').length;
    const itemsClaimed = items.filter(item => item.status === 'claimed').length;
    const successRate = Math.round((itemsFound / totalItems) * 100) || 0;

    document.getElementById('total-items').textContent = totalItems;
    document.getElementById('items-found').textContent = itemsFound;
    document.getElementById('items-claimed').textContent = itemsClaimed;
    document.getElementById('success-rate').textContent = `${successRate}%`;

    updateCharts();
    updateTables();
}

// Recent activity
function updateRecentActivity() {
    const activityList = document.getElementById('activity-list');
    activityList.innerHTML = items.map(item => `
        <div class="activity-item">
            <div class="icon">${item.type.charAt(0).toUpperCase()}</div>
            <div>
                <p>${item.name} was ${item.status} at ${item.location}</p>
                <small>${new Date(item.timestamp).toLocaleDateString()}</small>
            </div>
        </div>
    `).join('');
}

// Enhanced form handlers
function showToast(message, type = 'success', duration = 3000) {
    // Ensure toast container exists
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle';
    
    toast.innerHTML = `
        <i class="${icon}"></i>
        <span class="toast-message">${message}</span>
        <button class="toast-close">&times;</button>
    `;
    
    // Add toast to container
    toastContainer.appendChild(toast);
    
    // Remove toast after duration or when close button is clicked
    const removeToast = () => {
        toast.classList.add('fade-out');
        setTimeout(() => {
            toast.remove();
        }, 300);
    };
    
    // Set timeout for automatic removal
    const timer = setTimeout(removeToast, duration);
    
    // Clean up timer when toast is removed
    toast.addEventListener('transitionend', () => {
        clearTimeout(timer);
    });
    
    // Add click handler for close button
    toast.querySelector('.toast-close').addEventListener('click', () => {
        clearTimeout(timer);
        removeToast();
    });
}

function addNewItem(type) {
    const formId = type === 'lost' ? 'lost-form' : 'found-form';
    const form = document.getElementById(formId);
    
    const item = {
        type: type,
        name: document.getElementById(`${type}-item-name`).value,
        description: document.getElementById(`${type}-description`).value,
        location: document.getElementById(`${type}-location`).value,
        contact: document.getElementById(`${type}-contact`).value,
        category: document.getElementById(`${type}-category`).value,
        timestamp: new Date().toISOString()
    };

    if (type === 'lost') {
        const imageInput = document.getElementById('lost-image');
        if (imageInput.files.length > 0) {
            for (let i = 0; i < imageInput.files.length; i++) {
                const file = imageInput.files[i];
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        item.images = item.images || [];
                        item.images.push(e.target.result);
                    };
                    reader.readAsDataURL(file);
                }
            }
        }
    }

    items.push(item);
    showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} item reported successfully!`);
    form.reset();
    
    // Reset image preview if it's a lost item
    if (type === 'lost') {
        const previewContainer = document.querySelector('.image-preview-container');
        previewContainer.innerHTML = '<p class="preview-text">Drag and drop images here or click to upload</p>';
        document.getElementById('lost-image').value = '';
    }

    // Update dashboard and recent activity
    updateDashboardStats();
    updateRecentActivity();

    // Send notifications based on user preferences
    if (notificationSettings.email) {
        sendEmailNotification(item);
    }
    
    if (notificationSettings.push) {
        sendPushNotification(item);
    }
}

// Search functionality with filters
document.getElementById('search-button').addEventListener('click', () => {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const category = document.getElementById('category-filter').value;
    const status = document.getElementById('status-filter').value;

    const filteredItems = items.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm) || 
                           item.description.toLowerCase().includes(searchTerm);
        const matchesCategory = !category || item.category === category;
        const matchesStatus = !status || item.status === status;
        
        return matchesSearch && matchesCategory && matchesStatus;
    });

    displaySearchResults(filteredItems);
});

// Initialize form event listeners
document.getElementById('lost-form').addEventListener('submit', function(e) {
    e.preventDefault();
    addNewItem('lost');
});

document.getElementById('found-form').addEventListener('submit', function(e) {
    e.preventDefault();
    addNewItem('found');
    items.push(item);
    alert('Found item reported successfully!');
    this.reset();
});



// Display search results
function displaySearchResults(results) {
    const resultsDiv = document.getElementById('search-results');
    resultsDiv.innerHTML = '';
    
    if (results.length === 0) {
        resultsDiv.innerHTML = '<p>No items found matching your search.</p>';
        return;
    }
    
    results.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'search-result';
        itemDiv.innerHTML = `
            <h3>${item.name}</h3>
            <p><strong>Type:</strong> ${item.type === 'lost' ? 'Lost' : 'Found'}</p>
            <p><strong>Description:</strong> ${item.description}</p>
            <p><strong>Location:</strong> ${item.location}</p>
            <p><strong>Contact:</strong> ${item.contact}</p>
            <p><strong>Date:</strong> ${new Date(item.timestamp).toLocaleDateString()}</p>
        `;
        resultsDiv.appendChild(itemDiv);
    });
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    // Add Chart.js script
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    document.head.appendChild(script);

    script.onload = () => {
        initializeCharts();
    };
    // Add sample data
    items = [
        {
            id: 1,
            type: 'lost',
            name: 'Laptop Charger',
            description: 'Black charger with white apple logo',
            location: 'Cafe near Central Park',
            contact: 'john@example.com',
            timestamp: '2025-08-05T14:30:00',
            status: 'lost',
            category: 'electronics'
        },
        {
            id: 2,
            type: 'found',
            name: 'Wallet',
            description: 'Black leather wallet with red interior',
            location: 'Bus stop near Times Square',
            contact: 'sarah@example.com',
            timestamp: '2025-08-06T10:15:00',
            status: 'found',
            category: 'other'
        },
        {
            id: 3,
            type: 'lost',
            name: 'Jacket',
            description: 'Blue denim jacket with leather patches',
            location: 'Music Hall',
            contact: 'mike@example.com',
            timestamp: '2025-08-07T16:45:00',
            status: 'lost',
            category: 'clothing'
        },
        {
            id: 4,
            type: 'found',
            name: 'Passport',
            description: 'US Passport with name "Smith"',
            location: 'Airport Terminal',
            contact: 'anna@example.com',
            timestamp: '2025-08-08T09:20:00',
            status: 'found',
            category: 'documents'
        }
    ];

    // Load notification settings
    loadNotificationSettings();
    
    // Initialize dashboard and activity
    updateDashboardStats();
    updateRecentActivity();
});
