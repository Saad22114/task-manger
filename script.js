// Add debug logging
const debug = true;
function log(...args) {
    if (debug) console.log(...args);
}

// Update datetime with error handling
function updateDateTime() {
    try {
        const now = new Date();
        const formatted = now.toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
        document.getElementById('datetime').textContent = formatted;
    } catch (error) {
        console.error('Error updating datetime:', error);
    }
}

// Data Storage Enhancement System
class DataStorage {
    constructor() {
        this.storageKey = 'tasks';
        this.backupKey = 'tasks_backup';
        this.lastSyncKey = 'last_sync';
        this.domainKey = window.location.hostname || 'localhost';
    }

    // Store data with domain-specific keys
    saveData(data) {
        try {
            const storageKey = `${this.domainKey}_${this.storageKey}`;
            const serialized = JSON.stringify(data);
            localStorage.setItem(storageKey, serialized);
            
            // Store backup copy with timestamp
            const backupKey = `${this.domainKey}_${this.backupKey}`;
            const backupData = {
                data: data,
                timestamp: new Date().toISOString(),
                version: '1.0'
            };
            localStorage.setItem(backupKey, JSON.stringify(backupData));
            
            // Update last sync time
            localStorage.setItem(`${this.domainKey}_${this.lastSyncKey}`, new Date().toISOString());
            
            return true;
        } catch (error) {
            console.error('Error saving data:', error);
            return false;
        }
    }

    // Load data with domain-specific keys
    loadData() {
        try {
            const storageKey = `${this.domainKey}_${this.storageKey}`;
            const data = localStorage.getItem(storageKey);
            
            if (data) {
                return JSON.parse(data);
            }
            
            // Try to recover from backup if main data is missing
            return this.recoverFromBackup();
        } catch (error) {
            console.error('Error loading data:', error);
            // Try to recover from backup if parsing fails
            return this.recoverFromBackup();
        }
    }

    // Recovery from backup
    recoverFromBackup() {
        try {
            const backupKey = `${this.domainKey}_${this.backupKey}`;
            const backupData = localStorage.getItem(backupKey);
            
            if (backupData) {
                const parsed = JSON.parse(backupData);
                notifications.show('Recovered data from backup', 'info');
                return parsed.data;
            }
            
            return [];
        } catch (error) {
            console.error('Error recovering from backup:', error);
            return [];
        }
    }

    // Create a full export with metadata
    createExport() {
        const tasks = this.loadData();
        return {
            tasks: tasks,
            exportDate: new Date().toISOString(),
            domain: this.domainKey,
            version: '1.0',
            metadata: {
                totalTasks: tasks.length,
                pendingTasks: tasks.filter(t => t.status === 'pending').length,
                completedTasks: tasks.filter(t => t.status === 'completed').length,
                exportType: 'full-backup'
            }
        };
    }

    // Import data from export file
    importFromExport(importData) {
        try {
            if (!importData || !Array.isArray(importData.tasks)) {
                throw new Error('Invalid backup format');
            }
            
            // Save the imported data
            return this.saveData(importData.tasks);
        } catch (error) {
            console.error('Import error:', error);
            return false;
        }
    }

    // Check storage health and availability
    checkStorage() {
        try {
            const testKey = `${this.domainKey}_storage_test`;
            localStorage.setItem(testKey, 'test');
            const testValue = localStorage.getItem(testKey);
            localStorage.removeItem(testKey);
            
            return testValue === 'test';
        } catch (error) {
            console.error('Storage not available:', error);
            return false;
        }
    }
}

// Create a global data storage instance
const dataStorage = new DataStorage();

// Theme toggling
const themeToggle = document.getElementById('themeToggle');
themeToggle.addEventListener('click', () => {
    document.body.dataset.theme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', document.body.dataset.theme);
});

