// Khabarchi JS: Dynamic News Website
class NewsManager {
  constructor() {
    this.articles = [];
    this.categories = ['politics', 'business', 'sports', 'tech', 'entertainment', 'education', 'economics', 'elections'];
    this.isLoading = false;
  }

  // Initialize the news manager
  async init() {
    await this.loadArticles();
    this.setupEventListeners();
    this.updateYear();
    this.setupSearch();
    
    // Load content based on current page
    if (window.location.pathname.includes('article.html')) {
      this.loadArticlePage();
    } else {
      this.loadHomePage();
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
      const response = await fetch(`articles/${filename}`);
      if (!response.ok) throw new Error(`Failed to load ${filename}`);
      
      const content = await response.text();
      return this.parseMarkdown(content, filename);
    } catch (error) {
      console.warn(`Could not load article: ${filename}`, error);
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

  // Get featured articles
  getFeatured(limit = 4) {
    const featured = this.articles.filter(article => article.featured);
    return featured.length > 0 ? featured.slice(0, limit) : this.articles.slice(0, limit);
  }

  // Search articles
  searchArticles(query) {
    if (!query) return [];
    
    const searchTerm = query.toLowerCase();
    return this.articles.filter(article =>
      article.title.toLowerCase().includes(searchTerm) ||
      article.excerpt.toLowerCase().includes(searchTerm) ||
      (Array.isArray(article.tags) && article.tags.some(tag => 
        tag.toLowerCase().includes(searchTerm)
      )) ||
      (Array.isArray(article.category) && article.category.some(cat =>
        cat.toLowerCase().includes(searchTerm)
      ))
    );
  }

  // Load home page content
  loadHomePage() {
    this.loadFeaturedSection();
    this.loadTrendingSection();
    this.loadCategorySections();
  }

  // Load featured section
  loadFeaturedSection() {
    const featured = this.getFeatured();
    if (featured.length === 0) return;

    const mainFeatured = featured[0];
    const sideFeatured = featured.slice(1, 4);

    // Update main featured article
    const mainFeaturedEl = document.querySelector('.col-12.col-lg-7 .card');
    if (mainFeaturedEl) {
      mainFeaturedEl.innerHTML = `
        <img class="featured-img" src="${mainFeatured.image}" alt="${mainFeatured.title}">
        <div class="card-img-overlay d-flex flex-column justify-content-end p-4 p-md-5 gradient-overlay">
          <span class="badge bg-danger mb-2">${Array.isArray(mainFeatured.category) ? mainFeatured.category[0] : mainFeatured.category}</span>
          <h2 class="card-title text-white lh-sm">${mainFeatured.title}</h2>
          <p class="text-white-50 small mb-0">By ${mainFeatured.author} · ${mainFeatured.readTime || '5 min read'}</p>
        </div>
      `;
      mainFeaturedEl.href = `article.html?slug=${mainFeatured.slug}`;
    }

    // Update side featured articles
    const sideContainer = document.querySelector('.col-12.col-lg-5 .row');
    if (sideContainer && sideFeatured.length > 0) {
      sideContainer.innerHTML = sideFeatured.map(article => `
        <div class="col-12">
          <a class="card hover-lift text-reset text-decoration-none" href="article.html?slug=${article.slug}">
            <div class="row g-0">
              <div class="col-4">
                <img class="img-fluid rounded-start h-100 object-cover" src="${article.image}" alt="${article.title}">
              </div>
              <div class="col-8">
                <div class="card-body">
                  <span class="badge bg-primary-subtle text-primary-emphasis mb-2">
                    ${Array.isArray(article.category) ? article.category[0] : article.category}
                  </span>
                  <h5 class="card-title">${article.title}</h5>
                  <p class="card-text text-secondary small">${article.excerpt}</p>
                </div>
              </div>
            </div>
          </a>
        </div>
      `).join('');
    }
  }

  // Load trending section
  loadTrendingSection() {
    const trending = this.articles.slice(0, 4);
    const trendingContainer = document.querySelector('.row.g-4.row-cols-1.row-cols-sm-2.row-cols-lg-4');
    
    if (trendingContainer && trending.length > 0) {
      trendingContainer.innerHTML = trending.map(article => `
        <div class="col">
          <a href="article.html?slug=${article.slug}" class="card h-100 hover-lift text-reset text-decoration-none">
            <img src="${article.image}" class="card-img-top object-cover" alt="${article.title}">
            <div class="card-body">
              <span class="badge bg-secondary-subtle text-secondary-emphasis mb-2">
                ${Array.isArray(article.category) ? article.category[0] : article.category}
              </span>
              <h5 class="card-title">${article.title}</h5>
            </div>
          </a>
        </div>
      `).join('');
    }
  }

  // Load category sections
  loadCategorySections() {
    this.categories.forEach(category => {
      const articles = this.getByCategory(category).slice(0, 3);
      const sectionEl = document.querySelector(`#${category}`);
      
      if (sectionEl && articles.length > 0) {
        const container = sectionEl.querySelector('.row.g-4');
        if (container) {
          container.innerHTML = articles.map(article => `
            <div class="col">
              <a href="article.html?slug=${article.slug}" class="card h-100 hover-lift text-reset text-decoration-none">
                <img src="${article.image}" class="card-img-top object-cover" alt="${article.title}">
                <div class="card-body">
                  <h5 class="card-title">${article.title}</h5>
                  <p class="card-text text-secondary">${article.excerpt}</p>
                </div>
              </a>
            </div>
          `).join('');
        }
      }
    });
  }

  // Load article page
  loadArticlePage() {
    const urlParams = new URLSearchParams(window.location.search);
    const slug = urlParams.get('slug');
    
    if (!slug) {
      this.showError('Article not found');
      return;
    }
    
    const article = this.articles.find(a => a.slug === slug);
    if (!article) {
      this.showError('Article not found');
      return;
    }
    
    this.displayArticle(article);
  }

  // Display full article
  displayArticle(article) {
    // Update page title
    document.title = `${article.title} — Khabarchi`;
    
    // Update breadcrumb
    const breadcrumb = document.querySelector('.breadcrumb');
    if (breadcrumb) {
      const categoryName = Array.isArray(article.category) ? article.category[0] : article.category;
      breadcrumb.innerHTML = `
        <li class="breadcrumb-item"><a href="index.html">Home</a></li>
        <li class="breadcrumb-item"><a href="categories/${categoryName.toLowerCase()}.html">${categoryName}</a></li>
        <li class="breadcrumb-item active" aria-current="page">Article</li>
      `;
    }
    
    // Update article header
    const header = document.querySelector('header.container h1');
    if (header) {
      header.textContent = article.title;
    }
    
    const authorInfo = document.querySelector('.d-flex.align-items-center.gap-2');
    if (authorInfo) {
      authorInfo.innerHTML = `
        <img src="https://i.pravatar.cc/64?u=${article.author}" alt="${article.author}" class="rounded-circle" width="32" height="32">
        <span><strong>${article.author}</strong> · Senior Correspondent</span>
      `;
    }
    
    const publishInfo = document.querySelector('header.container .text-secondary.small');
    if (publishInfo) {
      const publishDate = new Date(article.date).toLocaleDateString('en-US', { 
        year: 'numeric', month: 'short', day: 'numeric' 
      });
      
      publishInfo.innerHTML = `
        <div class="d-flex flex-wrap align-items-center gap-3 text-secondary small">
          <span>Published ${publishDate}</span>
          <span class="d-flex align-items-center gap-1"><i class="bi bi-clock"></i> ${article.readTime || '5 min read'}</span>
          <div class="d-flex align-items-center gap-2 ms-auto">
            <a href="#" class="text-secondary"><i class="bi bi-bookmark"></i></a>
            <a href="#" class="text-secondary" onclick="shareArticle()"><i class="bi bi-share"></i></a>
          </div>
        </div>
      `;
    }
    
    // Update featured image
    const featuredImg = document.querySelector('.figure img');
    if (featuredImg) {
      featuredImg.src = article.image;
      featuredImg.alt = article.title;
    }
    
    // Update article content
    const articleContent = document.querySelector('.article-content');
    if (articleContent) {
      articleContent.innerHTML = article.content;
    }
    
    // Update tags
    const tagsContainer = document.querySelector('.d-flex.flex-wrap.align-items-center.gap-2');
    if (tagsContainer && article.tags) {
      const tags = Array.isArray(article.tags) ? article.tags : [article.tags];
      tagsContainer.innerHTML = `
        <span class="text-secondary small">Tags:</span>
        ${tags.map(tag => `<a href="#" class="badge text-bg-light text-decoration-none">${tag}</a>`).join('')}
      `;
    }
    
    // Load related articles
    this.loadRelatedArticles(article);
  }

  // Load related articles
  loadRelatedArticles(currentArticle) {
    const currentCategories = Array.isArray(currentArticle.category) 
      ? currentArticle.category 
      : [currentArticle.category];
    
    const related = this.articles.filter(article => {
      if (article.slug === currentArticle.slug) return false;
      
      const articleCategories = Array.isArray(article.category) 
        ? article.category 
        : [article.category];
      
      return currentCategories.some(cat => articleCategories.includes(cat));
    }).slice(0, 2);
    
    const relatedContainer = document.querySelector('.row.g-4.row-cols-1.row-cols-sm-2');
    if (relatedContainer && related.length > 0) {
      relatedContainer.innerHTML = related.map(article => `
        <div class="col">
          <a href="article.html?slug=${article.slug}" class="card h-100 hover-lift text-reset text-decoration-none">
            <img src="${article.image}" class="card-img-top object-cover" alt="${article.title}">
            <div class="card-body">
              <h6 class="card-title">${article.title}</h6>
            </div>
          </a>
        </div>
      `).join('');
    }
  }

  // Setup search functionality
  setupSearch() {
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
    const results = this.searchArticles(query);
    
    // For now, redirect to home page with search results
    // In a full implementation, you'd have a dedicated search results page
    console.log('Search results:', results);
    alert(`Found ${results.length} articles matching "${query}"`);
  }

  // Setup event listeners
  setupEventListeners() {
    // Smooth scroll for same-page anchors
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', (e) => {
        const targetId = a.getAttribute('href');
        if (targetId.length > 1) {
          const el = document.querySelector(targetId);
          if (el) {
            e.preventDefault();
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      });
    });
  }

  // Update year in footer
  updateYear() {
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  }

  // Show error message
  showError(message) {
    console.error('News Manager Error:', message);
    // You could implement a more user-friendly error display here
  }
}

// Global functions
window.shareArticle = function() {
  if (navigator.share) {
    navigator.share({
      title: document.title,
      url: window.location.href
    });
  } else {
    // Fallback: copy to clipboard
    navigator.clipboard.writeText(window.location.href).then(() => {
      alert('Article URL copied to clipboard!');
    });
  }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  const newsManager = new NewsManager();
  await newsManager.init();
});
