const API_KEY = "b6c494d8b41e4191965a15ea940eb633";
const BASE_URL = "https://newsapi.org/v2/";
const DEFAULT_NEWS_CATEGORY = "general";

// DOM Elements
const cardsContainer = document.getElementById("cards-container");
const loadingIndicator = document.getElementById("loading");
const emptyState = document.getElementById("empty-state");
const searchInput = document.getElementById("search-text");
const searchButton = document.getElementById("search-button");
const themeToggle = document.querySelector(".theme-toggle");
const themeIcon = document.getElementById("theme-icon");

let currentSelectedNav = document.querySelector(".category-item.active");
let savedArticles = JSON.parse(localStorage.getItem("savedArticles")) || [];

// Initialize the app
window.addEventListener("load", () => {
    fetchNews(DEFAULT_NEWS_CATEGORY);
    applySavedTheme();
});

// Fetch news data
async function fetchNews(query, isSearch = false) {
    try {
        showLoading();
        hideEmptyState();
        
        let url;
        if (isSearch) {
            url = `${BASE_URL}everything?q=${query}&sortBy=publishedAt&apiKey=${API_KEY}`;
        } else {
            url = `${BASE_URL}top-headlines?country=us&category=${query}&apiKey=${API_KEY}`;
        }
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.articles.length === 0) {
            showEmptyState();
        } else {
            bindData(data.articles, query);
        }
    } catch (error) {
        console.error("Error fetching news:", error);
        showEmptyState();
    } finally {
        hideLoading();
    }
}

// Bind data to the UI
function bindData(articles, category) {
    cardsContainer.innerHTML = "";
    
    articles.forEach(article => {
        if (!article.urlToImage) return;
        
        const cardTemplate = document.getElementById("template-news-card");
        const cardClone = cardTemplate.content.cloneNode(true);
        
        fillDataInCard(cardClone, article, category);
        cardsContainer.appendChild(cardClone);
    });
}

// Fill data in each news card
function fillDataInCard(cardClone, article, category) {
    const newsImg = cardClone.querySelector("#news-img");
    const newsTitle = cardClone.querySelector("#news-title");
    const newsSource = cardClone.querySelector("#news-source");
    const newsDate = cardClone.querySelector("#news-date");
    const newsDesc = cardClone.querySelector("#news-desc");
    const newsCategory = cardClone.querySelector("#news-category");
    const saveBtn = cardClone.querySelector(".save-btn");
    const shareBtn = cardClone.querySelector(".share-btn");
    
    // Set article data
    newsImg.src = article.urlToImage;
    newsImg.alt = article.title;
    newsTitle.textContent = article.title;
    newsSource.textContent = article.source?.name || "Unknown Source";
    newsDesc.textContent = article.description || "No description available.";
    newsCategory.textContent = category.charAt(0).toUpperCase() + category.slice(1);
    
    // Format date
    const date = new Date(article.publishedAt);
    newsDate.textContent = date.toLocaleDateString("en-US", {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    
    // Check if article is saved
    const isSaved = savedArticles.some(saved => saved.url === article.url);
    if (isSaved) {
        saveBtn.classList.add("saved");
        saveBtn.innerHTML = '<i class="fas fa-bookmark"></i> Saved';
    }
    
    // Add event listeners
    cardClone.querySelector(".news-card").addEventListener("click", (e) => {
        // Don't open article if clicking on buttons
        if (e.target.closest(".card-actions")) return;
        window.open(article.url, "_blank");
    });
    
    saveBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleSaveArticle(article, saveBtn);
    });
    
    shareBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        shareArticle(article);
    });
}

// Toggle save article
function toggleSaveArticle(article, button) {
    const articleIndex = savedArticles.findIndex(saved => saved.url === article.url);
    
    if (articleIndex === -1) {
        // Save article
        savedArticles.push(article);
        button.classList.add("saved");
        button.innerHTML = '<i class="fas fa-bookmark"></i> Saved';
        showToast("Article saved!");
    } else {
        // Remove article
        savedArticles.splice(articleIndex, 1);
        button.classList.remove("saved");
        button.innerHTML = '<i class="far fa-bookmark"></i> Save';
        showToast("Article removed!");
    }
    
    localStorage.setItem("savedArticles", JSON.stringify(savedArticles));
}

// Share article
function shareArticle(article) {
    if (navigator.share) {
        navigator.share({
            title: article.title,
            text: article.description,
            url: article.url
        }).catch(err => {
            console.error("Error sharing:", err);
            fallbackShare(article);
        });
    } else {
        fallbackShare(article);
    }
}

// Fallback for browsers that don't support Web Share API
function fallbackShare(article) {
    const shareUrl = `mailto:?subject=${encodeURIComponent(article.title)}&body=${encodeURIComponent(article.description + "\n\nRead more: " + article.url)}`;
    window.open(shareUrl);
}

// Category navigation click handler
function onNavItemClick(categoryId) {
    if (currentSelectedNav) {
        currentSelectedNav.classList.remove("active");
    }
    
    currentSelectedNav = document.getElementById(categoryId);
    currentSelectedNav.classList.add("active");
    
    // Clear search input
    searchInput.value = "";
    
    fetchNews(categoryId);
}

// Search handler
searchButton.addEventListener("click", () => {
    const query = searchInput.value.trim();
    if (!query) return;
    
    if (currentSelectedNav) {
        currentSelectedNav.classList.remove("active");
        currentSelectedNav = null;
    }
    
    fetchNews(query, true);
});

// Handle Enter key in search
searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        searchButton.click();
    }
});

// Reload the page
function reload() {
    window.location.reload();
}

// Theme toggle
themeToggle.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    
    if (currentTheme === "dark") {
        document.documentElement.removeAttribute("data-theme");
        themeIcon.classList.replace("fa-sun", "fa-moon");
        localStorage.setItem("theme", "light");
    } else {
        document.documentElement.setAttribute("data-theme", "dark");
        themeIcon.classList.replace("fa-moon", "fa-sun");
        localStorage.setItem("theme", "dark");
    }
});

// Apply saved theme preference
function applySavedTheme() {
    const savedTheme = localStorage.getItem("theme");
    
    if (savedTheme === "dark") {
        document.documentElement.setAttribute("data-theme", "dark");
        themeIcon.classList.replace("fa-moon", "fa-sun");
    }
}

// Show loading indicator
function showLoading() {
    loadingIndicator.style.display = "flex";
    cardsContainer.style.display = "none";
}

// Hide loading indicator
function hideLoading() {
    loadingIndicator.style.display = "none";
    cardsContainer.style.display = "grid";
}

// Show empty state
function showEmptyState() {
    emptyState.style.display = "block";
    cardsContainer.style.display = "none";
}

// Hide empty state
function hideEmptyState() {
    emptyState.style.display = "none";
    cardsContainer.style.display = "grid";
}

// Show toast notification
function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add("show");
    }, 10);
    
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// Add toast styles dynamically
const toastStyles = document.createElement("style");
toastStyles.textContent = `
.toast {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background-color: var(--dark-color);
    color: var(--light-color);
    padding: 12px 24px;
    border-radius: 4px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    z-index: 1000;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.toast.show {
    opacity: 1;
}
`;
document.head.appendChild(toastStyles);