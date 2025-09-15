// Main JavaScript for Thinkers Table Podcast Homepage

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all functionality
    initHeaderScroll();
    initScrollReveals();
    initSignupForm();
    initQuotesMarquee();
    initBannerSubscribe();
    
    // Load episodes automatically
    loadAndDisplayEpisodes();
});

// RSS Feed Integration for Thinkers Table Podcast
const PODCAST_RSS_URL = "https://anchor.fm/s/bc46e210/podcast/rss";

// Function to fetch and parse RSS feed
async function fetchPodcastRSS() {
    try {
        // Use RSS2JSON service to convert RSS to JSON
        const rssToJsonUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(PODCAST_RSS_URL)}`;
        
        const response = await fetch(rssToJsonUrl);
        const data = await response.json();
        
        if (data.status === 'ok' && data.items) {
            return data.items.map(item => ({
                title: item.title || 'Untitled Episode',
                description: stripHTML(item.description || item.content || ''),
                date: formatDate(item.pubDate) || 'Unknown date',
                duration: extractDuration(item.description || item.content) || 'Unknown duration',
                audioUrl: item.link || '',
                spotifyUrl: item.link || '', // Use the same URL for now, can be updated with specific Spotify URLs
                episodeNumber: extractEpisodeNumber(item.title) || '',
                guid: item.guid || '',
                coverImage: extractCoverImage(item) || null
            }));
        }
    } catch (error) {
        console.log('RSS fetch failed, using fallback data:', error);
    }
    
    // Fallback data based on your actual episodes
    return [
        {
            title: "SEASON FINALE - season 1",
            description: "In this episode, I discuss the vision and goals for the Thinker's Table podcast, including the focus on deep tech and the importance of showcasing operators in the industry. I also introduce the Vibe Coder House aimed at fostering a tech community in London!",
            duration: "12 min",
            date: "Aug 4, 2024",
            audioUrl: "https://open.spotify.com/show/2NO20Xotti7YZObF6ZxBA7",
            spotifyUrl: "https://open.spotify.com/show/2NO20Xotti7YZObF6ZxBA7",
            coverImage: null
        },
        {
            title: "ASTI - ep9, building a business from a personal problem + new launch announcement!",
            description: "Asti is a entrepreneur at heart, and now the founder & CEO of Invyted, a app that simplifies the process of inviting content creators to your location! And it has received fundraising from the likes of the Leon founder.",
            duration: "39 min",
            date: "Mar 12, 2024",
            audioUrl: "https://open.spotify.com/episode/6wmdTsmmGb1jBLb1NUYbaV?si=_Gxud3j8SliX5fUXOvYkPg",
            spotifyUrl: "https://open.spotify.com/episode/6wmdTsmmGb1jBLb1NUYbaV?si=_Gxud3j8SliX5fUXOvYkPg",
            coverImage: null
        },
        {
            title: "TIM - ep8, exiting a business & product skills",
            description: "Tim is a product person at heart, but now a executive, most recently the ex-CEO & Founder of ETC Group (exited to Bitwise). Tim helped manage his firm within 6 years using his deep product skills.",
            duration: "48 min",
            date: "Feb 14, 2024",
            audioUrl: "https://open.spotify.com/show/2NO20Xotti7YZObF6ZxBA7",
            spotifyUrl: "https://open.spotify.com/show/2NO20Xotti7YZObF6ZxBA7",
            coverImage: null
        }
    ];
}

// Helper functions
function stripHTML(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
}

function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    } catch (error) {
        return 'Unknown date';
    }
}

function extractDuration(content) {
    // Look for duration patterns like "12:10", "45 min", etc.
    const timeMatch = content?.match(/(\d{1,2}):(\d{2}):(\d{2})/);
    if (timeMatch) {
        const hours = parseInt(timeMatch[1]);
        const minutes = parseInt(timeMatch[2]);
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else {
            return `${minutes} min`;
        }
    }
    
    const minMatch = content?.match(/(\d+)\s*min/i);
    return minMatch ? minMatch[0] : 'Unknown duration';
}

function extractEpisodeNumber(title) {
    const episodeMatch = title?.match(/ep(\d+)/i);
    return episodeMatch ? episodeMatch[1] : null;
}

// Function to extract cover image from RSS item
function extractCoverImage(item) {
    // Try multiple sources for cover image
    if (item.thumbnail) return item.thumbnail;
    if (item.enclosure && item.enclosure.url) return item.enclosure.url;
    if (item.image && item.image.url) return item.image.url;
    
    // Try to extract from content/description
    const content = item.description || item.content || '';
    const imgMatch = content.match(/<img[^>]+src="([^"]+)"/i);
    if (imgMatch) return imgMatch[1];
    
    // Try to extract from media:content
    if (item['media:content'] && item['media:content'].url) return item['media:content'].url;
    
    return null;
}

// Function to update the latest episode cover image
function updateLatestEpisodeCover(coverImageUrl) {
    const episodeVisual = document.querySelector('.episode-visual');
    if (!episodeVisual) return;
    
    if (coverImageUrl) {
        // Replace the collage with the actual cover image
        episodeVisual.innerHTML = `
            <div class="episode-cover">
                <img src="${coverImageUrl}" alt="Episode Cover" class="cover-image" onerror="this.style.display='none'; this.nextElementSibling.style.display='grid';">
                <div class="episode-collage fallback" style="display: none;">
                    <div class="collage-item"></div>
                    <div class="collage-item"></div>
                    <div class="collage-item"></div>
                </div>
            </div>
        `;
    } else {
        // Keep the original collage if no cover image
        episodeVisual.innerHTML = `
            <div class="episode-collage">
                <div class="collage-item"></div>
                <div class="collage-item"></div>
                <div class="collage-item"></div>
            </div>
        `;
    }
}

// Function to update the latest episode section
function updateLatestEpisode(episode) {
    const titleElement = document.getElementById('latest-episode-title');
    const descriptionElement = document.getElementById('latest-episode-description');
    const durationElement = document.getElementById('latest-episode-duration');
    const dateElement = document.getElementById('latest-episode-date');
    const episodePitchSection = document.querySelector('.episode-pitch');
    
    if (titleElement) titleElement.textContent = episode.title;
    if (descriptionElement) {
        // Limit description length for better display
        const maxLength = 300;
        const description = episode.description.length > maxLength 
            ? episode.description.substring(0, maxLength) + '...' 
            : episode.description;
        descriptionElement.textContent = description;
    }
    if (durationElement) durationElement.textContent = episode.duration;
    if (dateElement) dateElement.textContent = episode.date;
    
    // Add click handler to the episode pitch section
    if (episodePitchSection) {
        episodePitchSection.style.cursor = 'pointer';
        episodePitchSection.addEventListener('click', () => {
            window.open(episode.spotifyUrl || episode.audioUrl, '_blank');
        });
        
        // Add hover effect
        episodePitchSection.addEventListener('mouseenter', () => {
            episodePitchSection.style.transform = 'translateY(-2px)';
            episodePitchSection.style.transition = 'transform 0.3s ease';
        });
        
        episodePitchSection.addEventListener('mouseleave', () => {
            episodePitchSection.style.transform = 'translateY(0)';
        });
    }
    
    // Update cover image if available
    updateLatestEpisodeCover(episode.coverImage);
}

// Function to update featured episodes
function updateFeaturedEpisodes(episodes) {
    const gridElement = document.getElementById('featured-episodes-grid');
    if (!gridElement) return;
    
    // Clear existing content
    gridElement.innerHTML = '';
    
    // Take the next 2 episodes after the latest
    const featuredEpisodes = episodes.slice(1, 3);
    
    featuredEpisodes.forEach(episode => {
        const episodeElement = createEpisodeElement(episode);
        gridElement.appendChild(episodeElement);
    });
}

// Function to create episode element
function createEpisodeElement(episode) {
    const episodeDiv = document.createElement('div');
    episodeDiv.className = 'video-item';
    episodeDiv.style.cursor = 'pointer';
    
    // Limit title and description for display
    const maxTitleLength = 60;
    const maxDescLength = 120;
    
    const shortTitle = episode.title.length > maxTitleLength 
        ? episode.title.substring(0, maxTitleLength) + '...' 
        : episode.title;
    
    const shortDesc = episode.description.length > maxDescLength 
        ? episode.description.substring(0, maxDescLength) + '...' 
        : episode.description;
    
    // Create cover image or placeholder
    const coverImage = episode.coverImage ? 
        `<img src="${episode.coverImage}" alt="Episode Cover" class="episode-cover-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` : '';
    
    const placeholder = `
        <div class="video-placeholder">
            <i class="fas fa-play-circle"></i>
        </div>
    `;
    
    episodeDiv.innerHTML = `
        <div class="video-player">
            ${coverImage}
            ${placeholder}
        </div>
        <div class="video-caption">
            <h4>${shortTitle}</h4>
            <p>${shortDesc}</p>
            <div class="episode-meta-small" style="margin-top: var(--space-4);">
                <span style="color: var(--color-muted); font-size: var(--size-small);">${episode.duration}</span>
                <span style="color: var(--color-muted); font-size: var(--size-small); margin-left: var(--space-4);">${episode.date}</span>
            </div>
        </div>
    `;
    
    // Add click handler to open episode
    episodeDiv.addEventListener('click', () => {
        window.open(episode.spotifyUrl || episode.audioUrl, '_blank');
    });
    
    // Add hover effect
    episodeDiv.addEventListener('mouseenter', () => {
        episodeDiv.style.transform = 'translateY(-4px)';
        episodeDiv.style.transition = 'transform 0.3s ease';
    });
    
    episodeDiv.addEventListener('mouseleave', () => {
        episodeDiv.style.transform = 'translateY(0)';
    });
    
    return episodeDiv;
}

