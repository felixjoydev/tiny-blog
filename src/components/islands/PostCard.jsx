/**
 * PostCard - Display post preview with title, content snippet, and metadata
 * @param {Object} props
 * @param {string} props.postId - Post ID (fallback for URL)
 * @param {string} props.authorHandle - Author's handle
 * @param {string} props.slug - Post slug (preferred for URL)
 * @param {string} props.title - Post title
 * @param {string} props.subtitle - Post subtitle (optional)
 * @param {string} props.content - Post content (will be truncated)
 * @param {number} props.commentCount - Number of comments
 * @param {string} props.createdAt - Post creation date
 */
export default function PostCard({ 
  postId, 
  authorHandle,
  slug,
  title, 
  subtitle, 
  content, 
  commentCount = 0, 
  createdAt 
}) {
  // Truncate title to 110 characters
  const truncateTitle = (text) => {
    if (!text) return '';
    if (text.length <= 110) return text;
    return text.substring(0, 110) + '...';
  };

  // Truncate subtitle to 100 characters
  const truncateSubtitle = (text) => {
    if (!text) return '';
    if (text.length <= 100) return text;
    return text.substring(0, 100) + '...';
  };

  // Truncate content to 24 words
  const truncateContent = (text) => {
    const words = text.split(' ');
    if (words.length <= 24) return text;
    return words.slice(0, 24).join(' ') + '...';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleClick = () => {
    // Save current scroll position before navigating
    sessionStorage.setItem('scrollPosition', window.scrollY.toString());
    sessionStorage.setItem('scrollTimestamp', Date.now().toString());
    
    // Prefer canonical slug URL, fallback to UUID route
    const url = (authorHandle && slug) 
      ? `/u/${authorHandle}/${slug}`
      : `/post/${postId}`;
    
    window.location.href = url;
  };

  return (
    <article
      onClick={handleClick}
      className="cursor-pointer transition-all duration-300"
      style={{
        borderRadius: '1.875rem',
        border: '0.1px solid #D2E5E5',
        background: '#FFF1D5',
        boxShadow: '0 0 2px 0 rgba(0, 0, 0, 0.08), 0 4px 4px 0 rgba(128, 128, 128, 0.08), 0 2px 2px 0 rgba(128, 128, 128, 0.08), 0 1px 1px 0 rgba(128, 128, 128, 0.08)',
        padding: '1.5rem'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 0 4px 0 rgba(0, 0, 0, 0.10), 0 8px 12px 0 rgba(128, 128, 128, 0.12), 0 4px 6px 0 rgba(128, 128, 128, 0.10), 0 2px 4px 0 rgba(128, 128, 128, 0.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 0 2px 0 rgba(0, 0, 0, 0.08), 0 4px 4px 0 rgba(128, 128, 128, 0.08), 0 2px 2px 0 rgba(128, 128, 128, 0.08), 0 1px 1px 0 rgba(128, 128, 128, 0.08)';
      }}
    >
      {/* Title */}
      <h3 className="font-['Exposure[-40]:Regular',sans-serif] text-[#3f331c] text-2xl tracking-tight mb-2 break-words">
        {truncateTitle(title)}
      </h3>

      {/* Subtitle */}
      {subtitle && (
        <p className="font-['Exposure[-20]:Regular',sans-serif] text-[#786237] text-lg mb-3 break-words">
          {truncateSubtitle(subtitle)}
        </p>
      )}

      {/* Date and Comment Count */}
      <div className="flex items-center gap-4 mb-4">
        <span className="font-['Exposure[-10]:Regular',sans-serif] text-[#786237] text-sm">
          {formatDate(createdAt)}
        </span>
        <div className="flex items-center gap-1.5">
          <svg 
            className="w-4 h-4" 
            viewBox="0 0 16 16" 
            fill="none"
          >
            <g clipPath="url(#clip0_1_63)">
              <path 
                d="M0.666687 6.68521C0.666687 3.36345 3.3508 0.666687 6.66669 0.666687C9.98257 0.666687 12.6667 3.36345 12.6667 6.68521C12.6667 10.007 9.98257 12.7037 6.66669 12.7037C5.89454 12.7037 5.15517 12.5571 4.47577 12.2897L2.22902 13.277C1.99573 13.3795 1.72441 13.3401 1.52996 13.1754C1.3355 13.0107 1.25193 12.7496 1.31464 12.5026L1.87263 10.3048C1.11571 9.29738 0.666687 8.04307 0.666687 6.68521Z" 
                fill="#786237"
              />
              <path 
                d="M14 8.82057C14 8.0498 13.9632 7.45592 13.728 6.94598L14.9387 6.38747C15.3095 7.19121 15.3334 8.0557 15.3334 8.82057C15.3334 10.151 14.8845 11.3786 14.1299 12.3641L14.6845 14.4991C14.7485 14.7454 14.6666 15.0067 14.4736 15.1725C14.2806 15.3383 14.01 15.3797 13.7761 15.2793L11.5245 14.3122C10.8448 14.5744 10.1054 14.718 9.33335 14.718V13.3847C10.0216 13.3847 10.6731 13.2394 11.259 12.9794C11.4287 12.9041 11.622 12.9029 11.7925 12.9762L13.0518 13.5171L12.7546 12.3728C12.6994 12.1604 12.7523 11.9346 12.8959 11.7687C13.586 10.9719 14 9.94364 14 8.82057Z" 
                fill="#786237"
              />
            </g>
            <defs>
              <clipPath id="clip0_1_63">
                <rect width="16" height="16" fill="white"/>
              </clipPath>
            </defs>
          </svg>
          <span className="font-['Exposure[-10]:Regular',sans-serif] text-[#3f331c] text-sm">
            {commentCount}
          </span>
        </div>
      </div>

      {/* Content snippet */}
      <p className="font-['Exposure[-10]:Regular',sans-serif] text-[#3f331c] text-base leading-relaxed mb-4 break-words">
        {truncateContent(content)}
      </p>

      {/* Read more link */}
      {/* <a 
        href={`/post/${postId}`}
        className="font-['Exposure[-20]:Regular',sans-serif] text-[#da5700] text-base hover:underline inline-block"
        onClick={(e) => e.stopPropagation()}
      >
        Read more
      </a> */}
    </article>
  );
}
