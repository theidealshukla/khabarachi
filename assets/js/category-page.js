// Category Page JavaScript for Khabarchi
class CategoryPageManager {
  constructor() {
    this.articles = [];
    this.currentCategory = this.getCurrentCategory();
    this.currentFilter = 'all';
    this.currentSort = 'latest';
    this.articlesPerPage = 9;
    this.currentPage = 1;
    this.displayedArticles = 0;
    this.isLoading = false;
    
    // Debug info
    console.log('CategoryPageManager initialized');
    console.log('Current URL:', window.location.href);
    console.log('Hostname:', window.location.hostname);
    console.log('Pathname:', window.location.pathname);
  }

  // Get the correct base path for GitHub Pages
  getBasePath() {
    // For GitHub Pages, the pattern is: username.github.io/repository-name
    if (window.location.hostname.includes('github.io')) {
      // Extract repository name from pathname or use default
      const pathParts = window.location.pathname.split('/').filter(part => part);
      if (pathParts.length > 0 && pathParts[0] === 'khabarchi') {
        return '/khabarchi';
      }
      // Fallback: try to detect from URL
      return window.location.pathname.includes('khabarchi') ? '/khabarchi' : '';
    }
    return '';
  }

  // Get current category from URL
  getCurrentCategory() {
    const path = window.location.pathname;
    const fileName = path.substring(path.lastIndexOf('/') + 1);
    return fileName.replace('.html', '');
  }

  // Initialize the category page
  async init() {
    console.log('Initializing CategoryPageManager...');
    
    // Test basic file access first
    await this.testFileAccess();
    
    await this.loadArticles();
    console.log(`Loaded ${this.articles.length} articles`);
    this.setupEventListeners();
    this.updateYear();
    this.loadCategoryContent();
  }

  // Test file access to diagnose GitHub Pages issues
  async testFileAccess() {
    console.log('Testing file access...');
    
    const basePath = this.getBasePath();
    const testPaths = [
      `${basePath}/test.txt`,
      `/test.txt`,
      `../test.txt`,
      `test.txt`
    ];
    
    for (const path of testPaths) {
      try {
        const response = await fetch(path);
        console.log(`Path '${path}': ${response.status} ${response.statusText}`);
        if (response.ok) {
          const content = await response.text();
          console.log(`Success with path '${path}':`, content);
          break;
        }
      } catch (error) {
        console.log(`Path '${path}': Error -`, error.message);
      }
    }
  }

  // Load all articles from markdown files
  async loadArticles() {
    if (this.isLoading) return;
    this.isLoading = true;

    const articleFiles = [
      'parliament-debate-reforms.md',
      'ai-tools-classrooms.md', 
      'cricket-series-victory.md',
      'india-asia-cup-victory.md',
      'stock-market-rally-tech.md',
      'ecommerce-growth-surge.md',
      'director-latest-release.md',
      'state-polls-announcement.md'
    ];

    const loadPromises = articleFiles.map(file => this.loadSingleArticle(file));
    const results = await Promise.allSettled(loadPromises);
    
    this.articles = results
      .filter(result => result.status === 'fulfilled' && result.value)
      .map(result => result.value)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    this.isLoading = false;
  }

