// Book & Notes Vault - Main Application
// This file imports and orchestrates all the modular components

// Import all modules (these would be loaded via script tags in HTML)
// Note: In a real ES6 module setup, you would use:
// import { StorageManager } from './storage.js';
// import { StateManager } from './state.js';
// import { UIManager } from './ui.js';
// import { ValidatorManager } from './validators.js';
// import { SearchManager } from './search.js';

class BookVault {
    constructor() {
        // Initialize all managers
        this.storageManager = new StorageManager();
        this.stateManager = new StateManager(this.storageManager);
        this.validatorManager = new ValidatorManager();
        this.searchManager = new SearchManager(this.stateManager, this.validatorManager);
        this.uiManager = new UIManager(this.stateManager, this.storageManager, this.validatorManager, this.searchManager);
        
        // Initialize the application
        this.init();
    }

    init() {
        // Initialize state
        this.stateManager.init();
        
        // Initialize search
        this.searchManager.init();
        
        // Load settings
        this.storageManager.loadSettings();
        
        // Setup UI event listeners
        this.uiManager.setupEventListeners();
        
        // Initial UI updates
        this.updateDashboard();
        this.renderBooks();
    }

    // Public API methods that delegate to appropriate managers
    
    // Book Management
    addBook(bookData) {
        const book = this.stateManager.addBook(bookData);
        this.updateDashboard();
        this.renderBooks();
        this.uiManager.resetForm();
        return book;
    }

    updateBook(id, bookData) {
        const book = this.stateManager.updateBook(id, bookData);
        this.updateDashboard();
        this.renderBooks();
        this.uiManager.resetForm();
        return book;
    }

    deleteBook(id) {
        if (confirm('Are you sure you want to delete this book?')) {
            this.stateManager.deleteBook(id);
            this.updateDashboard();
            this.renderBooks();
        }
    }

    editBook(id) {
        this.uiManager.editBook(id);
    }

    // Search and Filter
    searchBooks(query) {
        const results = this.searchManager.searchBooks(query);
        this.uiManager.renderBooks(results);
    }

    setFilter(filter) {
        const results = this.searchManager.setFilter(filter);
        this.uiManager.renderBooks(results);
    }

    // UI Management
    showSection(sectionId) {
        this.uiManager.showSection(sectionId);
    }

    updateDashboard() {
        this.uiManager.updateDashboard();
    }

    renderBooks(booksToRender = null) {
        this.uiManager.renderBooks(booksToRender);
    }

    resetForm() {
        this.uiManager.resetForm();
    }

    // Settings
    saveSettings() {
        this.storageManager.saveSettings();
    }

    updateSettingsStats() {
        this.uiManager.updateSettingsStats();
    }


    // Export/Import
    exportToJSONFile() {
        this.storageManager.exportToJSONFile(this.stateManager.getAllBooks());
    }

    viewJSONData() {
        this.storageManager.viewJSONData(this.stateManager.getAllBooks());
    }

    importFromJSONFile(file) {
        this.storageManager.importFromJSONFile(
            file,
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
    }

    // Utility methods that delegate to appropriate managers
    
    getStatusText(status) {
        return this.uiManager.getStatusText(status);
    }

    formatDate(dateString) {
        return this.uiManager.formatDate(dateString);
    }

    escapeHtml(text) {
        return this.uiManager.escapeHtml(text);
    }

    validateISBN(isbn) {
        return this.validatorManager.validateISBN(isbn);
    }

    isISBNDuplicate(isbn, excludeId = null) {
        return this.validatorManager.isISBNDuplicate(isbn, excludeId, this.stateManager.getAllBooks());
    }

    isAuthorSurnameDuplicate(author, excludeId = null) {
        return this.validatorManager.isAuthorSurnameDuplicate(author, excludeId, this.stateManager.getAllBooks());
    }

    // Form handling that delegates to UI manager
    handleFormSubmit() {
        this.uiManager.handleFormSubmit();
    }

    // Getters for accessing managers if needed
    getStateManager() {
        return this.stateManager;
    }

    getStorageManager() {
        return this.storageManager;
    }

    getUIManager() {
        return this.uiManager;
    }

    getSearchManager() {
        return this.searchManager;
    }

    getValidatorManager() {
        return this.validatorManager;
    }
}

// Initialize the application
const app = new BookVault();

// Make app globally available for onclick handlers
window.app = app;


// Export for module systems (if using ES6 modules)
// export default BookVault;