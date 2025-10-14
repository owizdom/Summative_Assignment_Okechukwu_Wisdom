// UI Management - handles UI rendering and event handling
class UIManager {
    constructor(stateManager, storageManager, validatorManager, searchManager) {
        this.stateManager = stateManager;
        this.storageManager = storageManager;
        this.validatorManager = validatorManager;
        this.searchManager = searchManager;
    }

    // Event Listeners Setup
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.showSection(link.getAttribute('href').substring(1));
            });
        });

        // Mobile navigation toggle
        document.querySelector('.nav-toggle').addEventListener('click', () => {
            document.querySelector('.nav-menu').classList.toggle('active');
        });

        // Search functionality
        document.getElementById('search-input').addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });

        document.getElementById('search-btn').addEventListener('click', () => {
            const query = document.getElementById('search-input').value;
            this.handleSearch(query);
        });

        // Filter tabs
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.handleFilter(e.target.dataset.filter);
            });
        });

        // Book form
        document.getElementById('book-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit();
        });

        document.getElementById('cancel-btn').addEventListener('click', () => {
            this.resetForm();
        });

        // Settings
        document.getElementById('theme-select').addEventListener('change', () => {
            this.storageManager.saveSettings();
        });

        document.getElementById('items-per-page').addEventListener('change', () => {
            this.storageManager.saveSettings();
        });

        document.getElementById('export-btn').addEventListener('click', () => {
            this.storageManager.exportToJSONFile(this.stateManager.getAllBooks());
        });

        document.getElementById('view-json-btn').addEventListener('click', () => {
            this.storageManager.viewJSONData(this.stateManager.getAllBooks());
        });

        document.getElementById('import-btn').addEventListener('click', () => {
            document.getElementById('import-input').click();
        });

        document.getElementById('import-input').addEventListener('change', (e) => {
            this.storageManager.importFromJSONFile(
                e.target.files[0],
                (importedBooks) => {
                    this.stateManager.importBooks(importedBooks);
                    this.updateDashboard();
                    this.renderBooks();
                    alert('Books imported successfully from JSON file!');
                },
                (error) => {
                    alert(error);
                }
            );
        });

        // Reading functionality
        document.getElementById('close-reader').addEventListener('click', () => {
            this.showSection('records');
        });

    }

    // Navigation
    showSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });

        // Show target section
        document.getElementById(sectionId).classList.add('active');

        // Update active nav link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[href="#${sectionId}"]`).classList.add('active');

        // Close mobile menu
        document.querySelector('.nav-menu').classList.remove('active');

        // Update dashboard if showing dashboard
        if (sectionId === 'dashboard') {
            this.updateDashboard();
        }

        // Update settings if showing settings
        if (sectionId === 'settings') {
            this.updateSettingsStats();
        }

    }

    // Dashboard
    updateDashboard() {
        const totalBooks = this.stateManager.getTotalBooks();
        const totalNotes = this.stateManager.getTotalNotes();
        const topTag = this.stateManager.getTopTag();

        document.getElementById('total-books').textContent = totalBooks;
        document.getElementById('total-notes').textContent = totalNotes;
        document.getElementById('top-tag').textContent = topTag;

        this.updateRecentActivity();
        this.updateTrendChart();
    }

    updateRecentActivity() {
        const recentActivity = document.getElementById('recent-activity-list');
        const recentBooks = this.stateManager.getRecentBooks(5);

        if (recentBooks.length === 0) {
            recentActivity.innerHTML = '<p class="no-activity">No recent activity</p>';
            return;
        }

        recentActivity.innerHTML = recentBooks.map(book => `
            <div class="activity-item">
                <strong>${book.title}</strong> by ${book.author}
                <span class="activity-status">${this.getStatusText(book.status)}</span>
                <small>${this.formatDate(book.updatedAt || book.createdAt)}</small>
            </div>
        `).join('');
    }

    updateTrendChart() {
        const chartContainer = document.getElementById('trend-chart-bars');
        if (!chartContainer) return;

        // Calculate books added in the last 7 days
        const last7Days = this.stateManager.getLast7DaysData();
        
        // Find the maximum value for scaling
        const maxValue = Math.max(...last7Days.map(day => day.count), 1);
        
        // Generate chart bars
        chartContainer.innerHTML = last7Days.map((day, index) => {
            const height = (day.count / maxValue) * 100; // Percentage height
            const barHeight = Math.max(height, 2); // Minimum 2% height for visibility
            
            return `
                <div class="chart-bar" style="height: ${barHeight}%" title="${day.date}: ${day.count} books">
                    ${day.count > 0 ? `<div class="chart-bar-value">${day.count}</div>` : ''}
                </div>
            `;
        }).join('');
    }

    // Form Handling
    handleFormSubmit() {
        const formData = new FormData(document.getElementById('book-form'));
        const bookData = Object.fromEntries(formData.entries());

        // Validate required fields
        if (!bookData.title || !bookData.author || !bookData.status) {
            alert('Please fill in all required fields.');
            return;
        }

        // Process tags
        bookData.tags = bookData.tags ? bookData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [];

        // Validate ISBN if provided
        if (bookData.isbn && !this.validatorManager.validateISBN(bookData.isbn)) {
            alert('Please enter a valid ISBN.');
            return;
        }

        // Check ISBN uniqueness
        if (bookData.isbn && this.validatorManager.isISBNDuplicate(bookData.isbn, this.stateManager.getEditingBookId(), this.stateManager.getAllBooks())) {
            alert('A book with this ISBN already exists.');
            return;
        }

        // Check author surname uniqueness
        if (this.validatorManager.isAuthorSurnameDuplicate(bookData.author, this.stateManager.getEditingBookId(), this.stateManager.getAllBooks())) {
            alert('A book by this author already exists. Please use a different author.');
            return;
        }

        const editingBookId = this.stateManager.getEditingBookId();
        if (editingBookId) {
            this.stateManager.updateBook(editingBookId, bookData);
        } else {
            this.stateManager.addBook(bookData);
        }

        this.updateDashboard();
        this.renderBooks();
        this.resetForm();
    }

    editBook(id) {
        const book = this.stateManager.getBook(id);
        if (book) {
            this.stateManager.setEditingBookId(id);
            document.getElementById('form-title').textContent = 'Edit Book';
            
            // Populate form
            Object.keys(book).forEach(key => {
                const element = document.getElementById(key);
                if (element) {
                    if (key === 'tags') {
                        element.value = book[key].join(', ');
                    } else if (key === 'contentData') {
                        // Skip contentData as there's no form field for it
                        return;
                    } else {
                        element.value = book[key];
                    }
                }
            });

            this.showSection('add-form');
        }
    }

    resetForm() {
        this.stateManager.clearEditingBookId();
        document.getElementById('form-title').textContent = 'Add New Book';
        document.getElementById('book-form').reset();
        this.showSection('records');
    }

    // Rendering
    renderBooks(booksToRender = null) {
        const container = document.getElementById('records-container');
        const books = booksToRender || this.getFilteredBooks();

        if (books.length === 0) {
            container.innerHTML = '<div class="no-books"><p>No books found. <a href="#add-form">Add your first book!</a></p></div>';
            return;
        }

        container.innerHTML = books.map(book => this.createBookCard(book)).join('');
    }

    getFilteredBooks() {
        const currentFilter = this.stateManager.getCurrentFilter();
        return this.stateManager.getBooksByStatus(currentFilter);
    }

    createBookCard(book) {
        const statusText = this.getStatusText(book.status);
        const ratingStars = book.rating ? '★'.repeat(book.rating) : '';
        const tagsHtml = book.tags.map(tag => `<span class="tag">${tag}</span>`).join('');

        return `
            <div class="book-card">
                <h3>${this.escapeHtml(book.title)}</h3>
                <div class="author">by ${this.escapeHtml(book.author)}</div>
                <div class="status ${book.status}">${statusText}</div>
                ${book.pages ? `<div class="pages">${book.pages} pages</div>` : ''}
                ${book.rating ? `<div class="rating">${ratingStars}</div>` : ''}
                ${book.tags.length > 0 ? `<div class="tags">${tagsHtml}</div>` : ''}
                ${book.notes ? `<div class="notes">${this.escapeHtml(book.notes)}</div>` : ''}
                <div class="book-actions">
                    <button class="btn btn-secondary btn-small" onclick="app.editBook('${book.id}')">Edit</button>
                    <button class="btn btn-danger btn-small" onclick="app.deleteBook('${book.id}')">Delete</button>
                </div>
            </div>
        `;
    }

    // Settings
    updateSettingsStats() {
        const totalBooks = this.stateManager.getTotalBooks();
        const toRead = this.stateManager.getBooksByStatus('to-read').length;

        document.getElementById('settings-total-books').textContent = totalBooks;
        document.getElementById('settings-to-read').textContent = toRead;
    }


    // Search and Filter Handlers
    handleSearch(query) {
        const results = this.searchManager.searchBooks(query);
        this.renderBooks(results);
    }

    handleFilter(filter) {
        const results = this.searchManager.setFilter(filter);
        this.renderBooks(results);
    }

    // Utility Functions
    getStatusText(status) {
        const statusMap = {
            'to-read': 'To Read',
            'reading': 'Currently Reading',
            'read': 'Read'
        };
        return statusMap[status] || status;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}