// Main function to load and display episodes
async function loadAndDisplayEpisodes() {
    try {
        console.log('Loading episodes from RSS feed...');
        const episodes = await fetchPodcastRSS();
        
        if (episodes && episodes.length > 0) {
            console.log(`Loaded ${episodes.length} episodes successfully!`);
            
            // Update latest episode
            updateLatestEpisode(episodes[0]);
            
            // Update featured episodes
            updateFeaturedEpisodes(episodes);
            
            // Optional: Log episode titles for debugging
            console.log('Episodes loaded:', episodes.map(ep => ep.title));
        }
    } catch (error) {
        console.error('Error loading episodes:', error);
    }
}

// Header scroll underline animation
function initHeaderScroll() {
    const header = document.getElementById('header');
    const underline = header.querySelector('.header-underline');
    
    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
}

// Scroll reveal animations
function initScrollReveals() {
    const observerOptions = {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
            }
        });
    }, observerOptions);
    
    // Add reveal class to elements that should animate on scroll
    const revealElements = document.querySelectorAll(`
        .episode-pitch,
        .featured-videos,
        .cta-signup,
        .footer
    `);
    
    revealElements.forEach(el => {
        el.classList.add('reveal');
        observer.observe(el);
    });
}

// Beehiiv form handling - with fallback approach
function initSignupForm() {
    console.log('Beehiiv embed form initialization started');
    
    // Debug iframe loading
    const iframe = document.getElementById('beehiiv-iframe');
    const debugInfo = document.getElementById('debug-info');
    
    if (iframe) {
        console.log('Iframe element found:', iframe);
        
        // Check if iframe loads within 3 seconds
        setTimeout(() => {
            try {
                // Try to access iframe content to see if it loaded
                if (iframe.contentDocument || iframe.contentWindow) {
                    console.log('Iframe content accessible');
                    if (debugInfo) {
                        debugInfo.style.display = 'none';
                    }
                } else {
                    console.log('Iframe content not accessible - showing alternative form');
                    showAlternativeForm();
                }
            } catch (e) {
                console.log('Iframe access blocked by CORS - showing alternative form');
                showAlternativeForm();
            }
        }, 3000);
        
    } else {
        console.error('Iframe element not found');
        showAlternativeForm();
    }
}

