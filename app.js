// Book & Notes Vault - Main Application
class BookVault {
    constructor() {
        this.books = this.loadBooks();
        this.currentFilter = 'all';
        this.editingBookId = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateDashboard();
        this.renderBooks();
        this.loadSettings();
    }

    // Data Management
    loadBooks() {
        const stored = localStorage.getItem('bookVault_books');
        return stored ? JSON.parse(stored) : [];
    }

    saveBooks() {
        localStorage.setItem('bookVault_books', JSON.stringify(this.books));
    }

    // JSON File Management
    exportToJSONFile() {
        // Extract only the required fields from each book
        const simplifiedBooks = this.books.map(book => ({
            id: book.id,
            title: book.title,
            author: book.author,
            isbn: book.isbn || '',
            pages: book.contentData ? book.contentData.sections.length : 0,
            tag: book.tags ? book.tags.join(', ') : '',
            dateAdded: book.createdAt
        }));

        const data = {
            books: simplifiedBooks,
            metadata: {
                version: "1.0",
                createdAt: new Date().toISOString(),
                lastModified: new Date().toISOString(),
                totalBooks: this.books.length
            }
        };

        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // Create a temporary download link
        const a = document.createElement('a');
        a.href = url;
        a.download = 'books-data.json';
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    importFromJSONFile(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                if (data.books && Array.isArray(data.books)) {
                    if (confirm('This will replace all your current books. Are you sure?')) {
                        this.books = data.books;
                        this.saveBooks();
                        this.updateDashboard();
                        this.renderBooks();
                        alert('Books imported successfully from JSON file!');
                    }
                } else {
                    alert('Invalid JSON file format.');
                }
            } catch (error) {
                alert('Error reading JSON file. Please make sure it\'s a valid JSON file.');
            }
        };
        reader.readAsText(file);
    }

    viewJSONData() {
        // Extract only the required fields from each book
        const simplifiedBooks = this.books.map(book => ({
            id: book.id,
            title: book.title,
            author: book.author,
            isbn: book.isbn || '',
            pages: book.contentData ? book.contentData.sections.length : 0,
            tag: book.tags ? book.tags.join(', ') : '',
            dateAdded: book.createdAt
        }));

        const data = {
            books: simplifiedBooks,
            metadata: {
                version: "1.0",
                createdAt: new Date().toISOString(),
                lastModified: new Date().toISOString(),
                totalBooks: this.books.length
            }
        };

        const jsonString = JSON.stringify(data, null, 2);
        
        // Open in new window for easy viewing
        const newWindow = window.open('', '_blank');
        newWindow.document.write(`
            <html>
                <head>
                    <title>Books Data - JSON View</title>
                    <style>
                        body { font-family: monospace; margin: 20px; background: #f5f5f5; }
                        pre { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                        h1 { color: #333; }
                    </style>
                </head>
                <body>
                    <h1>Books Data - JSON Format</h1>
                    <pre>${jsonString}</pre>
                </body>
            </html>
        `);
    }

    loadSettings() {
        const theme = localStorage.getItem('bookVault_theme') || 'light';
        const itemsPerPage = localStorage.getItem('bookVault_itemsPerPage') || '20';
        
        document.documentElement.setAttribute('data-theme', theme);
        document.getElementById('theme-select').value = theme;
        document.getElementById('items-per-page').value = itemsPerPage;
    }

    saveSettings() {
        const theme = document.getElementById('theme-select').value;
        const itemsPerPage = document.getElementById('items-per-page').value;
        
        localStorage.setItem('bookVault_theme', theme);
        localStorage.setItem('bookVault_itemsPerPage', itemsPerPage);
        
        document.documentElement.setAttribute('data-theme', theme);
    }

    // Event Listeners
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
            this.searchBooks(e.target.value);
        });

        document.getElementById('search-btn').addEventListener('click', () => {
            const query = document.getElementById('search-input').value;
            this.searchBooks(query);
        });

        // Filter tabs
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
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
            this.saveSettings();
        });

        document.getElementById('items-per-page').addEventListener('change', () => {
            this.saveSettings();
        });

        document.getElementById('export-btn').addEventListener('click', () => {
            this.exportToJSONFile();
        });

        document.getElementById('view-json-btn').addEventListener('click', () => {
            this.viewJSONData();
        });

        document.getElementById('import-btn').addEventListener('click', () => {
            document.getElementById('import-input').click();
        });

        document.getElementById('import-input').addEventListener('change', (e) => {
            this.importFromJSONFile(e.target.files[0]);
        });

        // Reading functionality
        document.getElementById('close-reader').addEventListener('click', () => {
            this.showSection('records');
        });


        // Notes section
        document.getElementById('notes-book-filter').addEventListener('change', (e) => {
            this.filterNotes(e.target.value);
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

        // Update notes if showing notes
        if (sectionId === 'notes') {
            this.updateNotesSection();
        }
    }

    // Dashboard
    updateDashboard() {
        const totalBooks = this.books.length;
        const totalNotes = this.books.reduce((sum, book) => sum + (book.notes ? 1 : 0), 0);
        
        // Calculate top tag
        const topTag = this.getTopTag();

        document.getElementById('total-books').textContent = totalBooks;
        document.getElementById('total-notes').textContent = totalNotes;
        document.getElementById('top-tag').textContent = topTag;

        this.updateRecentActivity();
        this.updateTrendChart();
    }

    updateRecentActivity() {
        const recentActivity = document.getElementById('recent-activity-list');
        const recentBooks = this.books
            .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
            .slice(0, 5);

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
        const last7Days = this.getLast7DaysData();
        
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

    getLast7DaysData() {
        const today = new Date();
        const last7Days = [];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0); // Start of day
            
            const nextDate = new Date(date);
            nextDate.setDate(nextDate.getDate() + 1);
            
            // Count books added on this day
            const booksAddedToday = this.books.filter(book => {
                const bookDate = new Date(book.createdAt);
                bookDate.setHours(0, 0, 0, 0);
                return bookDate.getTime() === date.getTime();
            }).length;
            
            last7Days.push({
                date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                count: booksAddedToday
            });
        }
        
        return last7Days;
    }

    getTopTag() {
        const tagCounts = {};
        
        this.books.forEach(book => {
            if (book.tags && book.tags.length > 0) {
                book.tags.forEach(tag => {
                    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                });
            }
        });
        
        if (Object.keys(tagCounts).length === 0) {
            return 'None';
        }
        
        const topTag = Object.keys(tagCounts).reduce((a, b) => 
            tagCounts[a] > tagCounts[b] ? a : b
        );
        
        return `${topTag} (${tagCounts[topTag]})`;
    }


    // Book Management
    addBook(bookData) {
        const book = {
            id: Date.now().toString(),
            ...bookData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.books.push(book);
        this.saveBooks();
        this.updateDashboard();
        this.renderBooks();
        this.resetForm();
    }

    updateBook(id, bookData) {
        const index = this.books.findIndex(book => book.id === id);
        if (index !== -1) {
            this.books[index] = {
                ...this.books[index],
                ...bookData,
                updatedAt: new Date().toISOString()
            };
            this.saveBooks();
            this.updateDashboard();
            this.renderBooks();
            this.resetForm();
        }
    }

    deleteBook(id) {
        if (confirm('Are you sure you want to delete this book?')) {
            this.books = this.books.filter(book => book.id !== id);
            this.saveBooks();
            this.updateDashboard();
            this.renderBooks();
        }
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
        if (bookData.isbn && !this.validateISBN(bookData.isbn)) {
            alert('Please enter a valid ISBN.');
            return;
        }

        // Check ISBN uniqueness
        if (bookData.isbn && this.isISBNDuplicate(bookData.isbn, this.editingBookId)) {
            alert('A book with this ISBN already exists.');
            return;
        }

        // Check author surname uniqueness
        if (this.isAuthorSurnameDuplicate(bookData.author, this.editingBookId)) {
            alert('A book by this author already exists. Please use a different author.');
            return;
        }

        if (this.editingBookId) {
            this.updateBook(this.editingBookId, bookData);
        } else {
            this.addBook(bookData);
        }
    }

    editBook(id) {
        const book = this.books.find(book => book.id === id);
        if (book) {
            this.editingBookId = id;
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
        this.editingBookId = null;
        document.getElementById('form-title').textContent = 'Add New Book';
        document.getElementById('book-form').reset();
        this.showSection('records');
    }

    // Search and Filter
    searchBooks(query) {
        const searchTerm = query.toLowerCase().trim();
        if (!searchTerm) {
            this.renderBooks();
            return;
        }

        const filteredBooks = this.books.filter(book => {
            const searchableText = [
                book.title,
                book.author,
                book.isbn || '',
                book.notes || '',
                ...book.tags
            ].join(' ').toLowerCase();

            return searchableText.includes(searchTerm);
        });

        this.renderBooks(filteredBooks);
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update active tab
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');

        this.renderBooks();
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
        if (this.currentFilter === 'all') {
            return this.books;
        }
        return this.books.filter(book => book.status === this.currentFilter);
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

    validateISBN(isbn) {
        // Remove hyphens and spaces
        const cleaned = isbn.replace(/[-\s]/g, '');
        
        // Check if it's 10 or 13 digits
        if (cleaned.length === 10) {
            return /^\d{9}[\dX]$/.test(cleaned);
        } else if (cleaned.length === 13) {
            return /^\d{13}$/.test(cleaned);
        }
        
        return false;
    }

    isISBNDuplicate(isbn, excludeId = null) {
        return this.books.some(book => 
            book.isbn === isbn && book.id !== excludeId
        );
    }

    isAuthorSurnameDuplicate(author, excludeId = null) {
        const surname = author.split(' ').pop().toLowerCase();
        return this.books.some(book => {
            if (book.id === excludeId) return false;
            const bookSurname = book.author.split(' ').pop().toLowerCase();
            return bookSurname === surname;
        });
    }


    // Settings
    updateSettingsStats() {
        const totalBooks = this.books.length;
        const toRead = this.books.filter(book => book.status === 'to-read').length;

        document.getElementById('settings-total-books').textContent = totalBooks;
        document.getElementById('settings-to-read').textContent = toRead;
    }




    // Notes functionality
    updateNotesSection() {
        this.populateNotesFilter();
        this.updateNotesStats();
        this.renderNotes();
    }

    populateNotesFilter() {
        const filter = document.getElementById('notes-book-filter');
        const booksWithNotes = this.books.filter(book => book.notes && book.notes.trim());
        
        filter.innerHTML = '<option value="">All Books with Notes</option>';
        booksWithNotes.forEach(book => {
            const option = document.createElement('option');
            option.value = book.id;
            option.textContent = `${book.title} by ${book.author}`;
            filter.appendChild(option);
        });
    }

    updateNotesStats() {
        const booksWithNotes = this.books.filter(book => book.notes && book.notes.trim());
        const totalNotes = booksWithNotes.length;
        document.getElementById('total-notes-count').textContent = `${totalNotes} note${totalNotes !== 1 ? 's' : ''}`;
    }

    renderNotes(bookId = null) {
        const container = document.getElementById('notes-container');
        if (!container) {
            console.error('Notes container not found');
            return;
        }

        let notesToShow = [];

        if (bookId) {
            const book = this.books.find(b => b.id === bookId);
            if (book && book.notes) {
                notesToShow = [{
                    bookId: book.id,
                    bookTitle: book.title,
                    author: book.author,
                    notes: book.notes,
                    lastUpdated: book.updatedAt || book.createdAt
                }];
            }
        } else {
            notesToShow = this.books
                .filter(book => book.notes && book.notes.trim())
                .map(book => ({
                    bookId: book.id,
                    bookTitle: book.title,
                    author: book.author,
                    notes: book.notes,
                    lastUpdated: book.updatedAt || book.createdAt
                }))
                .sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));
        }

        console.log('Notes to show:', notesToShow);

        if (notesToShow.length === 0) {
            container.innerHTML = '<div class="no-notes"><p>No notes yet. Start reading a book to take notes!</p></div>';
            return;
        }

        // Group notes by book for dropdown-style display
        const groupedNotes = this.groupNotesByBook(notesToShow);
        
        container.innerHTML = Object.keys(groupedNotes).map(bookTitle => {
            const bookNotes = groupedNotes[bookTitle];
            const latestNote = bookNotes[0]; // Most recent note
            
            return `
                <div class="book-notes-group">
                    <div class="book-notes-header" onclick="toggleBookNotes('${latestNote.bookId}')">
                        <div class="book-info">
                            <h3 class="book-title">${this.escapeHtml(latestNote.bookTitle)}</h3>
                            <p class="book-author">by ${this.escapeHtml(latestNote.author)}</p>
                        </div>
                        <div class="book-notes-meta">
                            <span class="notes-count">${bookNotes.length} note${bookNotes.length !== 1 ? 's' : ''}</span>
                            <span class="latest-date">Last updated: ${this.formatDate(latestNote.lastUpdated)}</span>
                            <span class="toggle-icon" id="toggle-${latestNote.bookId}">▼</span>
                        </div>
                    </div>
                    <div class="book-notes-content" id="notes-${latestNote.bookId}" style="display: none;">
                        ${bookNotes.map(note => `
                            <div class="note-item">
                                <div class="note-header">
                                    <div class="note-date">${this.formatDate(note.lastUpdated)}</div>
                                </div>
                                <div class="note-content">${this.escapeHtml(note.notes)}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }).join('');
    }

    groupNotesByBook(notes) {
        const grouped = {};
        notes.forEach(note => {
            const key = note.bookTitle;
            if (!grouped[key]) {
                grouped[key] = [];
            }
            grouped[key].push(note);
        });
        return grouped;
    }

    toggleBookNotes(bookId) {
        const content = document.getElementById(`notes-${bookId}`);
        const icon = document.getElementById(`toggle-${bookId}`);
        
        if (content && icon) {
            if (content.style.display === 'none') {
                content.style.display = 'block';
                icon.textContent = '▲';
            } else {
                content.style.display = 'none';
                icon.textContent = '▼';
            }
        }
    }

    filterNotes(bookId) {
        this.renderNotes(bookId || null);
    }
}

// Initialize the application
const app = new BookVault();

// Make app globally available for onclick handlers
window.app = app;

// Make toggleBookNotes globally available
window.toggleBookNotes = (bookId) => {
    app.toggleBookNotes(bookId);
};