  // Load single article from markdown file
  async loadSingleArticle(filename) {
    try {
      // Try multiple path strategies for GitHub Pages
      let response;
      let basePath = '';
      
      // Strategy 1: Check if we're on GitHub Pages
      if (window.location.hostname.includes('github.io')) {
        basePath = '/khabarachi';
      }
      
      // Try the determined path first
      try {
        response = await fetch(`${basePath}/articles/${filename}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
      } catch (firstError) {
        console.warn(`First attempt failed with basePath '${basePath}':`, firstError.message);
        
        // Strategy 2: Try without basePath
        try {
          response = await fetch(`/articles/${filename}`);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
        } catch (secondError) {
          console.warn(`Second attempt failed:`, secondError.message);
          
          // Strategy 3: Try relative path
          response = await fetch(`../articles/${filename}`);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
        }
      }
      
      const content = await response.text();
      return this.parseMarkdown(content, filename);
    } catch (error) {
      console.error(`Could not load article: ${filename}`, error);
      return null;
    }
  }

  // Parse markdown content with frontmatter
  parseMarkdown(content, filename) {
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
    const match = content.match(frontmatterRegex);
    
    if (!match) return null;
    
    const [, frontmatter, markdownContent] = match;
    const metadata = this.parseFrontmatter(frontmatter);
    
    // Convert markdown to HTML (basic implementation)
    const htmlContent = this.markdownToHtml(markdownContent);
    
    return {
      ...metadata,
      content: htmlContent,
      slug: filename.replace('.md', ''),
      excerpt: metadata.excerpt || this.generateExcerpt(markdownContent)
    };
  }

  // Parse YAML-like frontmatter
  parseFrontmatter(frontmatter) {
    const metadata = {};
    frontmatter.split('\n').forEach(line => {
      const colonIndex = line.indexOf(':');
      if (colonIndex === -1) return;
      
      const key = line.substring(0, colonIndex).trim();
      let value = line.substring(colonIndex + 1).trim();
      
      // Remove quotes
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      
      // Parse arrays
      if (value.startsWith('[') && value.endsWith(']')) {
        value = value.slice(1, -1)
          .split(',')
          .map(item => item.trim().replace(/['"]/g, ''))
          .filter(item => item.length > 0);
      }
      
      metadata[key] = value;
    });
    
    return metadata;
  }

  // Basic markdown to HTML conversion
  markdownToHtml(markdown) {
    return markdown
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^\- (.*$)/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
      .replace(/^\d+\. (.*$)/gm, '<li>$1</li>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(?!<[h|u|l])(.+)/gm, '<p>$1</p>')
      .replace(/<p><\/p>/g, '')
      .replace(/<p>(<h[1-6]>)/g, '$1')
      .replace(/(<\/h[1-6]>)<\/p>/g, '$1')
      .replace(/<p>(<ul>)/g, '$1')
      .replace(/(<\/ul>)<\/p>/g, '$1');
  }

  // Generate excerpt from content
  generateExcerpt(content, maxLength = 150) {
    const plainText = content.replace(/[#*`\[\]]/g, '').replace(/\n+/g, ' ').trim();
    return plainText.length > maxLength 
      ? plainText.substring(0, maxLength) + '...' 
      : plainText;
  }

  // Get articles by category
  getByCategory(category) {
    if (!category || category === 'all') return this.articles;
    
    return this.articles.filter(article => {
      const categories = Array.isArray(article.category) ? article.category : [article.category];
      return categories.some(cat => cat.toLowerCase() === category.toLowerCase());
    });
  }

  // Filter articles by subcategory/tag
  filterArticles(articles, filter) {
    if (!filter || filter === 'all') return articles;
    
    return articles.filter(article => {
      const tags = Array.isArray(article.tags) ? article.tags : [];
      const categories = Array.isArray(article.category) ? article.category : [article.category];
      
      return tags.some(tag => tag.toLowerCase().includes(filter.toLowerCase())) ||
             categories.some(cat => cat.toLowerCase().includes(filter.toLowerCase()));
    });
  }

  // Sort articles
  sortArticles(articles, sortType) {
    const sorted = [...articles];
    
    switch (sortType) {
      case 'latest':
        return sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
      case 'oldest':
        return sorted.sort((a, b) => new Date(a.date) - new Date(b.date));
      case 'featured':
        return sorted.sort((a, b) => {
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return new Date(b.date) - new Date(a.date);
        });
      default:
        return sorted;
    }
  }

  // Load category content
  loadCategoryContent() {
    const categoryArticles = this.getByCategory(this.currentCategory);
    
    if (categoryArticles.length === 0) {
      this.showNoArticles();
      return;
    }

    this.loadFeaturedSection(categoryArticles);
    this.loadAllArticles(categoryArticles);
  }

  // Load featured section
  loadFeaturedSection(articles) {
    const featured = articles.filter(article => article.featured).slice(0, 3);
    const displayArticles = featured.length > 0 ? featured : articles.slice(0, 3);
    
    const container = document.getElementById('featuredPolitics') || 
                     document.querySelector('[id^="featured"]');
    
    if (!container) return;

    if (displayArticles.length === 0) {
      container.innerHTML = `
        <div class="col-12 text-center py-5">
          <h4 class="text-muted">No featured articles available</h4>
        </div>
      `;
      return;
    }

    const basePath = window.location.pathname.includes('/khabarachi/') ? '/khabarachi' : '';

    container.innerHTML = displayArticles.map(article => {
      const categoryName = Array.isArray(article.category) ? article.category[0] : article.category;
      const publishDate = new Date(article.date).toLocaleDateString('en-US', { 
        year: 'numeric', month: 'short', day: 'numeric' 
      });

      return `
        <div class="col-md-6 col-lg-4">
          <a href="${basePath}/article.html?slug=${article.slug}" class="card h-100 hover-lift text-reset text-decoration-none">
            <img src="${article.image}" class="card-img-top object-cover" alt="${article.title}" style="height: 200px;">
            <div class="card-body">
              <span class="badge bg-primary mb-2">${categoryName}</span>
              <h5 class="card-title">${article.title}</h5>
              <p class="card-text text-secondary">${article.excerpt}</p>
              <div class="d-flex align-items-center text-muted small mt-auto">
                <img src="https://i.pravatar.cc/32?u=${article.author}" alt="${article.author}" class="rounded-circle me-2" width="24" height="24">
                <span class="me-auto">${article.author}</span>
                <span>${publishDate}</span>
              </div>
            </div>
          </a>
        </div>
      `;
    }).join('');
  }

  // Load all articles
  loadAllArticles(categoryArticles) {
    const filtered = this.filterArticles(categoryArticles, this.currentFilter);
    const sorted = this.sortArticles(filtered, this.currentSort);
    
    const container = document.getElementById('allPolitics') || 
                     document.querySelector('[id^="all"]');
    
    if (!container) return;

    if (sorted.length === 0) {
      container.innerHTML = `
        <div class="col-12 text-center py-5">
          <h4 class="text-muted">No articles found</h4>
          <p class="text-muted">Try adjusting your filters or check back later for new content.</p>
        </div>
      `;
      this.hideLoadMoreButton();
      return;
    }

    // Load first page
    this.displayedArticles = 0;
    this.currentPage = 1;
    this.loadMoreArticles(sorted, container, true);
  }

  // Load more articles (pagination)
  loadMoreArticles(articles, container, clearFirst = false) {
    const start = this.displayedArticles;
    const end = Math.min(start + this.articlesPerPage, articles.length);
    const articlesToShow = articles.slice(start, end);

    if (clearFirst) {
      container.innerHTML = '';
    }

    const articlesHTML = articlesToShow.map(article => {
      const categoryName = Array.isArray(article.category) ? article.category[0] : article.category;
      const publishDate = new Date(article.date).toLocaleDateString('en-US', { 
        year: 'numeric', month: 'short', day: 'numeric' 
      });

      const basePath = this.getBasePath();

      return `
        <div class="col">
          <a href="${basePath}/article.html?slug=${article.slug}" class="card h-100 hover-lift text-reset text-decoration-none">
            <img src="${article.image}" class="card-img-top object-cover" alt="${article.title}" style="height: 200px;">
            <div class="card-body d-flex flex-column">
              <span class="badge bg-outline-primary text-primary mb-2 align-self-start">${categoryName}</span>
              <h5 class="card-title">${article.title}</h5>
              <p class="card-text text-secondary flex-grow-1">${article.excerpt}</p>
              <div class="d-flex align-items-center text-muted small mt-auto">
                <img src="https://i.pravatar.cc/32?u=${article.author}" alt="${article.author}" class="rounded-circle me-2" width="24" height="24">
                <span class="me-auto">${article.author}</span>
                <span><i class="bi bi-clock me-1"></i>${article.readTime || '5 min'}</span>
              </div>
              <div class="text-muted small mt-2">
                ${publishDate}
              </div>
            </div>
          </a>
        </div>
      `;
    }).join('');

    container.insertAdjacentHTML('beforeend', articlesHTML);
    
    this.displayedArticles = end;
    
    // Show/hide load more button
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
      if (end < articles.length) {
        loadMoreBtn.style.display = 'block';
        loadMoreBtn.onclick = () => this.loadMoreArticles(articles, container);
      } else {
        loadMoreBtn.style.display = 'none';
      }
    }
  }