// Add notification system
class NotificationSystem {
    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'notification-container';
        document.body.appendChild(this.container);
    }

    show(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-icon">${this.getIcon(type)}</div>
            <div class="notification-message">${message}</div>
        `;
        
        this.container.appendChild(notification);
        
        // Animate in
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Auto remove
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    getIcon(type) {
        switch(type) {
            case 'success': return '✅';
            case 'error': return '❌';
            case 'warning': return '⚠️';
            default: return 'ℹ️';
        }
    }
}

// Create notification instance
const notifications = new NotificationSystem();

// Task management
class TaskManager {
    constructor() {
        this.tasks = [];
        this.isTaskListVisible = true;
        this.currentCenter = 'all';
        this.currentStatus = 'all';
        this.currentPeriod = 'all';
        this.searchQuery = '';
        this.currentSort = 'date-desc';
        this.currentTags = new Set();
        
        // Initialize with proper data loading
        this.loadTasks();
        this.setupHelpTooltips();
        this.setupAutoSave();
    }

    // Load tasks with enhanced storage
    loadTasks() {
        const storedTasks = dataStorage.loadData();
        this.tasks = Array.isArray(storedTasks) ? storedTasks : [];
        
        // Validate loaded tasks to ensure integrity
        this.tasks = this.tasks.filter(task => {
            return task && task.id && task.title && task.description;
        });
    }

    // Save tasks with enhanced storage
    saveTasks() {
        const saved = dataStorage.saveData(this.tasks);
        if (saved) {
            this.renderTasks();
        } else {
            notifications.show('Failed to save tasks', 'error');
        }
    }

    // Set up automatic saving at intervals
    setupAutoSave() {
        // Auto-save every 2 minutes
        setInterval(() => {
            dataStorage.saveData(this.tasks);
        }, 120000);
    }

    setupHelpTooltips() {
        const tooltips = {
            'taskTitle': 'Enter a clear, concise task title',
            'taskDescription': 'Provide detailed task information and requirements',
            'taskDate': 'Set the task due date',
            'taskPriority': 'Set task importance level',
            'taskTags': 'Add keywords to categorize your task',
            'centerSelect': 'Select task location or department',
            'statusFilter': 'Filter tasks by their current status',
            'periodFilter': 'Filter tasks by time period',
            'sortTasks': 'Change how tasks are ordered'
        };

        Object.entries(tooltips).forEach(([id, text]) => {
            const element = document.getElementById(id);
            if (element) {
                element.title = text;
            }
        });
    }

    addTag(tagInput) {
        const tag = tagInput.value.trim();
        if (tag && !this.currentTags.has(tag)) {
            this.currentTags.add(tag);
            this.renderTags();
            tagInput.value = '';
        }
    }

    removeTag(tag) {
        this.currentTags.delete(tag);
        this.renderTags();
    }

    renderTags() {
        const container = document.querySelector('.tags-container');
        container.innerHTML = '';
        this.currentTags.forEach(tag => {
            const tagElement = document.createElement('span');
            tagElement.className = 'tag';
            tagElement.innerHTML = `
                ${tag}
                <span class="tag-remove" onclick="taskManager.removeTag('${tag}')">&times;</span>
            `;
            container.appendChild(tagElement);
        });
    }

    addTask(task) {
        this.tasks.push({
            id: Date.now(),
            ...task,
            status: 'pending',
            tags: Array.from(this.currentTags),
            priority: document.getElementById('taskPriority').value,
            createdAt: new Date().toISOString() // Add creation timestamp
        });
        this.currentTags.clear();
        this.renderTags();
        this.saveTasks();
        notifications.show('Task added successfully', 'success');
    }

    updateTask(id, updates) {
        const index = this.tasks.findIndex(task => task.id === id);
        if (index !== -1) {
            this.tasks[index] = { ...this.tasks[index], ...updates };
            this.saveTasks();
        }
    }

    deleteTask(id) {
        this.tasks = this.tasks.filter(task => task.id !== id);
        this.saveTasks();
        notifications.show('Task deleted', 'info');
    }

    confirmDelete(id) {
        const popup = document.createElement('div');
        popup.className = 'edit-popup';
        popup.innerHTML = `
            <div class="popup-content confirm-dialog">
                <h3>Confirm Delete</h3>
                <p>Are you sure you want to delete this task?</p>
                <div class="popup-buttons">
                    <button id="confirmDelete" class="danger-button">Yes, Delete</button>
                    <button id="cancelDelete">Cancel</button>
                </div>
            </div>
        `;

        document.body.appendChild(popup);

        document.getElementById('confirmDelete').addEventListener('click', () => {
            this.deleteTask(id);
            document.body.removeChild(popup);
        });

        document.getElementById('cancelDelete').addEventListener('click', () => {
            document.body.removeChild(popup);
        });
    }

    saveTasks() {
        const saved = dataStorage.saveData(this.tasks);
        if (saved) {
            this.renderTasks();
        } else {
            notifications.show('Failed to save tasks', 'error');
        }
    }

    sortTasks(tasks) {
        switch(this.currentSort) {
            case 'date-asc':
                return tasks.sort((a, b) => new Date(a.date) - new Date(b.date));
            case 'date-desc':
                return tasks.sort((a, b) => new Date(b.date) - new Date(a.date));
            case 'priority':
                return tasks.sort((a, b) => {
                    const priorityOrder = { 'pending': 2, 'progress': 1, 'completed': 0 };
                    return priorityOrder[a.status] - priorityOrder[b.status];
                });
            default:
                return tasks;
        }
    }

    isTaskOverdue(task) {
        if (task.status === 'completed') return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dueDate = new Date(task.date);
        return dueDate < today;
    }

    filterTasks() {
        const taskList = document.getElementById('taskList');
        taskList.innerHTML = '';
        
        let filteredTasks = [...this.tasks];

        // Filter by search query
        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            filteredTasks = filteredTasks.filter(task => 
                task.title.toLowerCase().includes(query) ||
                task.description.toLowerCase().includes(query) ||
                task.center.toLowerCase().includes(query)
            );
        }

        // Filter by center
        if (this.currentCenter !== 'all') {
            filteredTasks = filteredTasks.filter(task => task.center === this.currentCenter);
        }

        // Filter by status
        if (this.currentStatus !== 'all') {
            filteredTasks = filteredTasks.filter(task => task.status === this.currentStatus);
        }

        // Filter by time period
        if (this.currentPeriod !== 'all') {
            const now = new Date();
            const taskDate = task => new Date(task.date);
            
            switch (this.currentPeriod) {
                case 'month':
                    filteredTasks = filteredTasks.filter(task => 
                        taskDate(task).getMonth() === now.getMonth() &&
                        taskDate(task).getFullYear() === now.getFullYear()
                    );
                    break;
                case 'year':
                    filteredTasks = filteredTasks.filter(task =>
                        taskDate(task).getFullYear() === now.getFullYear()
                    );
                    break;
            }
        }
        
        // Apply sorting
        filteredTasks = this.sortTasks(filteredTasks);

        filteredTasks.forEach(task => {
            const taskCard = document.createElement('div');
            taskCard.className = 'task-card';
            if (this.isTaskOverdue(task)) {
                taskCard.classList.add('overdue');
            }
            taskCard.dataset.status = task.status;
            taskCard.dataset.priority = task.priority || 'medium';
            
            const tagsHtml = task.tags ? task.tags.map(tag => 
                `<span class="tag">${tag}</span>`
            ).join('') : '';

            const overdueBadge = this.isTaskOverdue(task) ? 
                '<span class="overdue-badge">Overdue</span>' : '';
            
            taskCard.innerHTML = `
                <h3>${task.title} ${overdueBadge}</h3>
                <p>${task.description}</p>
                <div class="task-meta">
                    <span>Date: ${task.date}</span>
                    <span>Center: ${task.center}</span>
                    <span>Status: ${this.getStatusInArabic(task.status)}</span>
                    <span class="priority-badge priority-${task.priority || 'medium'}">
                        ${this.getPriorityInArabic(task.priority)}
                    </span>
                </div>
                <div class="tags-area">${tagsHtml}</div>
                <div class="task-actions">
                    <button onclick="taskManager.editTask(${task.id})" title="Edit">✎</button>
                    <button onclick="taskManager.cycleStatus(${task.id})" title="Change Status">↻</button>
                    <button onclick="taskManager.confirmDelete(${task.id})" title="Delete" class="delete-btn">🗑</button>
                </div>
            `;
            
            taskList.appendChild(taskCard);
        });
    }

    renderTasks() {
        this.filterTasks(); // Replace old render with filter
    }

    cycleStatus(id) {
        const statusCycle = ['pending', 'progress', 'completed'];
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            const currentIndex = statusCycle.indexOf(task.status);
            const nextStatus = statusCycle[(currentIndex + 1) % statusCycle.length];
            this.updateTask(id, { status: nextStatus });
        }
    }

    editTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (!task) return;

        // Create popup form
        const popup = document.createElement('div');
        popup.className = 'edit-popup';
        popup.innerHTML = `
            <div class="popup-content">
                <h3>Edit Task</h3>
                <div class="form-group">
                    <label for="editTitle">Title:</label>
                    <input type="text" id="editTitle" value="${task.title}">
                </div>
                <div class="form-group">
                    <label for="editDescription">Description:</label>
                    <textarea id="editDescription">${task.description}</textarea>
                </div>
                <div class="form-group">
                    <label for="editDate">Due Date:</label>
                    <input type="date" id="editDate" value="${task.date}">
                </div>
                <div class="form-group">
                    <label for="editPriority">Priority:</label>
                    <select id="editPriority">
                        <option value="low" ${task.priority === 'low' ? 'selected' : ''}>Low Priority</option>
                        <option value="medium" ${task.priority === 'medium' ? 'selected' : ''}>Medium Priority</option>
                        <option value="high" ${task.priority === 'high' ? 'selected' : ''}>High Priority</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="editCenter">Center:</label>
                    <select id="editCenter">
                        <option value="ghado" ${task.center === 'ghado' ? 'selected' : ''}>Ghado Center</option>
                        <option value="zeek" ${task.center === 'zeek' ? 'selected' : ''}>Zeek Center</option>
                        <option value="hajeef" ${task.center === 'hajeef' ? 'selected' : ''}>Hajeef Center</option>
                    </select>
                </div>
                <div class="popup-buttons">
                    <button id="saveEdit">Save Changes</button>
                    <button id="cancelEdit">Cancel</button>
                </div>
            </div>
        `;

        document.body.appendChild(popup);

        // Handle save
        document.getElementById('saveEdit').addEventListener('click', () => {
            const updates = {
                title: document.getElementById('editTitle').value,
                description: document.getElementById('editDescription').value,
                date: document.getElementById('editDate').value,
                center: document.getElementById('editCenter').value,
                priority: document.getElementById('editPriority').value
            };

            if (!updates.title || !updates.description || !updates.date) {
                notifications.show('Please fill in all required fields', 'error');
                return;
            }

            this.updateTask(id, updates);
            document.body.removeChild(popup);
            notifications.show('Task updated successfully', 'success');
        });

        // Handle cancel
        document.getElementById('cancelEdit').addEventListener('click', () => {
            document.body.removeChild(popup);
        });
    }

    exportTasks() {
        try {
            const exportData = dataStorage.createExport();
            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = window.URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `al-murooj-tasks-${new Date().toISOString().split('T')[0]}.json`;
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            notifications.show('Tasks exported successfully! File saved to your downloads', 'success');
        } catch (error) {
            console.error('Export failed:', error);
            notifications.show('Failed to export tasks. Please try again', 'error');
        }
    }

    importTasks() {
        try {
            // Create file input
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            
            input.onchange = e => {
                const file = e.target.files[0];
                const reader = new FileReader();
                
                reader.onload = event => {
                    try {
                        const importData = JSON.parse(event.target.result);
                        
                        // Backup current tasks
                        const oldTasks = [...this.tasks];
                        
                        if (dataStorage.importFromExport(importData)) {
                            // Reload tasks from storage
                            this.loadTasks();
                            this.renderTasks();
                            notifications.show('Tasks imported successfully!', 'success');
                        } else {
                            // Restore old tasks if import fails
                            this.tasks = oldTasks;
                            this.saveTasks();
                            throw new Error('Failed to import tasks');
                        }
                    } catch (err) {
                        console.error('Import failed:', err);
                        notifications.show('Failed to import tasks', 'error');
                    }
                };
                
                reader.readAsText(file);
            };
            
            input.click();
        } catch (error) {
            console.error('Import failed:', error);
            notifications.show('Failed to import tasks', 'error');
        }
    }

    backupToCloud() {
        const backupBtn = document.getElementById('backup');
        backupBtn.disabled = true;
        backupBtn.textContent = '💾 Backing up...';
        
        setTimeout(() => {
            try {
                // Create a backup in local storage
                const backupData = dataStorage.createExport();
                localStorage.setItem('cloud_backup_' + new Date().toISOString(), JSON.stringify(backupData));
                
                notifications.show('Backup created successfully', 'success');
            } catch (error) {
                console.error('Backup failed:', error);
                notifications.show('Failed to create backup', 'error');
            } finally {
                backupBtn.disabled = false;
                backupBtn.textContent = '💾 Backup';
            }
        }, 1000);
    }

    statistics() {
        // Calculate statistics
        const totalTasks = this.tasks.length;
        const pending = this.tasks.filter(t => t.status === 'pending').length;
        const inProgress = this.tasks.filter(t => t.status === 'progress').length;
        const completed = this.tasks.filter(t => t.status === 'completed').length;
        
        // Create statistics popup
        const popup = document.createElement('div');
        popup.className = 'edit-popup';
        popup.innerHTML = `
            <div class="popup-content" style="width: 500px;">
                <h3>Task Statistics</h3>
                <div class="statistics-content">
                    <canvas id="statsChart" width="400" height="300"></canvas>
                    <div class="stats-text">
                        <p>Total Tasks: ${totalTasks}</p>
                        <p>Pending Tasks: ${pending}</p>
                        <p>Tasks in Progress: ${inProgress}</p>
                        <p>Completed Tasks: ${completed}</p>
                    </div>
                </div>
                <div class="popup-buttons">
                    <button id="closeStats">Close</button>
                </div>
            </div>
        `;

        document.body.appendChild(popup);

        // Create the chart
        const ctx = document.getElementById('statsChart').getContext('2d');
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Pending', 'In Progress', 'Completed'],
                datasets: [{
                    data: [pending, inProgress, completed],
                    backgroundColor: [
                        '#ff6b6b', // red for pending
                        '#ffd93d', // yellow for in progress
                        '#6bcb77'  // green for completed
                    ],
                    borderColor: [
                        '#ff5252',
                        '#ffc800',
                        '#4caf50'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            font: {
                                size: 14
                            }
                        }
                    }
                }
            }
        });

        // Handle close
        document.getElementById('closeStats').addEventListener('click', () => {
            document.body.removeChild(popup);
        });
    }

    printTasks() {
        // Create print-friendly view
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
            <head>
                <title>Task Report - Al-Murooj Dairy</title>
                <style>
                    body { font-family: Arial, sans-serif; }
                    .task-card { 
                        border: 1px solid #ccc; 
                        padding: 10px; 
                        margin: 10px 0;
                        page-break-inside: avoid;
                    }
                    .header { 
                        text-align: center;
                        margin-bottom: 20px;
                    }
                    .date { 
                        text-align: left;
                        color: #666;
                    }
                    @media print {
                        .task-card { break-inside: avoid; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Al-Murooj Dairy</h1>
                    <h2>Task Report</h2>
                    <p class="date">Print Date: ${new Date().toLocaleString('en-US')}</p>
                </div>
        `);

        // Add tasks to print view
        this.tasks.forEach(task => {
            printWindow.document.write(`
                <div class="task-card">
                    <h3>${task.title}</h3>
                    <p>${task.description}</p>
                    <div>
                        <p>Date: ${task.date}</p>
                        <p>Center: ${task.center}</p>
                        <p>Status: ${this.getStatusInArabic(task.status)}</p>
                    </div>
                </div>
            `);
        });

        printWindow.document.write('</body></html>');
        printWindow.document.close();

        // Wait for content to load then print
        setTimeout(() => {
            printWindow.print();
            setTimeout(() => printWindow.close(), 500);
        }, 250);
    }

    getStatusInArabic(status) {
        switch(status) {
            case 'pending': return 'Pending';
            case 'progress': return 'In Progress';
            case 'completed': return 'Completed';
            default: return status;
        }
    }

    getPriorityInArabic(priority) {
        switch(priority) {
            case 'high': return 'High Priority';
            case 'medium': return 'Medium Priority';
            case 'low': return 'Low Priority';
            default: return 'Medium Priority';
        }
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + / to focus search
            if ((e.ctrlKey || e.metaKey) && e.key === '/') {
                e.preventDefault();
                document.getElementById('searchTasks').focus();
            }
            
            // Ctrl/Cmd + N to add new task
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                document.getElementById('taskTitle').focus();
            }

            // Ctrl/Cmd + H to toggle task list
            if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
                e.preventDefault();
                this.toggleTaskList();
            }

            // Ctrl/Cmd + S to save/export
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.exportTasks();
            }

            // Ctrl/Cmd + P to print
            if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
                e.preventDefault();
                this.printTasks();
            }

            // Esc to clear search
            if (e.key === 'Escape') {
                const searchInput = document.getElementById('searchTasks');
                if (document.activeElement === searchInput) {
                    searchInput.value = '';
                    this.searchQuery = '';
                    this.filterTasks();
                }
            }
        });

        // Add keyboard shortcut hints to button titles
        const shortcuts = {
            'addTask': 'Add Task (Ctrl+N)',
            'toggleTasks': 'Toggle Task List (Ctrl+H)',
            'export': 'Export Tasks (Ctrl+S)',
            'print': 'Print Tasks (Ctrl+P)',
            'searchTasks': 'Search (Ctrl+/)'
        };

        Object.entries(shortcuts).forEach(([id, title]) => {
            const element = document.getElementById(id);
            if (element) {
                element.title = title;
            }
        });
    }

    checkOverdueTasks() {
        const overdueTasks = this.tasks.filter(task => this.isTaskOverdue(task));
        if (overdueTasks.length > 0) {
            notifications.show(`You have ${overdueTasks.length} overdue tasks`, 'warning');
        }
    }
}