// Function to show alternative form when iframe fails
function showAlternativeForm() {
    const iframe = document.getElementById('beehiiv-iframe');
    const alternativeForm = document.getElementById('alternative-form');
    const debugInfo = document.getElementById('debug-info');
    
    if (iframe) {
        iframe.style.display = 'none';
    }
    
    if (alternativeForm) {
        alternativeForm.style.display = 'block';
        console.log('Alternative form shown');
    }
    
    if (debugInfo) {
        debugInfo.style.display = 'none';
    }
}

// Helper functions removed - beehiiv embed form handles all validation and messaging

// Beehiiv embed form is now handling all subscription logic
// No custom submission function needed

// Quotes marquee functionality
function initQuotesMarquee() {
    const quotesTrack = document.querySelector('.quotes-track');
    if (!quotesTrack) return;
    
    // Check if user prefers reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        quotesTrack.style.animation = 'none';
        return;
    }
    
    // Pause on hover for better performance
    quotesTrack.addEventListener('mouseenter', () => {
        quotesTrack.style.animationPlayState = 'paused';
    });
    
    quotesTrack.addEventListener('mouseleave', () => {
        quotesTrack.style.animationPlayState = 'running';
    });
}

// Header subscribe button functionality
function initBannerSubscribe() {
    const headerSubscribeBtn = document.querySelector('.header-cta .subscribe-button');
    if (headerSubscribeBtn) {
        headerSubscribeBtn.addEventListener('click', function() {
            // Scroll to the signup section
            const signupSection = document.querySelector('.cta-signup');
            if (signupSection) {
                const headerHeight = document.getElementById('header').offsetHeight;
                const targetPosition = signupSection.offsetTop - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    }
}

// Smooth scrolling for navigation links
function initSmoothScrolling() {
    const navLinks = document.querySelectorAll('a[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                const headerHeight = document.getElementById('header').offsetHeight;
                const targetPosition = targetElement.offsetTop - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Performance optimization: Throttle scroll events
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// Apply throttling to scroll events
window.addEventListener('scroll', throttle(() => {
    // Any additional scroll-based functionality can go here
}, 16)); // ~60fps

// Initialize smooth scrolling
initSmoothScrolling();

// Add loading states for better UX
window.addEventListener('load', function() {
    document.body.classList.add('loaded');
});

// Add CSS class for loaded state
document.addEventListener('DOMContentLoaded', function() {
    // Add any additional initialization here
    console.log('Thinkers Table homepage loaded successfully!');
});