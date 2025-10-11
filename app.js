// Book & Notes Vault - Main Application
class BookVault {
    constructor() {
        this.books = this.loadBooks();
        this.currentFilter = 'all';
        this.editingBookId = null;
        this.currentReadingBook = null;
        this.readingStartTime = null;
        this.readingInterval = null;
        this.pdfDoc = null;
        this.currentPage = 1;
        this.totalPages = 0;
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
            this.exportData();
        });

        document.getElementById('import-btn').addEventListener('click', () => {
            document.getElementById('import-input').click();
        });

        document.getElementById('import-input').addEventListener('change', (e) => {
            this.importData(e.target.files[0]);
        });

        // Reading functionality
        document.getElementById('close-reader').addEventListener('click', () => {
            this.stopReading();
            this.showSection('records');
        });

        document.getElementById('save-reading-notes').addEventListener('click', () => {
            this.saveReadingNotes();
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
        const booksRead = this.books.filter(book => book.status === 'read').length;
        const currentlyReading = this.books.filter(book => book.status === 'reading').length;
        const totalNotes = this.books.reduce((sum, book) => sum + (book.notes ? 1 : 0), 0);

        document.getElementById('total-books').textContent = totalBooks;
        document.getElementById('books-read').textContent = booksRead;
        document.getElementById('currently-reading').textContent = currentlyReading;
        document.getElementById('total-notes').textContent = totalNotes;

        this.updateRecentActivity();
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

        // Handle PDF file upload
        const pdfFile = document.getElementById('pdf-file').files[0];
        if (pdfFile) {
            this.handlePDFUpload(pdfFile, bookData);
        } else {
            if (this.editingBookId) {
                this.updateBook(this.editingBookId, bookData);
            } else {
                this.addBook(bookData);
            }
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
        const ratingStars = book.rating ? '⭐'.repeat(book.rating) : '';
        const tagsHtml = book.tags.map(tag => `<span class="tag">${tag}</span>`).join('');

        return `
            <div class="book-card">
                <h3>${this.escapeHtml(book.title)}</h3>
                <div class="author">by ${this.escapeHtml(book.author)}</div>
                <div class="status ${book.status}">${statusText}</div>
                ${book.rating ? `<div class="rating">${ratingStars}</div>` : ''}
                ${book.tags.length > 0 ? `<div class="tags">${tagsHtml}</div>` : ''}
                ${book.notes ? `<div class="notes">${this.escapeHtml(book.notes)}</div>` : ''}
                <div class="book-stats">
                    <div class="reading-time">📖 ${book.readingTime || '0h 0m'}</div>
                    <div class="book-status-indicator">
                        ${book.pdfFile ? '📄 PDF Available' : '📚 No PDF'}
                    </div>
                </div>
                <div class="book-actions">
                    ${book.pdfFile ? `<button class="btn btn-primary btn-small" onclick="app.readBook('${book.id}')">Read</button>` : ''}
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

    // PDF functionality
    handlePDFUpload(pdfFile, bookData) {
        const reader = new FileReader();
        reader.onload = (e) => {
            // Store both PDF data and convert to HTML
            bookData.pdfFile = {
                name: pdfFile.name,
                data: e.target.result,
                size: pdfFile.size,
                type: pdfFile.type
            };
            bookData.readingTime = '0h 0m';
            bookData.readingSessions = [];
            bookData.notes = bookData.notes || '';

            // Convert PDF to HTML content
            this.convertPDFToHTML(e.target.result, bookData);
        };
        reader.readAsDataURL(pdfFile);
    }

    convertPDFToHTML(pdfData, bookData) {
        // Convert base64 to Uint8Array
        const binaryString = atob(pdfData.split(',')[1]);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        // Show loading state immediately - TEMPORARY STATE FUNCTION
        this.showPDFProcessingState(bookData);

        // Load PDF and extract text
        pdfjsLib.getDocument({ data: bytes }).promise.then((pdf) => {
            this.extractTextFromPDF(pdf, bookData);
        }).catch((error) => {
            console.error('Error loading PDF:', error);
            // Fallback: create a simple HTML version
            bookData.htmlContent = this.createFallbackHTML(bookData.title, bookData.author);
            this.displayHTMLContent(bookData.htmlContent);
            this.finalizeBookUpload(bookData);
        });
    }

    showPDFProcessingState(bookData) {
        // TEMPORARY STATE FUNCTION - Shows immediate feedback
        console.log('📖 Starting PDF processing for:', bookData.title);
        
        // Create a temporary state to show processing
        const tempState = {
            title: bookData.title,
            author: bookData.author,
            isProcessing: true
        };
        
        // Show processing state in the reading interface IMMEDIATELY
        const contentContainer = document.getElementById('book-content');
        if (contentContainer) {
            contentContainer.innerHTML = `
                <div class="book-content">
                    <h1 class="book-title">${this.escapeHtml(tempState.title)}</h1>
                    <h2 class="book-author">by ${this.escapeHtml(tempState.author)}</h2>
                    <div class="processing-content">
                        <div class="loading-message">
                            <h3>📖 Extracting text from PDF...</h3>
                            <p>Converting your PDF to readable HTML format</p>
                            <div class="loading-spinner">⏳</div>
                            <div class="progress-bar">
                                <div class="progress-fill"></div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            console.log('✅ Temporary state displayed');
        } else {
            console.error('❌ Book content container not found');
        }
    }

    extractTextFromPDF(pdf, bookData) {
        const totalPages = pdf.numPages;
        let allText = '';
        let processedPages = 0;

        console.log(`📄 PDF has ${totalPages} pages, starting extraction...`);

        // Show progress immediately
        this.updateProcessingProgress(0, totalPages, bookData);

        // Extract text from all pages
        for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
            pdf.getPage(pageNum).then((page) => {
                page.getTextContent().then((textContent) => {
                    const pageText = textContent.items.map(item => item.str).join(' ');
                    allText += pageText + '\n\n';
                    processedPages++;

                    console.log(`📖 Processed page ${processedPages}/${totalPages}`);

                    // Update progress
                    this.updateProcessingProgress(processedPages, totalPages, bookData);

                    // When all pages are processed, create HTML and display immediately
                    if (processedPages === totalPages) {
                        console.log('✅ All pages processed, creating HTML...');
                        bookData.htmlContent = this.createHTMLFromText(allText, bookData.title, bookData.author);
                        this.displayHTMLContent(bookData.htmlContent);
                        this.finalizeBookUpload(bookData);
                        console.log('🎉 HTML content displayed!');
                    }
                });
            });
        }
    }

    updateProcessingProgress(current, total, bookData) {
        const percentage = Math.round((current / total) * 100);
        const progressBar = document.querySelector('.progress-fill');
        const progressText = document.querySelector('.loading-message p');
        
        if (progressBar) {
            progressBar.style.width = `${percentage}%`;
        }
        
        if (progressText) {
            progressText.textContent = `Processing page ${current} of ${total} (${percentage}%)`;
        }
    }

    displayHTMLContent(htmlContent) {
        // IMMEDIATELY display the HTML content - TEMPORARY STATE FUNCTION
        console.log('🔄 Displaying HTML content...');
        const contentContainer = document.getElementById('book-content');
        if (contentContainer) {
            contentContainer.innerHTML = htmlContent;
            console.log('✅ HTML content displayed successfully!');
        } else {
            console.error('❌ Could not find book-content container');
        }
    }

    createHTMLFromText(text, title, author) {
        // Clean up the text
        const cleanText = text.replace(/\s+/g, ' ').trim();
        
        // Split into paragraphs (rough heuristic)
        const paragraphs = cleanText.split(/(?<=[.!?])\s+(?=[A-Z])/);
        
        let html = `
            <div class="book-content">
                <h1 class="book-title">${this.escapeHtml(title)}</h1>
                <h2 class="book-author">by ${this.escapeHtml(author)}</h2>
                <div class="book-text">
        `;

        paragraphs.forEach(paragraph => {
            if (paragraph.trim().length > 10) { // Only include substantial paragraphs
                html += `<p class="book-paragraph">${this.escapeHtml(paragraph.trim())}</p>\n`;
            }
        });

        html += `
                </div>
            </div>
        `;

        return html;
    }

    createFallbackHTML(title, author) {
        return `
            <div class="book-content">
                <h1 class="book-title">${this.escapeHtml(title)}</h1>
                <h2 class="book-author">by ${this.escapeHtml(author)}</h2>
                <div class="book-text">
                    <p class="book-paragraph">PDF content is being processed. Please try refreshing the page or re-uploading the PDF.</p>
                </div>
            </div>
        `;
    }

    finalizeBookUpload(bookData) {
        if (this.editingBookId) {
            this.updateBook(this.editingBookId, bookData);
        } else {
            this.addBook(bookData);
        }
        
        // If we're currently reading this book, refresh the content
        if (this.currentReadingBook && this.currentReadingBook.id === bookData.id) {
            this.loadHTMLContent(bookData);
        }
        
        // If this is a new book with PDF, automatically switch to reading view
        if (!this.editingBookId && bookData.pdfFile) {
            setTimeout(() => {
                this.readBook(bookData.id);
            }, 500); // Small delay to ensure the book is saved
        }
    }

    // Settings
    updateSettingsStats() {
        const totalBooks = this.books.length;
        const booksRead = this.books.filter(book => book.status === 'read').length;
        const currentlyReading = this.books.filter(book => book.status === 'reading').length;
        const toRead = this.books.filter(book => book.status === 'to-read').length;

        document.getElementById('settings-total-books').textContent = totalBooks;
        document.getElementById('settings-books-read').textContent = booksRead;
        document.getElementById('settings-currently-reading').textContent = currentlyReading;
        document.getElementById('settings-to-read').textContent = toRead;
    }

    exportData() {
        const data = {
            books: this.books,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `book-vault-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    importData(file) {
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
                        alert('Books imported successfully!');
                    }
                } else {
                    alert('Invalid file format.');
                }
            } catch (error) {
                alert('Error reading file. Please make sure it\'s a valid JSON file.');
            }
        };
        reader.readAsText(file);
    }

    // Reading functionality
    readBook(id) {
        const book = this.books.find(book => book.id === id);
        if (!book || !book.pdfFile) {
            // Show a message in the reading interface instead of alert
            this.showSection('reading');
            document.getElementById('book-content').innerHTML = `
                <div class="book-content">
                    <h1 class="book-title">${this.escapeHtml(book?.title || 'Book Not Found')}</h1>
                    <h2 class="book-author">by ${this.escapeHtml(book?.author || 'Unknown Author')}</h2>
                    <div class="no-pdf-message">
                        <h3>📚 No PDF Available</h3>
                        <p>This book doesn't have a PDF file uploaded yet.</p>
                        <p>Please edit the book to add a PDF file for reading.</p>
                    </div>
                </div>
            `;
            return;
        }

        this.currentReadingBook = book;
        this.startReading();
        this.showSection('reading');
        
        // Update reading interface with real-time tracking
        document.getElementById('reading-title').textContent = book.title;
        document.getElementById('reading-author').textContent = `by ${book.author}`;
        this.updateReadingTimeDisplay();
        this.updateReadingProgressDisplay();
        document.getElementById('reading-notes').value = book.notes || '';

        // Load HTML content
        this.loadHTMLContent(book);
    }

    loadHTMLContent(book) {
        const contentContainer = document.getElementById('book-content');
        
        if (book.htmlContent) {
            contentContainer.innerHTML = book.htmlContent;
        } else {
            // If no HTML content yet, show loading message
            contentContainer.innerHTML = `
                <div class="loading-message">
                    <h3>Processing PDF content...</h3>
                    <p>Please wait while we convert the PDF to readable format.</p>
                    <div class="loading-spinner">⏳</div>
                </div>
            `;
            
            // Try to convert PDF to HTML if not already done
            if (book.pdfFile && book.pdfFile.data) {
                this.convertPDFToHTML(book.pdfFile.data, book);
            }
        }
    }

    startReading() {
        this.readingStartTime = Date.now();
        this.readingInterval = setInterval(() => {
            this.updateReadingTime();
        }, 1000); // Update every second
    }

    stopReading() {
        if (this.readingInterval) {
            clearInterval(this.readingInterval);
            this.readingInterval = null;
        }

        if (this.currentReadingBook && this.readingStartTime) {
            const sessionTime = Date.now() - this.readingStartTime;
            this.recordReadingSession(sessionTime);
        }

        this.readingStartTime = null;
        this.currentReadingBook = null;
    }

    updateReadingTime() {
        if (!this.currentReadingBook || !this.readingStartTime) return;

        const currentSessionTime = Date.now() - this.readingStartTime;
        const totalTime = this.getTotalReadingTime(this.currentReadingBook) + currentSessionTime;
        
        const hours = Math.floor(totalTime / (1000 * 60 * 60));
        const minutes = Math.floor((totalTime % (1000 * 60 * 60)) / (1000 * 60));
        
        const timeString = `${hours}h ${minutes}m`;
        document.getElementById('reading-time').textContent = `Reading time: ${timeString}`;
    }

    getTotalReadingTime(book) {
        if (!book.readingSessions) return 0;
        return book.readingSessions.reduce((total, session) => total + session.duration, 0);
    }

    recordReadingSession(duration) {
        if (!this.currentReadingBook) return;

        if (!this.currentReadingBook.readingSessions) {
            this.currentReadingBook.readingSessions = [];
        }

        this.currentReadingBook.readingSessions.push({
            startTime: this.readingStartTime,
            endTime: Date.now(),
            duration: duration
        });

        // Update total reading time
        const totalTime = this.getTotalReadingTime(this.currentReadingBook);
        const hours = Math.floor(totalTime / (1000 * 60 * 60));
        const minutes = Math.floor((totalTime % (1000 * 60 * 60)) / (1000 * 60));
        this.currentReadingBook.readingTime = `${hours}h ${minutes}m`;

        this.saveBooks();
        this.renderBooks();
    }

    saveReadingNotes() {
        if (!this.currentReadingBook) return;

        const notes = document.getElementById('reading-notes').value;
        this.currentReadingBook.notes = notes;
        this.saveBooks();
        
        // Show confirmation
        const btn = document.getElementById('save-reading-notes');
        const originalText = btn.textContent;
        btn.textContent = 'Saved!';
        btn.style.background = 'var(--success-color)';
        
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '';
        }, 2000);
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