  // Hide load more button
  hideLoadMoreButton() {
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
      loadMoreBtn.style.display = 'none';
    }
  }

  // Show no articles message
  showNoArticles() {
    const containers = [
      document.getElementById('featuredPolitics'),
      document.getElementById('allPolitics'),
      document.querySelector('[id^="featured"]'),
      document.querySelector('[id^="all"]')
    ].filter(Boolean);

    containers.forEach(container => {
      container.innerHTML = `
        <div class="col-12 text-center py-5">
          <i class="bi bi-newspaper display-1 text-muted mb-3"></i>
          <h4 class="text-muted">No articles available</h4>
          <p class="text-muted">Check back soon for the latest ${this.currentCategory} news.</p>
        </div>
      `;
    });

    this.hideLoadMoreButton();
  }

  // Setup event listeners
  setupEventListeners() {
    // Filter buttons
    document.querySelectorAll('[data-filter]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Update active button
        document.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Update filter and reload
        this.currentFilter = btn.dataset.filter;
        const categoryArticles = this.getByCategory(this.currentCategory);
        this.loadAllArticles(categoryArticles);
      });
    });

    // Sort dropdown
    document.querySelectorAll('[data-sort]').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Update dropdown button text
        const dropdownBtn = document.getElementById('sortDropdown');
        if (dropdownBtn) {
          const sortLabels = {
            'latest': 'Sort by Latest',
            'oldest': 'Sort by Oldest', 
            'featured': 'Featured First'
          };
          dropdownBtn.textContent = sortLabels[item.dataset.sort] || 'Sort by Latest';
        }
        
        // Update sort and reload
        this.currentSort = item.dataset.sort;
        const categoryArticles = this.getByCategory(this.currentCategory);
        this.loadAllArticles(categoryArticles);
      });
    });

    // Search functionality
    const searchForm = document.querySelector('form[role="search"]');
    const searchInput = document.querySelector('input[type="search"]');
    
    if (searchForm && searchInput) {
      searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const query = searchInput.value.trim();
        if (query) {
          this.performSearch(query);
        }
      });
    }
  }

  // Perform search
  performSearch(query) {
    const categoryArticles = this.getByCategory(this.currentCategory);
    const searchResults = categoryArticles.filter(article =>
      article.title.toLowerCase().includes(query.toLowerCase()) ||
      article.excerpt.toLowerCase().includes(query.toLowerCase()) ||
      (Array.isArray(article.tags) && article.tags.some(tag => 
        tag.toLowerCase().includes(query.toLowerCase())
      ))
    );

    // Display search results
    const container = document.getElementById('allPolitics') || 
                     document.querySelector('[id^="all"]');
    
    if (!container) return;

    if (searchResults.length === 0) {
      container.innerHTML = `
        <div class="col-12 text-center py-5">
          <i class="bi bi-search display-1 text-muted mb-3"></i>
          <h4 class="text-muted">No results found</h4>
          <p class="text-muted">No articles found for "${query}" in ${this.currentCategory} category.</p>
        </div>
      `;
      this.hideLoadMoreButton();
      return;
    }

    // Update section title to show search results
    const sectionTitle = document.querySelector('#allPolitics').parentElement.querySelector('h2') ||
                        document.querySelector('[id^="all"]').parentElement.querySelector('h2');
    if (sectionTitle) {
      sectionTitle.innerHTML = `Search Results for "${query}" <small class="text-muted">(${searchResults.length} articles)</small>`;
    }

    this.displayedArticles = 0;
    this.loadMoreArticles(searchResults, container, true);
  }

  // Update year in footer
  updateYear() {
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  const categoryManager = new CategoryPageManager();
  await categoryManager.init();
});
