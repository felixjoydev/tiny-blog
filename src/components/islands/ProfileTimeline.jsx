import { useState, useEffect, useRef } from 'react';

/**
 * ProfileTimeline - Interactive timeline for profile page
 * @param {Object} props
 * @param {Array} props.posts - Array of posts with created_at dates
 */
export default function ProfileTimeline({ posts }) {
  const [activeYear, setActiveYear] = useState(null);
  const [activeMonth, setActiveMonth] = useState(null);
  const [timeline, setTimeline] = useState({ years: [], months: {} });
  const postRefs = useRef({});
  const timelineContainerRef = useRef(null);
  const activeButtonRef = useRef(null);

  // Group posts by year and month
  useEffect(() => {
    if (!posts || posts.length === 0) return;

    const grouped = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    posts.forEach((post) => {
      const date = new Date(post.created_at);
      const year = date.getFullYear();
      const month = monthNames[date.getMonth()];
      
      if (!grouped[year]) {
        grouped[year] = [];
      }
      if (!grouped[year].includes(month)) {
        grouped[year].push(month);
      }
    });

    // Sort years descending
    const years = Object.keys(grouped).sort((a, b) => b - a);
    
    // Sort months for each year
    const months = {};
    years.forEach(year => {
      months[year] = grouped[year].sort((a, b) => {
        return monthNames.indexOf(b) - monthNames.indexOf(a);
      });
    });

    setTimeline({ years, months });
    
    // Set initial active year and month
    if (years.length > 0) {
      setActiveYear(years[0]);
      setActiveMonth(months[years[0]][0]);
    }
  }, [posts]);

  // Track scroll position and update active year/month
  useEffect(() => {
    if (!posts || posts.length === 0) return;

    const handleScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight / 2;
      const windowBottom = window.scrollY + window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // Check if user scrolled to the bottom
      const isAtBottom = windowBottom >= documentHeight - 100; // 100px threshold
      
      // Find which post is currently in view
      let currentPost = null;
      let minDistance = Infinity;
      
      posts.forEach((post) => {
        const element = document.getElementById(`post-${post.id}`);
        if (element) {
          const rect = element.getBoundingClientRect();
          const elementTop = rect.top + window.scrollY;
          const distance = Math.abs(scrollPosition - elementTop);
          
          if (distance < minDistance) {
            minDistance = distance;
            currentPost = post;
          }
        }
      });
      
      // If at bottom, use the last (oldest) post
      if (isAtBottom && posts.length > 0) {
        currentPost = posts[posts.length - 1];
      }
      
      if (currentPost) {
        const date = new Date(currentPost.created_at);
        const year = date.getFullYear().toString();
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = monthNames[date.getMonth()];
        
        setActiveYear(year);
        setActiveMonth(month);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial call
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [posts]);

  // Auto-scroll timeline to keep active month visible
  useEffect(() => {
    if (activeButtonRef.current && timelineContainerRef.current) {
      activeButtonRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      });
    }
  }, [activeYear, activeMonth]);

  // Handle click to scroll to year/month
  const handleYearClick = (year) => {
    const firstPostOfYear = posts.find(post => {
      return new Date(post.created_at).getFullYear().toString() === year;
    });
    
    if (firstPostOfYear) {
      const element = document.getElementById(`post-${firstPostOfYear.id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const handleMonthClick = (year, month) => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthIndex = monthNames.indexOf(month);
    
    const firstPostOfMonth = posts.find(post => {
      const date = new Date(post.created_at);
      return date.getFullYear().toString() === year && date.getMonth() === monthIndex;
    });
    
    if (firstPostOfMonth) {
      const element = document.getElementById(`post-${firstPostOfMonth.id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  if (!posts || posts.length === 0 || timeline.years.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-8 right-8 z-40">
      {/* Timeline container with fixed height and scroll */}
      <div className="relative" style={{ height: '360px', width: '200px' }}>
        {/* Top blur gradient */}
        <div 
          className="absolute top-0 left-0 right-0 h-16 pointer-events-none z-10"
          style={{
            background: 'linear-gradient(180deg, rgba(255, 250, 239, 1) 0%, rgba(255, 250, 239, 0) 100%)',
            backdropFilter: 'blur(4px)',
            maskImage: 'linear-gradient(180deg, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0) 100%)',
            WebkitMaskImage: 'linear-gradient(180deg, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0) 100%)'
          }}
        />
        
        {/* Scrollable timeline content */}
        <div           ref={timelineContainerRef}          className="h-full overflow-y-auto pr-2 scrollbar-hide"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          <div className="flex flex-col items-end gap-4 pt-16 pb-16">
            {timeline.years.map((year) => (
              <div key={year} className="flex flex-col items-end gap-2">
                {/* Year */}
                <button
                  onClick={() => handleYearClick(year)}
                  className="flex items-center gap-3 transition-all duration-300 hover:gap-4 group"
                  style={{ opacity: activeYear === year ? 1 : 0.5 }}
                >
                  <span 
                    className="font-['Exposure[-40]:Regular',sans-serif] text-xl tracking-tight transition-colors duration-300"
                    style={{ color: '#3F331C' }}
                  >
                    {year}
                  </span>
                  <div 
                    className="h-[3px] transition-all duration-300"
                    style={{ 
                      width: activeYear === year ? '80px' : '60px',
                      backgroundColor: '#3F331C'
                    }}
                  />
                </button>
                
                {/* Months for this year */}
                <div className="flex flex-col items-end gap-1.5 ml-4">
                  {timeline.months[year].map((month) => (
                    <button
                      key={`${year}-${month}`}
                      ref={activeYear === year && activeMonth === month ? activeButtonRef : null}
                      onClick={() => handleMonthClick(year, month)}
                      className="flex items-center gap-2 transition-all duration-300 hover:gap-3 group"
                      style={{ opacity: activeYear === year && activeMonth === month ? 1 : 0.5 }}
                    >
                      <span 
                        className="font-['Exposure[-20]:Regular',sans-serif] text-base transition-colors duration-300"
                        style={{ color: '#3F331C' }}
                      >
                        {month}
                      </span>
                      <div 
                        className="h-[2px] transition-all duration-300"
                        style={{ 
                          width: activeYear === year && activeMonth === month ? '60px' : '40px',
                          backgroundColor: '#3F331C'
                        }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Bottom blur gradient */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none z-10"
          style={{
            background: 'linear-gradient(0deg, rgba(255, 250, 239, 1) 0%, rgba(255, 250, 239, 0) 100%)',
            backdropFilter: 'blur(4px)',
            maskImage: 'linear-gradient(0deg, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0) 100%)',
            WebkitMaskImage: 'linear-gradient(0deg, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0) 100%)'
          }}
        />
      </div>
      
      {/* Hide scrollbar CSS */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