const taskManager = new TaskManager();

const taskTemplates = {
    maintenance: {
        title: "Routine Maintenance Check",
        description: "Perform routine maintenance inspection and service.\n\n1. Check equipment condition\n2. Test all components\n3. Clean and lubricate as needed\n4. Document findings",
        priority: "medium"
    },
    inspection: {
        title: "Equipment Inspection",
        description: "Conduct thorough equipment inspection.\n\n1. Safety check\n2. Performance evaluation\n3. Check for wear and tear\n4. Document issues found",
        priority: "high"
    },
    cleaning: {
        title: "Facility Cleaning",
        description: "Complete cleaning of facility areas.\n\n1. Clean equipment surfaces\n2. Sanitize work areas\n3. Dispose of waste properly\n4. Check cleaning supplies",
        priority: "low"
    }
};

// Initialize with error handling
document.addEventListener('DOMContentLoaded', () => {
    try {
        log('Initializing application...');
        
        // Check if storage is available
        if (!dataStorage.checkStorage()) {
            throw new Error('Local storage is not available');
        }

        // Create the notification system
        window.notifications = new NotificationSystem();
        
        setInterval(updateDateTime, 1000);
        updateDateTime();
        
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.body.dataset.theme = savedTheme;
        log('Theme loaded:', savedTheme);
        
        // Create task manager after confirming storage works
        window.taskManager = new TaskManager();
        taskManager.renderTasks();
        log('Tasks rendered successfully');

        // Add logo debugging
        const logoImg = document.querySelector('.logo img');
        logoImg.addEventListener('error', () => {
            console.error('Logo failed to load:', logoImg.src);
            logoImg.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="60" height="60"%3E%3Crect width="100%25" height="100%25" fill="%23756d50"/%3E%3Ctext x="50%25" y="50%25" font-family="Arial" font-size="12" fill="white" text-anchor="middle" dy=".3em"%3EAl-Murooj%3C/text%3E%3C/svg%3E';
        });

        // Add export button handler
        document.getElementById('export').addEventListener('click', () => {
            taskManager.exportTasks();
        });
        
        // Add import/restore button handler
        document.getElementById('restore').addEventListener('click', () => {
            taskManager.importTasks();
        });

        // Add toggle tasks button handler
        document.getElementById('toggleTasks').addEventListener('click', () => {
            taskManager.toggleTaskList();
        });

        // Add center select handler
        document.getElementById('centerSelect').addEventListener('change', (e) => {
            taskManager.currentCenter = e.target.value;
            taskManager.filterTasks();
        });

        // Add status filter handler
        document.getElementById('statusFilter').addEventListener('change', (e) => {
            taskManager.currentStatus = e.target.value;
            taskManager.filterTasks();
        });

        // Add period filter handler
        document.getElementById('periodFilter').addEventListener('change', (e) => {
            taskManager.currentPeriod = e.target.value;
            taskManager.filterTasks();
        });

        // Add "All Centers" option to select
        const centerSelect = document.getElementById('centerSelect');
        centerSelect.insertAdjacentHTML('afterbegin', '<option value="all">All Centers</option>');

        // Add statistics button handler
        document.getElementById('statistics').addEventListener('click', () => {
            taskManager.statistics();
        });

        // Add date icon click handler
        const dateIcon = document.querySelector('.date-icon');
        const dateInput = document.getElementById('taskDate');
        
        dateIcon.addEventListener('click', (e) => {
            e.preventDefault();
            try {
                dateInput.showPicker();
            } catch (err) {
                // Fallback for browsers that don't support showPicker
                dateInput.click();
            }
        });

        dateInput.addEventListener('change', (e) => {
            const selectedDate = new Date(e.target.value);
            const today = new Date();
            
            if (selectedDate < today) {
                alert('Cannot select a date in the past');
                e.target.value = '';
            }
        });

        // Add print button handler
        document.getElementById('print').addEventListener('click', () => {
            taskManager.printTasks();
        });

        // Add search functionality
        const searchInput = document.getElementById('searchTasks');
        let searchTimeout;
        
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                taskManager.searchQuery = e.target.value;
                taskManager.filterTasks();
            }, 300); // Debounce search for better performance
        });

        // Add sort handler
        document.getElementById('sortTasks').addEventListener('change', (e) => {
            taskManager.currentSort = e.target.value;
            taskManager.filterTasks();
        });

        // Add tags functionality
        const tagsInput = document.getElementById('taskTags');
        tagsInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                taskManager.addTag(tagsInput);
            }
        });

        // Setup keyboard shortcuts
        taskManager.setupKeyboardShortcuts();

        // Add tooltip to show keyboard shortcuts
        const searchBox = document.querySelector('.search-box');
        searchBox.title = 'Press Ctrl + / for quick search';
        
        const addTaskBtn = document.getElementById('addTask');
        addTaskBtn.title = 'Press Ctrl + N to add new task';

        const toggleTasksBtn = document.getElementById('toggleTasks');
        toggleTasksBtn.title = 'Press Ctrl + H to show/hide tasks';

        // Check for overdue tasks on load
        taskManager.checkOverdueTasks();

        // Check for overdue tasks daily
        setInterval(() => {
            taskManager.checkOverdueTasks();
        }, 24 * 60 * 60 * 1000);

        // Add template buttons handlers
        document.querySelectorAll('.template-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const templateType = btn.dataset.template;
                const template = taskTemplates[templateType];
                
                if (template) {
                    document.getElementById('taskTitle').value = template.title;
                    document.getElementById('taskDescription').value = template.description;
                    document.getElementById('taskPriority').value = template.priority;
                    
                    // Set default date to tomorrow
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    document.getElementById('taskDate').value = tomorrow.toISOString().split('T')[0];
                    
                    notifications.show('Template loaded successfully', 'info');
                }
            });
        });

        // Add backup button handler
        document.getElementById('backup').addEventListener('click', () => {
            taskManager.backupToCloud();
        });

        // Show storage status on load
        const storageAvailable = dataStorage.checkStorage();
        if (storageAvailable) {
            log('Local storage is available. Data will be preserved.');
        } else {
            notifications.show('Warning: Local storage is not available. Your data may not be saved.', 'warning');
        }

    } catch (error) {
        console.error('Initialization error:', error);
        alert('Error initializing application. Please check console for details.');
    }
});

// Add task handler
document.getElementById('addTask').addEventListener('click', () => {
    const title = document.getElementById('taskTitle').value;
    const description = document.getElementById('taskDescription').value;
    const date = document.getElementById('taskDate').value;
    const center = document.getElementById('centerSelect').value;
    
    if (title && description && date) {
        taskManager.addTask({ title, description, date, center });
        document.getElementById('taskTitle').value = '';
        document.getElementById('taskDescription').value = '';
        document.getElementById('taskDate').value = '';
    }
});

function checkLogin() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (username === 'admin' && password === 'admin') {
        document.getElementById('loginModal').style.display = 'none';
        document.getElementById('mainContent').style.display = 'block';
    } else {
        alert('Invalid username or password');
    }
}
