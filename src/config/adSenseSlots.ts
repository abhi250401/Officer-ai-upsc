// Google AdSense Slot IDs Configuration
// Organized by placement type and location

export const ADSENSE_SLOTS = {
  // In-article placements
  inArticle: '5810926570', // In-article ads
  
  // Sidebar top placements
  sidebarTop1: '2225649145',
  sidebarTop2: '9887574798',
  sidebarTop3: '2200656464',
  
  // Main content area
  mainBlog: '7315868888',
  
  // Sidebar right
  sidebarRight1: '9300949148',
  
  // Various placements
  adsGeneral: '5361704136',
  sidebarBottom1: '7992996083',
  sidebarBottom2: '8096937867',
  
  // Named ads
  ad1: '6827663191',
  ad2: '9454337281',
  
  // Alternative placements
  sidebarBottom3: '9454337281',
  sidebarBottom4: '6783856198',
  sidebarBottom5: '9410019535',
} as const;

// Ad format recommendations for each location
export const AD_PLACEMENTS = {
  'top-feed': {
    slot: ADSENSE_SLOTS.mainBlog,
    format: 'auto' as const,
    description: 'Top of home feed'
  },
  'between-articles': {
    slot: ADSENSE_SLOTS.inArticle,
    format: 'horizontal' as const,
    description: 'Between article cards'
  },
  'search-results': {
    slot: ADSENSE_SLOTS.sidebarTop1,
    format: 'auto' as const,
    description: 'Search results area'
  },
  'daily-brief': {
    slot: ADSENSE_SLOTS.sidebarTop2,
    format: 'horizontal' as const,
    description: 'Daily brief section'
  },
  'revision-cards': {
    slot: ADSENSE_SLOTS.sidebarTop3,
    format: 'auto' as const,
    description: 'Revision cards section'
  },
  'article-detail-top': {
    slot: ADSENSE_SLOTS.sidebarRight1,
    format: 'auto' as const,
    description: 'Top of article detail view'
  },
  'article-detail-bottom': {
    slot: ADSENSE_SLOTS.adsGeneral,
    format: 'horizontal' as const,
    description: 'Bottom of article detail view'
  },
  'bookmarks-section': {
    slot: ADSENSE_SLOTS.sidebarBottom1,
    format: 'auto' as const,
    description: 'Bookmarks page'
  },
  'learning-path': {
    slot: ADSENSE_SLOTS.sidebarBottom2,
    format: 'vertical' as const,
    description: 'Learning path section'
  },
  'sidebar-general': {
    slot: ADSENSE_SLOTS.ad1,
    format: 'rectangle' as const,
    description: 'General sidebar ad'
  },
  'sidebar-secondary': {
    slot: ADSENSE_SLOTS.ad2,
    format: 'vertical' as const,
    description: 'Secondary sidebar ad'
  },
} as const;
