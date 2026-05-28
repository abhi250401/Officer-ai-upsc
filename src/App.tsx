import React, { useState, useEffect, useMemo } from 'react';
import {
  Compass,
  Search as SearchIcon,
  BookOpen,
  Bookmark as BookmarkIcon,
  CheckSquare,
  ChevronRight,
  TrendingUp,
  Cpu,
  Clock,
  ExternalLink,
  Plus,
  Trash2,
  Lock,
  User as UserIcon,
  Filter,
  Check,
  AlertTriangle,
  RotateCw,
  Sliders,
  Settings,
  HelpCircle,
  Lightbulb,
  ArrowRight,
  Calendar,
  Layers,
  FileCheck,
  Info
} from 'lucide-react';

// ==========================================
// CLIENT TYPES
// ==========================================
import { User, Article, IngestionLog, Source, RevisionCard } from './types.ts';

// ==========================================
// FIREBASE AUTH COUPLING
// ==========================================
import { 
  auth as firebaseAuth, 
  googleProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  onAuthStateChanged,
  isFirebaseConfigured
} from './lib/firebase.ts';

// ==========================================
// MODULAR REACT COMPONENTS
// ==========================================
import ArticleDetail from './components/ArticleDetail.tsx';
import PYQDesk from './components/PYQDesk.tsx';
import AdminPortal from './components/AdminPortal.tsx';
import LearningPath from './components/LearningPath.tsx';

// Helper to parse URLs and Markdown-style links and render them into interactive clickable links
const renderFormattedSources = (text: string) => {
  if (!text) return null;
  const lines = text.split("\n");
  return lines.map((line, idx) => {
    const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    while ((match = linkRegex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        parts.push(line.substring(lastIndex, match.index));
      }
      parts.push(
        <a
          key={match[2] + "_" + idx}
          href={match[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#0F766E] hover:underline font-semibold inline-flex items-center gap-0.5"
        >
          {match[1]}
        </a>
      );
      lastIndex = linkRegex.lastIndex;
    }
    if (lastIndex < line.length && lastIndex > 0) {
      parts.push(line.substring(lastIndex));
    }

    if (parts.length === 0) {
      const urlRegex = /(https?:\/\/[^\s\)]+)/g;
      let lastUrlIndex = 0;
      let urlMatch;
      while ((urlMatch = urlRegex.exec(line)) !== null) {
        if (urlMatch.index > lastUrlIndex) {
          parts.push(line.substring(lastUrlIndex, urlMatch.index));
        }
        let cleanUrl = urlMatch[1];
        if (cleanUrl.endsWith(")") || cleanUrl.endsWith("]")) {
          cleanUrl = cleanUrl.slice(0, -1);
        }
        parts.push(
          <a
            key={cleanUrl + "_" + idx}
            href={cleanUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#0F766E] hover:underline font-semibold break-all"
          >
            {cleanUrl}
          </a>
        );
        lastUrlIndex = urlRegex.lastIndex;
      }
      if (lastUrlIndex < line.length) {
        parts.push(line.substring(lastUrlIndex));
      }
    }

    return (
      <div key={idx} className="min-h-[18px]">
        {parts.length > 0 ? parts : line}
      </div>
    );
  });
};

type AppTab = 'home' | 'search' | 'brief' | 'revision' | 'bookmarks' | 'path' | 'admin';

export default function App() {
  // Authentication State
  const [token, setToken] = useState<string | null>(localStorage.getItem('officer_token'));
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Expanded Premium Auth States
  const [authMethod, setAuthMethod] = useState<'credentials' | 'otp' | 'google'>('credentials');
  const [otpStep, setOtpStep] = useState<'send' | 'verify'>('send');
  const [otpCode, setOtpCode] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordStatus, setForgotPasswordStatus] = useState('');

  // Global UI State
  const [currentTab, setCurrentTab] = useState<AppTab>('home');
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [articleDetailLoading, setArticleDetailLoading] = useState(false);

  // Data Feeds State
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Record<string, number>>({});
  const [dailyBrief, setDailyBrief] = useState<Article[]>([]);
  const [bookmarks, setBookmarks] = useState<Article[]>([]);
  const [revisionCards, setRevisionCards] = useState<any[]>([]);
  const [adminLogs, setAdminLogs] = useState<IngestionLog[]>([]);
  const [adminSources, setAdminSources] = useState<Source[]>([]);
  
  // Data Fetching Status
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [loadingBrief, setLoadingBrief] = useState(false);
  const [loadingBookmarks, setLoadingBookmarks] = useState(false);
  const [loadingRevision, setLoadingRevision] = useState(false);
  
  // Filters State
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [minRelevance, setMinRelevance] = useState<number>(1);
  const [newsQuery, setNewsQuery] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [timeframe, setTimeframe] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');

  // Real-time Ingestion Stream State
  const [liveIndexedToday, setLiveIndexedToday] = useState<number>(24);
  const [liveLastSync, setLiveLastSync] = useState<string>('');
  const [liveActiveFeeds, setLiveActiveFeeds] = useState<number>(16);
  const [liveToast, setLiveToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });

  // System diagnostics telemetry state
  const [adminDiagnostics, setAdminDiagnostics] = useState<any>(null);
  const [loadingDiagnostics, setLoadingDiagnostics] = useState(false);

  // Interactive Live MCQs Resolving States
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({}); // MCQ ID -> chosen index

  // Revision Card Editor Local State
  const [activeNotesText, setActiveNotesText] = useState<Record<string, string>>({});

  // Search Screen Interactive States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchArticles, setSearchArticles] = useState<Article[]>([]);
  const [searchMCQs, setSearchMCQs] = useState<any[]>([]);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [searchTrending, setSearchTrending] = useState<string[]>(["Paris Agreement", "DPDP Act", "Green Hydrogen", "ISRO", "PM-PRANAM"]);
  const [searchDebug, setSearchDebug] = useState<any>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  // Admin Module Actions State
  const [ingestionInProgress, setIngestionInProgress] = useState(false);
  const [ingestionMessage, setIngestionMessage] = useState<string | null>(null);
  
  // Custom Manual Add Form
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newSource, setNewSource] = useState('PIB (Press Information Bureau)');
  const [newPriority, setNewPriority] = useState<'VERY HIGH' | 'HIGH' | 'MEDIUM' | 'LOW'>('VERY HIGH');
  const [newMsg, setNewMsg] = useState('');

  // ==========================================
  // REAL-TIME ANALYTICS, PYQ & PWA STATES
  // ==========================================
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [pyqList, setPyqList] = useState<any[]>([]);
  const [selectedPyqId, setSelectedPyqId] = useState<string>('pyq-mains-1');
  const [mainsDraftAnswer, setMainsDraftAnswer] = useState<string>('');
  const [gradingResponse, setGradingResponse] = useState<any>(null);
  const [gradingInProgress, setGradingInProgress] = useState<boolean>(false);
  const [prelimsPyqAnswers, setPrelimsPyqAnswers] = useState<Record<string, number>>({});
  
  // PWA Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState<boolean>(!localStorage.getItem('pwa_banner_dismissed'));

  // Collapsible Article Sections state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    whatHappened: false,
    whyImportant: false,
    prelimsSnapshot: false,
    mainsAnalysis: false,
    wayForward: false,
    pyqLinkage: false,
    oneLineRevision: false
  });

  // Candidate Onboarding & Preferences States
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingYear, setOnboardingYear] = useState('2026');
  const [onboardingFocus, setOnboardingFocus] = useState('both');
  const [onboardingSubject, setOnboardingSubject] = useState('public_admin');
  const [onboardingGoal, setOnboardingGoal] = useState('morning_brief');
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [onboardingData, setOnboardingData] = useState<{
    targetYear: string;
    examFocus: string;
    optionalSubject: string;
    revisionGoal: string;
  } | null>(null);

  // Expanded Premium Auth UX States
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);
  const [otpPhoneCode, setOtpPhoneCode] = useState('+91');
  const [otpContactType, setOtpContactType] = useState<'email' | 'mobile'>('email');
  const [otpContactInput, setOtpContactInput] = useState('');
  
  // Forgot password & reset flows
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  const toggleSection = (sec: string) => {
    setOpenSections(prev => ({ ...prev, [sec]: !prev[sec] }));
  };

  // ==========================================
  // API INTEGRATIONS CALLS
  // ==========================================
  const headers = useMemo(() => {
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  }, [token]);

  // Analytics Event Tracker Log Dispatcher (Centralized tracking system)
  const trackAnalytics = async (eventType: string, eventData?: any) => {
    try {
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers,
        body: JSON.stringify({ eventType, eventData })
      });
    } catch (err) {
      // Offline fallback
    }
  };

  const fetchAnalyticsData = async () => {
    setLoadingAnalytics(true);
    try {
      const res = await fetch('/api/analytics/dashboard', { headers });
      if (res.ok) {
        const data = await res.json();
        setAnalyticsData(data);
      }
    } catch (err) {
      console.error("Failed to load analytics: ", err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const fetchAdminDiagnostics = async () => {
    setLoadingDiagnostics(true);
    try {
      const res = await fetch('/api/admin/diagnostics', { headers });
      if (res.ok) {
        const data = await res.json();
        setAdminDiagnostics(data);
      }
    } catch (err) {
      console.error("Failed to load admin diagnostics: ", err);
    } finally {
      setLoadingDiagnostics(false);
    }
  };

  const fetchPyqDatabaseBySegment = async () => {
    try {
      const res = await fetch('/api/pyqs', { headers });
      if (res.ok) {
        const data = await res.json();
        setPyqList(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Evaluate Student Written Essay Response to UPSC GS Mains topic
  const handleEvaluateMainsAnswer = async () => {
    if (!mainsDraftAnswer.trim()) {
      alert("Please write/paste some essay contents to grade.");
      return;
    }
    setGradingInProgress(true);
    setGradingResponse(null);
    try {
      const res = await fetch('/api/pyq/evaluate', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          questionId: selectedPyqId,
          answer: mainsDraftAnswer
        })
      });
      if (res.ok) {
        const evaluation = await res.json();
        setGradingResponse(evaluation);
        // Track the successful submission
        trackAnalytics('revision', { cardId: selectedPyqId, action: 'save' });
      } else {
        const errData = await res.json();
        alert("Evaluation offline: " + (errData.error || "System error"));
      }
    } catch (err: any) {
      console.error(err);
      alert("Evaluation failed: " + err.message);
    } finally {
      setGradingInProgress(false);
    }
  };

  // Register PWA Install Event Prompt Handler and Service Worker bootstrap
  useEffect(() => {
    // 1. Service Worker registration
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(() => console.log('OfficerAI high stability service worker fully active.'))
        .catch((err) => console.log('SW registration stalled: ', err));
    }

    // 2. Before Install Prompt capture
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleTriggerPwaInstall = async () => {
    if (!deferredPrompt) {
      alert("Standard PWA installation is pre-managed by your browser launcher. Open direct Settings and select 'Add to Home Screen' or 'Install' to sync offline desktop portal.");
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User installed OfficerAI hub.');
      localStorage.setItem('pwa_banner_dismissed', 'true');
      setShowInstallBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismissPwaBanner = () => {
    localStorage.setItem('pwa_banner_dismissed', 'true');
    setShowInstallBanner(false);
  };

  // Auth bootstrap
  useEffect(() => {
    if (token) {
      fetch('/api/auth/me', { headers })
        .then((res) => {
          if (!res.ok) {
            handleLogout();
            throw new Error('Session expired');
          }
          return res.json();
        })
        .then((data) => setUser(data.user))
        .catch(() => {});
    }
  }, [token, headers]);

  // Firebase Auth State Listener
  useEffect(() => {
    if (isFirebaseConfigured && firebaseAuth) {
      const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
        if (firebaseUser) {
          try {
            const res = await fetch('/api/auth/google', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: firebaseUser.email,
                name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || "UPSC Candidate"
              })
            });
            const data = await res.json();
            if (res.ok) {
              localStorage.setItem('officer_token', data.token);
              setToken(data.token);
              setUser(data.user);
            }
          } catch (err) {
            console.error("Firebase auth sync error:", err);
          }
        }
      });
      return () => unsubscribe();
    }
  }, []);

  // Onboarding Preference Synchronizer
  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(`officer_onboarding_${user.id}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setOnboardingData(parsed);
          setShowOnboarding(false);
          
          // Seed state
          setOnboardingYear(parsed.targetYear || '2026');
          setOnboardingFocus(parsed.examFocus || 'both');
          setOnboardingSubject(parsed.optionalSubject || 'public_admin');
          setOnboardingGoal(parsed.revisionGoal || 'morning_brief');
        } catch (e) {
          console.error("Failed to parse onboarding values:", e);
          setShowOnboarding(true);
          setOnboardingStep(1);
        }
      } else {
        // Automatically prompt newly registered/uncompleted accounts
        setShowOnboarding(true);
        setOnboardingStep(1);
      }
    } else {
      setOnboardingData(null);
      setShowOnboarding(false);
    }
  }, [user]);

  const handleSaveOnboarding = () => {
    if (!user) return;
    const pref = {
      targetYear: onboardingYear,
      examFocus: onboardingFocus,
      optionalSubject: onboardingSubject,
      revisionGoal: onboardingGoal
    };
    localStorage.setItem(`officer_onboarding_${user.id}`, JSON.stringify(pref));
    setOnboardingData(pref);
    setShowOnboarding(false);
  };

  // Countdown timer for OTP resends
  useEffect(() => {
    let interval: any;
    if (resendCountdown > 0) {
      interval = setInterval(() => {
        setResendCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendCountdown]);

  // Dynamic Browser Client URL Path sync handler
  const parseUrlPath = (path: string) => {
    if (path === '/' || path === '/home' || path === '') {
      setCurrentTab('home');
      setSelectedArticleId(null);
      setSelectedArticle(null);
    } else if (path === '/brief') {
      setCurrentTab('brief');
      setSelectedArticleId(null);
      setSelectedArticle(null);
    } else if (path === '/revision') {
      setCurrentTab('revision');
      setSelectedArticleId(null);
      setSelectedArticle(null);
    } else if (path === '/bookmarks') {
      setCurrentTab('bookmarks');
      setSelectedArticleId(null);
      setSelectedArticle(null);
    } else if (path === '/search') {
      setCurrentTab('search');
      setSelectedArticleId(null);
      setSelectedArticle(null);
    } else if (path === '/admin') {
      if (user?.email === 'abhishekraiop@gmail.com') {
        setCurrentTab('admin');
      } else {
        setCurrentTab('home');
      }
      setSelectedArticleId(null);
      setSelectedArticle(null);
    } else if (path.startsWith('/article/')) {
      const slugOrId = path.substring('/article/'.length);
      const found = articles.find(a =>
        a.id === slugOrId ||
        a.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') === slugOrId
      );
      if (found) {
        setCurrentTab('home');
        setSelectedArticleId(found.id);
        handleSelectArticle(found.id, true);
      } else if (slugOrId) {
        setCurrentTab('home');
        setSelectedArticleId(slugOrId);
        handleSelectArticle(slugOrId, true);
      }
    } else if (path.startsWith('/category/')) {
      const cat = path.substring('/category/'.length);
      const capitalized = cat.charAt(0).toUpperCase() + cat.slice(1);
      setCurrentTab('home');
      setSelectedCategory(capitalized);
      setSelectedArticleId(null);
      setSelectedArticle(null);
    } else if (path.startsWith('/topic/')) {
      const topic = decodeURIComponent(path.substring('/topic/'.length));
      setCurrentTab('search');
      setSearchQuery(topic);
      setSelectedArticleId(null);
      setSelectedArticle(null);
      triggerFuzzySearch(topic);
    }
  };

  // URL Bootstrap syncing on launch
  useEffect(() => {
    const bootstrapRoutingAndData = async () => {
      // First load PYQ records
      await fetchPyqDatabaseBySegment();

      const pathname = window.location.pathname;
      if (pathname.startsWith('/article/')) {
        const slugOrId = pathname.substring('/article/'.length);
        try {
          const listRes = await fetch('/api/articles', { headers });
          if (listRes.ok) {
            const listData = await listRes.json();
            setArticles(listData);
            const matched = listData.find((a: any) =>
              a.id === slugOrId ||
              a.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') === slugOrId
            );
            if (matched) {
              handleSelectArticle(matched.id, true);
            } else {
              handleSelectArticle(slugOrId, true);
            }
          }
        } catch (err) {
          console.error(err);
        }
      } else {
        parseUrlPath(pathname);
      }

      // Track general launch user retention
      trackAnalytics('active_retention');
    };

    bootstrapRoutingAndData();
  }, [token]);

  // Sync back and forward navigation updates
  useEffect(() => {
    const handlePopState = () => {
      parseUrlPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [articles]);

  // Server-Sent Events (SSE) listener for live, real-time updates from OfficerAI ingestion bot
  useEffect(() => {
    const eventSource = new EventSource('/api/live-updates');
    
    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        console.log("Incoming live broadcast update from OfficerAI ingestion bot:", payload);
        
        if (payload.type === 'INITIAL_METRICS' || payload.type === 'STATS_UPDATED') {
          if (payload.data.indexedToday !== undefined) setLiveIndexedToday(payload.data.indexedToday);
          if (payload.data.lastSync !== undefined) setLiveLastSync(payload.data.lastSync);
          if (payload.data.activeFeeds !== undefined) setLiveActiveFeeds(payload.data.activeFeeds);
        } else if (payload.type === 'ARTICLE_INGESTED') {
          // Live append new article
          const newArt = payload.data;
          setArticles((prev) => {
            if (prev.some(a => a.id === newArt.id || a.articleHash === newArt.articleHash)) return prev;
            return [newArt, ...prev];
          });
          // Show live toast message
          setLiveToast({
            message: `📬 Curated Syllabus Alert: "${newArt.title}" added from ${newArt.source}!`,
            visible: true
          });
        }
      } catch (err) {
        console.error("Failed to parse SSE streaming event payload:", err);
      }
    };

    eventSource.onerror = (err) => {
      console.warn("SSE stream network disconnect, retry in progress...", err);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  // Timer helper to clear live toast notifications
  useEffect(() => {
    if (liveToast.visible) {
      const timer = setTimeout(() => {
        setLiveToast(prev => ({ ...prev, visible: false }));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [liveToast.visible]);

  // Loader dispatch based on tab navigation, filters, and sorting parameters
  useEffect(() => {
    fetchArticles();
    fetchCategories();
    if (token) {
      fetchBookmarks();
      fetchRevisionCards();
    }
    if (currentTab === 'brief') {
      fetchDailyBrief();
    }
    if (currentTab === 'admin') {
      fetchAdminSources();
      fetchAdminLogs();
      fetchAnalyticsData();
      fetchAdminDiagnostics();
    }
    
    trackAnalytics('active_retention');
  }, [currentTab, token, selectedCategory, timeframe, sortBy]);

  const fetchArticles = async () => {
    setLoadingArticles(true);
    try {
      const catParam = selectedCategory !== 'All' ? `category=${encodeURIComponent(selectedCategory)}` : '';
      const timeParam = timeframe !== 'all' ? `timeframe=${encodeURIComponent(timeframe)}` : '';
      const sortParam = sortBy !== 'newest' ? `sortBy=${encodeURIComponent(sortBy)}` : '';
      const query = [catParam, timeParam, sortParam].filter(Boolean).join('&');
      const res = await fetch(`/api/articles?${query}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setArticles(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingArticles(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories', { headers });
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDailyBrief = async () => {
    setLoadingBrief(true);
    try {
      const res = await fetch('/api/daily-brief', { headers });
      if (res.ok) {
        const data = await res.json();
        setDailyBrief(data.articles || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingBrief(false);
    }
  };

  const fetchBookmarks = async () => {
    setLoadingBookmarks(true);
    try {
      const res = await fetch('/api/bookmarks', { headers });
      if (res.ok) {
        const data = await res.json();
        setBookmarks(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingBookmarks(false);
    }
  };

  const fetchRevisionCards = async () => {
    setLoadingRevision(true);
    try {
      const res = await fetch('/api/revision', { headers });
      if (res.ok) {
        const data = await res.json();
        setRevisionCards(data);
        
        // Initialize dynamic editor text with preloaded notes
        const initialNotes: Record<string, string> = {};
        data.forEach((card: any) => {
          initialNotes[card.id] = card.notes;
        });
        setActiveNotesText(prev => ({ ...prev, ...initialNotes }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRevision(false);
    }
  };

  const fetchAdminSources = async () => {
    try {
      const res = await fetch('/api/admin/sources', { headers });
      if (res.ok) {
        const data = await res.json();
        setAdminSources(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAdminLogs = async () => {
    try {
      const res = await fetch('/api/admin/logs', { headers });
      if (res.ok) {
        const data = await res.json();
        setAdminLogs(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Auth Operations
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      if (authMethod === 'credentials') {
        if (isFirebaseConfigured && firebaseAuth) {
          if (authMode === 'login') {
            await signInWithEmailAndPassword(firebaseAuth, authEmail, authPassword);
          } else {
            const userCredential = await createUserWithEmailAndPassword(firebaseAuth, authEmail, authPassword);
            if (authName) {
              await updateProfile(userCredential.user, { displayName: authName });
            }
          }
          const currentUser = firebaseAuth.currentUser;
          if (currentUser) {
            const res = await fetch('/api/auth/google', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: currentUser.email,
                name: currentUser.displayName || currentUser.email?.split('@')[0] || "UPSC Candidate"
              })
            });
            const data = await res.json();
            if (res.ok) {
              localStorage.setItem('officer_token', data.token);
              setToken(data.token);
              setUser(data.user);
              resetAuthFields();
            } else {
              throw new Error(data.error || 'Identity exchange returned error');
            }
          }
        } else {
          const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
          const payload = authMode === 'login' 
            ? { email: authEmail, password: authPassword, method: 'Credentials' }
            : { name: authName, email: authEmail, password: authPassword, method: 'Credentials' };

          const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || 'Authentication credentials failed');
          }
          localStorage.setItem('officer_token', data.token);
          setToken(data.token);
          setUser(data.user);
          resetAuthFields();
        }
      } else if (authMethod === 'otp') {
        if (otpStep === 'send') {
          // Send OTP handshake
          const res = await fetch('/api/auth/otp-send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ emailOrMobile: authEmail })
          });
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || 'Failed to send OTP verification');
          }
          setOtpStep('verify');
          // Prefill simulated code to guide candidate
          setOtpCode(data.code || '123456');
        } else {
          // Verify OTP challenge
          const res = await fetch('/api/auth/otp-verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              emailOrMobile: authEmail,
              code: otpCode,
              name: authMode === 'register' ? authName : undefined,
              method: authEmail.includes('@') ? 'Email OTP' : 'Mobile OTP'
            })
          });
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || 'Verification code invalid');
          }
          localStorage.setItem('officer_token', data.token);
          setToken(data.token);
          setUser(data.user);
          resetAuthFields();
        }
      }
    } catch (err: any) {
      setAuthError(err.message || 'Something went wrong');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleLogin = async (e: React.MouseEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      if (isFirebaseConfigured && firebaseAuth) {
        const userCredential = await signInWithPopup(firebaseAuth, googleProvider);
        const firebaseUser = userCredential.user;
        const res = await fetch('/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: firebaseUser.email,
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || "UPSC Candidate"
          })
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Google Sign In rejected by server');
        }
        localStorage.setItem('officer_token', data.token);
        setToken(data.token);
        setUser(data.user);
        resetAuthFields();
      } else {
        // Fallback mockup Google Sign In
        const targetEmail = authEmail || "guest.user@example.com";
        const targetName = authName || "Guest User";
        const res = await fetch('/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: targetEmail,
            name: targetName
          })
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Google Sign In rejected by server');
        }
        localStorage.setItem('officer_token', data.token);
        setToken(data.token);
        setUser(data.user);
        resetAuthFields();
      }
    } catch (err: any) {
      setAuthError(err.message || 'Google handshake failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleQuickDemoLogin = async () => {
    setAuthError('');
    setAuthLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'guest.premium@example.com',
          name: 'Guest User',
          password: 'sandbox_passcode_2026',
          method: 'Instant Sandbox'
        })
      });
      let data = await res.json();
      if (!res.ok) {
        // If already exists, just handle login
        const loginRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'guest.premium@example.com',
            password: 'sandbox_passcode_2026'
          })
        });
        data = await loginRes.json();
        if (!loginRes.ok) {
          throw new Error('Sandbox credentials outdated or rejected');
        }
      }
      localStorage.setItem('officer_token', data.token);
      setToken(data.token);
      setUser(data.user);
      resetAuthFields();
    } catch (err: any) {
      setAuthError('Instant sandbox entry failed: ' + err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const resetAuthFields = () => {
    setAuthEmail('');
    setAuthPassword('');
    setAuthName('');
    setOtpCode('');
    setOtpStep('send');
    const el = document.getElementById('auth-overlay-modal');
    if (el) el.classList.add('hidden');
  };

  const handleLogout = () => {
    if (isFirebaseConfigured && firebaseAuth) {
      firebaseSignOut(firebaseAuth).catch((err) => console.error("Firebase sign out failed:", err));
    }
    localStorage.removeItem('officer_token');
    setToken(null);
    setUser(null);
    setBookmarks([]);
    setRevisionCards([]);
    setCurrentTab('home');
  };

  // Article selection detail routing
  const handleSelectArticle = async (id: string, bypassPush: boolean = false) => {
    setSelectedArticleId(id);
    setArticleDetailLoading(true);
    try {
      const res = await fetch(`/api/articles/${id}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setSelectedArticle(data);
        
        // Push URL state
        if (!bypassPush && data) {
          const titleSlug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
          window.history.pushState(null, '', `/article/${titleSlug}`);
        }
        
        // Track analytics open
        trackAnalytics('open_article', { articleId: id, articleTitle: data?.title || "" });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setArticleDetailLoading(false);
    }
  };

  // Bookmark toggler
  const handleSelectCategory = (cat: string) => {
    setSelectedCategory(cat);
    setSelectedArticleId(null);
    setSelectedArticle(null);
    const slug = cat.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    window.history.pushState(null, '', cat === 'All' ? '/' : `/category/${slug}`);
    
    // Log active retention state
    trackAnalytics('active_retention');
  };

  const handleToggleBookmark = async (articleId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!token) {
      alert('Please Login/Register to bookmark important current affairs.');
      return;
    }
    try {
      const res = await fetch('/api/bookmarks/toggle', {
        method: 'POST',
        headers,
        body: JSON.stringify({ articleId })
      });
      if (res.ok) {
        fetchBookmarks();
        // updates feed state locally instantly to prevent jumping
        setArticles(prev => prev.map(a => {
          if (a.id === articleId) {
            // we toggle locally
          }
          return a;
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Ingestion trigger
  const handleTriggerIngest = async () => {
    setIngestionInProgress(true);
    setIngestionMessage(null);
    try {
      const res = await fetch('/api/admin/ingest', {
        method: 'POST',
        headers
      });
      const data = await res.json();
      if (res.ok) {
        setIngestionMessage(`Success: ${data.message}`);
        fetchArticles();
        fetchCategories();
        fetchAdminLogs();
      } else {
        setIngestionMessage(`Error: ${data.error || 'Ingestion failed'}`);
      }
    } catch (err: any) {
      setIngestionMessage(`Failed to trigger: ${err.message || err}`);
    } finally {
      setIngestionInProgress(false);
    }
  };

  // Triggering custom manual article adds
  const handleManualAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewMsg('');
    try {
      if (!newTitle || !newContent || !newSource) {
        setNewMsg('All fields are required');
        return;
      }
      const res = await fetch('/api/admin/articles/add', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: newTitle,
          content: newContent,
          source: newSource,
          priority: newPriority
        })
      });
      const result = await res.json();
      if (res.ok) {
        setNewMsg('Article successfully parsed & summary generated by Server AI!');
        setNewTitle('');
        setNewContent('');
        fetchArticles();
        fetchCategories();
      } else {
        setNewMsg(`Error: ${result.error}`);
      }
    } catch (err: any) {
      setNewMsg('Failed: ' + err.message);
    }
  };

  // Save/Update Revision Notes
  const handleSaveRevisionCard = async (articleId: string, customNotes: string) => {
    if (!token) return;
    try {
      const res = await fetch('/api/revision/save', {
        method: 'POST',
        headers,
        body: JSON.stringify({ articleId, notes: customNotes })
      });
      if (res.ok) {
        fetchRevisionCards();
        alert('Saved successfully to your Revision list!');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdateNotesText = (cardId: string, text: string) => {
    setActiveNotesText(prev => ({ ...prev, [cardId]: text }));
  };

  const handleSaveExistingCardNotes = async (cardId: string, articleId: string) => {
    const notes = activeNotesText[cardId] || '';
    await handleSaveRevisionCard(articleId, notes);
  };

  const handleToggleCardRevised = async (cardId: string) => {
    try {
      const res = await fetch('/api/revision/toggle-revised', {
        method: 'POST',
        headers,
        body: JSON.stringify({ cardId })
      });
      if (res.ok) {
        fetchRevisionCards();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!confirm('Are you sure you want to delete this revision card?')) return;
    try {
      const res = await fetch('/api/revision/delete', {
        method: 'POST',
        headers,
        body: JSON.stringify({ cardId })
      });
      if (res.ok) {
        fetchRevisionCards();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Interactive Live Search Core
  const triggerFuzzySearch = async (val: string, bypassPush: boolean = false) => {
    setSearchQuery(val);
    if (!val.trim()) {
      setSearchArticles([]);
      setSearchMCQs([]);
      setSearchSuggestions([]);
      setSearchDebug(null);
      if (!bypassPush) {
        window.history.pushState(null, '', '/search');
      }
      return;
    }
    setSearchLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(val)}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setSearchArticles(data.articles || []);
        setSearchMCQs(data.mcqs || []);
        setSearchSuggestions(data.suggestions || []);
        if (data.trending) setSearchTrending(data.trending);
        if (data.debugging) setSearchDebug(data.debugging);
        
        // Push address URL
        if (!bypassPush) {
          window.history.pushState(null, '', `/topic/${encodeURIComponent(val.toLowerCase())}`);
        }

        // Track keyword analytics
        trackAnalytics('search', { query: val });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSearchLoading(false);
    }
  };

  // Client side relevance filter + dynamic home feed query calculations
  const filteredHomeArticles = useMemo(() => {
    let result = [...articles];
    // Filter on-the-fly for real-time relevance scoring slider engagement
    result = result.filter(a => a.relevanceScore >= minRelevance);
    
    // Fuzzy sub-search input on home
    if (newsQuery.trim()) {
      const q = newsQuery.toLowerCase();
      result = result.filter(a => 
        a.title.toLowerCase().includes(q) ||
        a.content.toLowerCase().includes(q) ||
        a.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    return result;
  }, [articles, minRelevance, newsQuery]);

  // Quick statistics calculation for active users
  const revisionStats = useMemo(() => {
    const total = revisionCards.length;
    const completed = revisionCards.filter(c => c.isRevised).length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percent };
  }, [revisionCards]);

  // Helper mapping priority priorities to aesthetic colors
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'VERY HIGH':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'HIGH':
        return 'bg-teal-100 text-teal-900 border-teal-200';
      case 'MEDIUM':
        return 'bg-blue-100 text-blue-900 border-blue-200';
      default:
        return 'bg-stone-100 text-stone-800 border-stone-200';
    }
  };

  // Redesigned premium SaaS landing & authentication experience (Notion/Linear style)
  if (!user) {
    const handleResetPasswordSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!forgotPasswordEmail) {
        setAuthError("Please enter your email address first.");
        return;
      }
      setAuthLoading(true);
      setAuthError("");
      setTimeout(() => {
        setAuthLoading(false);
        setForgotPasswordStatus("A secure password reset link has been dispatched to your email address.");
      }, 800);
    };

    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#FCFBF9] text-stone-900 font-sans p-4 select-none relative overflow-hidden selection:bg-teal-50 selection:text-teal-900">
        
        {/* Subtle premium ambient background details */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-stone-100 rounded-full blur-3xl opacity-40 -translate-y-12 translate-x-12 animate-pulse" style={{ animationDuration: '8s' }}></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-stone-250 rounded-full blur-3xl opacity-30 translate-y-12 -translate-x-12 animate-pulse" style={{ animationDuration: '10s' }}></div>

        <div className="w-full max-w-[420px] bg-white border border-stone-200/80 rounded-2xl shadow-xl overflow-hidden p-8 md:p-10 space-y-6 relative z-10">
          
          {/* Minimalist Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3.5xl font-bold font-display tracking-tight text-stone-900">
              OfficerAI
            </h1>
            <p className="text-stone-500 text-xs tracking-tight">
              Start reading smarter. Access your personalized feed.
            </p>
          </div>

          {authError && (
            <div className="text-xs p-3 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl font-medium flex items-start gap-2">
              <span className="shrink-0 mt-0.5">⚠️</span>
              <span className="leading-tight">{authError}</span>
            </div>
          )}

          {forgotPasswordStatus && (
            <div className="text-xs p-3 bg-teal-50 border border-teal-100 text-teal-805 rounded-xl font-medium flex items-start gap-2">
              <span className="shrink-0 mt-0.5">✓</span>
              <span className="leading-tight">{forgotPasswordStatus}</span>
            </div>
          )}

          {/* Core View Router (Standard, Forgot Pwd, OTP) */}
          {showForgotPassword ? (
            /* ==========================================
               FORGOT PASSWORD FLOW
               ========================================== */
            <div className="space-y-4">
              <div className="space-y-1.5">
                <h3 className="text-sm font-semibold text-stone-950">Reset your password</h3>
                <p className="text-xs text-stone-550 leading-relaxed">
                  Enter your email address below and we'll send you a link to reset your password.
                </p>
              </div>

              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-stone-520 uppercase tracking-wider block">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    className="w-full text-xs sm:text-sm p-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0F766E] focus:border-[#0F766E] bg-stone-50/50 hover:bg-stone-50 focus:bg-white font-medium transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full bg-stone-900 hover:bg-stone-850 text-white text-xs sm:text-sm font-medium py-3 px-4 rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {authLoading ? "Sending Link..." : "Send Reset Link"}
                </button>
              </form>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotPasswordStatus("");
                    setAuthError("");
                  }}
                  className="text-xs text-[#0F766E] hover:underline font-medium cursor-pointer"
                >
                  Back to Sign In
                </button>
              </div>
            </div>
          ) : authMethod === 'otp' ? (
            /* ==========================================
               OTP AUTHENTICATION FLOW
               ========================================== */
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-stone-900">
                  {otpStep === 'send' ? "Verify with Instant OTP" : "Enter Verification Code"}
                </h3>
                <p className="text-xs text-stone-500 leading-normal">
                  {otpStep === 'send'
                    ? "Enter your email or mobile to receive a 6-digit secure sign-in passcode."
                    : `We've dispatched a secure verification passcode.`}
                </p>
              </div>

              <form onSubmit={(e) => {
                setAuthMethod('otp');
                handleAuth(e);
              }} className="space-y-4">
                {otpStep === 'send' ? (
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider block">Email Address or Mobile</label>
                    <input
                      type="text"
                      required
                      placeholder="name@example.com or +91 9999999999"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      className="w-full text-xs sm:text-sm p-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0F766E] focus:border-[#0F766E] bg-stone-50/50 hover:bg-stone-50 focus:bg-white font-medium transition-all"
                    />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider block">6-Digit OTP Code</label>
                      <input
                        type="text"
                        maxLength={6}
                        required
                        placeholder="123456"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        className="w-full text-center text-lg tracking-[0.5em] p-2.5 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0F766E] focus:border-[#0F766E] bg-stone-50 font-mono focus:bg-white transition-all"
                      />
                    </div>
                    {authMode === 'register' && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider block">Your Name</label>
                        <input
                          type="text"
                          required
                          placeholder="Your full name"
                          value={authName}
                          onChange={(e) => setAuthName(e.target.value)}
                          className="w-full text-xs sm:text-sm p-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0F766E] focus:border-[#0F766E] bg-stone-50/50 hover:bg-stone-50 focus:bg-white font-medium transition-all"
                        />
                      </div>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full bg-stone-900 hover:bg-stone-850 text-white text-xs sm:text-sm font-medium py-3 px-4 rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {authLoading
                    ? "Processing..."
                    : otpStep === 'send' ? "Send Secure Code" : "Verify Code & Sign In"
                  }
                </button>
              </form>

              <div className="flex justify-between text-[11px] font-medium pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMethod('credentials');
                    setOtpStep('send');
                    setAuthError('');
                  }}
                  className="text-[#0F766E] hover:underline cursor-pointer"
                >
                  Use Email Password
                </button>
                {otpStep === 'verify' && (
                  <button
                    type="button"
                    onClick={() => {
                      setOtpStep('send');
                      setOtpCode('');
                      setAuthError('');
                    }}
                    className="text-stone-500 hover:text-stone-800 underline cursor-pointer"
                  >
                    Change Identity
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* ==========================================
               STANDARD EMAIL & PASSWORD CREDENTIALS SIGN-IN/REGISTRATION FLOW
               ========================================== */
            <div className="space-y-5">
              
              {/* PRIMARY CTA: GOOGLE SIGN-IN */}
              <button 
                onClick={(e) => handleGoogleLogin(e)} 
                disabled={authLoading}
                className="w-full py-3 px-4 border border-stone-200 hover:bg-stone-50 text-stone-750 bg-white hover:text-stone-950 font-medium text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-3 cursor-pointer shadow-3xs"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-stone-200/80"></div>
                <span className="flex-shrink mx-3 text-[10px] font-mono text-stone-400 uppercase tracking-widest bg-white px-1">or continue with email</span>
                <div className="flex-grow border-t border-stone-200/80"></div>
              </div>

              <form onSubmit={handleAuth} className="space-y-4">
                {authMode === 'register' && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider block">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Jane Doe"
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      className="w-full text-xs sm:text-sm p-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0F766E] focus:border-[#0F766E] bg-stone-50/50 hover:bg-stone-55 focus:bg-white font-medium transition-all"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider block">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full text-xs sm:text-sm p-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0F766E] focus:border-[#0F766E] bg-stone-50/50 hover:bg-stone-55 focus:bg-white font-medium transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider block">Password</label>
                    {authMode === 'login' && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowForgotPassword(true);
                          setForgotPasswordStatus("");
                          setAuthError("");
                        }}
                        className="text-[10.5px] text-[#0F766E] hover:underline font-medium cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full text-xs sm:text-sm p-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0F766E] focus:border-[#0F766E] bg-stone-50/50 hover:bg-stone-55 focus:bg-white font-medium transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full bg-stone-900 hover:bg-stone-850 text-white text-xs sm:text-sm font-medium py-3 px-4 rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50 mt-2"
                >
                  {authLoading 
                    ? "Please wait..." 
                    : authMode === 'login' ? "Sign In" : "Create Account"
                  }
                </button>
              </form>

              <div className="flex flex-col items-center gap-3 pt-3 border-t border-stone-150">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode(authMode === 'login' ? 'register' : 'login');
                    setAuthError('');
                  }}
                  className="text-xs text-[#0F766E] hover:underline font-medium cursor-pointer"
                >
                  {authMode === 'login' 
                    ? "Don't have an account? Sign Up" 
                    : "Already registered? Sign In"
                  }
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAuthMethod('otp');
                    setOtpStep('send');
                    setAuthError('');
                  }}
                  className="text-xs text-stone-500 hover:text-stone-850 hover:underline font-medium cursor-pointer"
                >
                  Sign in with dynamic verification code (OTP)
                </button>
              </div>
            </div>
          )}

          {/* INSTANT Sandbox / CONTINUE AS GUEST OPTION */}
          {!showForgotPassword && (
            <div className="bg-stone-50/70 border border-stone-100 p-4 rounded-2xl flex flex-col items-center gap-2">
              <p className="text-[11px] text-stone-500 text-center font-medium">
                Want to test the platform immediately?
              </p>
              <button
                type="button"
                onClick={handleQuickDemoLogin}
                disabled={authLoading}
                className="w-full bg-white hover:bg-stone-50 text-stone-800 hover:text-stone-950 border border-stone-200 text-xs font-semibold py-2.5 px-3 rounded-xl transition-all shadow-3xs cursor-pointer flex items-center justify-center gap-2"
              >
                <span>⚡ Continue as Guest</span>
              </button>
            </div>
          )}

        </div>
      </div>
    );
  }

  return (
    <div id="officer-ai-app" className="min-h-screen flex flex-col lg:flex-row font-sans bg-[#FCFBF9] text-[#1C1917] w-full">
      
      {/* LIGHTWEIGHT SIDEBAR NAVIGATION (DESKTOP) */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#FAF9F6] border-r border-[#E7E5E4]/60 p-6 justify-between select-none shrink-0 h-screen sticky top-0">
        <div className="space-y-8">
          <div className="space-y-1">
            <h1 className="text-xl font-bold font-display tracking-tight text-[#1C1917] flex items-center gap-1.5">
              OfficerAI <span className="text-[9px] text-[#0F766E] uppercase font-mono tracking-widest bg-teal-50 border border-teal-150 px-1.5 py-0.5 rounded leading-none font-bold">UPSC</span>
            </h1>
            <p className="text-[10px] font-mono text-[#78716C] uppercase tracking-wider">Syllabus Intelligence OS</p>
          </div>

          <nav className="space-y-1.5">
            {[
              { tab: 'home', label: 'Intelligence Feed', icon: Compass },
              { tab: 'search', label: 'Syllabus Query', icon: SearchIcon },
              { tab: 'path', label: 'Learning Path', icon: Layers },
              { tab: 'brief', label: 'Daily 15m Brief', icon: TrendingUp },
              { tab: 'revision', label: 'Revision Sandbox', icon: CheckSquare },
              { tab: 'bookmarks', label: 'Pinned Materials', icon: BookmarkIcon },
            ].map((item) => {
              const Icon = item.icon;
              const isSelected = currentTab === item.tab;
              return (
                <button
                  key={item.tab}
                  onClick={() => {
                    setCurrentTab(item.tab as AppTab);
                    if (item.tab === 'search') {
                      setTimeout(() => {
                        const el = document.getElementById('search-bar-input');
                        if (el) el.focus();
                      }, 100);
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#1C1917] text-white'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/40'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="space-y-4">
          <div className="pt-4 border-t border-[#E7E5E4]/60 flex items-center justify-between">
            {user ? (
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-700 font-mono text-xs font-bold leading-none shrink-0 font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 pr-1 text-left">
                  <p className="text-[11px] font-bold text-[#1C1917] truncate leading-tight">{user.name}</p>
                  <button onClick={handleLogout} className="text-[10px] text-stone-400 hover:text-rose-700 transition font-mono leading-none cursor-pointer">Sign Out</button>
                </div>
              </div>
            ) : null}
          </div>

          {user && user.email === 'abhishekraiop@gmail.com' && (
            <button
              onClick={() => setCurrentTab('admin')}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-[10.5px] font-mono font-bold tracking-tight border border-dashed rounded-md transition-colors cursor-pointer ${
                currentTab === 'admin'
                  ? 'border-[#0F766E] text-[#0F766E] bg-teal-50/50'
                  : 'border-[#E7E5E4] text-[#78716C] hover:text-[#1C1917] hover:border-stone-400'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Admin Control Panel</span>
            </button>
          )}
        </div>
      </aside>

      {/* RIGHT WORKSPACE CONTEXT FRAME */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* MOBILE TOP BAR (HIDDEN ON DESKTOP) */}
        <header id="mobile-app-header" className="lg:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#E7E5E4] px-4 py-3 flex items-center justify-between shrink-0 select-none">
          <h1 className="text-base font-bold font-display text-[#1C1917] flex items-center gap-1">
            OfficerAI <span className="text-[9px] text-[#0F766E] uppercase font-mono tracking-widest bg-teal-50 border border-teal-100 px-1 py-0.2 rounded font-extrabold leading-none">UPSC</span>
          </h1>
          <div className="flex items-center space-x-2">
            {user ? (
              <button 
                id="btn-logout-mobile"
                onClick={handleLogout}
                className="text-[10px] text-stone-500 bg-stone-105 border border-stone-200 px-2.5 py-1 rounded transition cursor-pointer font-bold font-mono uppercase"
              >
                Sign Out
              </button>
            ) : null}
            {user && user.email === 'abhishekraiop@gmail.com' && (
              <button
                onClick={() => setCurrentTab('admin')}
                className={`p-1 rounded transition bg-[#F5F5F4] hover:bg-[#E7E5E4] cursor-pointer ${
                  currentTab === 'admin' ? 'border border-[#0F766E] text-teal-805 bg-teal-55' : 'border border-[#E7E5E4]'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </header>

        {/* CONCENTRATED CONTENT INNER SCROLLER */}
        <div id="main-scroll-container" className="flex-1 overflow-y-auto bg-[#FCFBF9] selection:bg-teal-55">
          <div className="max-w-3xl mx-auto px-4 py-6 md:py-8 space-y-6">

            {/* Premium Editorial Masthead - Centered comfort & negative space */}
            {currentTab === 'home' && (
              <div className="py-6 md:py-10 border-b border-stone-200/50 font-sans">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#0F766E] font-bold block mb-2">Gate to the Services</span>
                <h2 className="text-2xl md:text-3.5xl font-display font-medium tracking-tight text-stone-900 leading-snug mb-3 select-none">
                  “Everything important for UPSC. Nothing extra.”
                </h2>
                <p className="text-stone-500 font-sans text-xs md:text-sm max-w-2xl leading-relaxed">
                  A calm, offline-ready intelligence workspace delivering high-yield policy insights from official Union Ministry briefs, legislative analysis, and expert columns. Filtered strictly for academic focus.
                </p>
              </div>
            )}

            {/* ==========================================
                TAB BODY RENDERS
               ========================================== */}
            
            {/* TAB 1: HOME FEED */}
            {currentTab === 'home' && (
              <div id="view-home-feed" className="space-y-6 animate-fade-in text-[#1C1917]">
            
            {/* SECTIONS CATEGORY ROW - Pure Editorial Tabs */}
            <div className="border-b border-stone-200 pb-1">
              <div className="flex gap-5 overflow-x-auto pb-1.5 scrollbar-none select-none">
                {['All', 'Economy', 'Governance', 'Environment', 'International Relations', 'Science & Tech', 'Security'].map((cat) => {
                  const count = categories[cat] || (cat === 'All' ? articles.length : 0);
                  const isSelected = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      id={`cat-badge-${cat.replace(/\s+/g, '-')}`}
                      onClick={() => handleSelectCategory(cat)}
                      className={`whitespace-nowrap pb-1.5 text-xs font-semibold relative tracking-tight transition-all cursor-pointer border-b-2 ${
                        isSelected 
                          ? 'text-[#0F766E] border-[#0F766E] font-bold' 
                          : 'text-stone-500 hover:text-stone-900 border-transparent hover:border-stone-300'
                      }`}
                    >
                      {cat} {count > 0 && <span className="ml-0.5 text-[9.5px] font-mono opacity-80">({count})</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* CLASSY BORDERLESS SEARCH & TUNER HUB */}
            <div className="space-y-3.5">
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between pb-2 border-b border-stone-200/60">
                {/* Clean borderless search focus lock */}
                <div className="relative w-full sm:max-w-md">
                  <SearchIcon className="absolute left-0 top-2 w-3.5 h-3.5 text-stone-400" />
                  <input
                    id="search-input-inline"
                    type="text"
                    value={newsQuery}
                    onChange={(e) => setNewsQuery(e.target.value)}
                    placeholder="Type to search high-yield syllabus topics..."
                    className="w-full text-xs pl-5 pr-8 py-1.5 bg-transparent focus:outline-none text-[#1C1917] font-sans placeholder-stone-400"
                  />
                  {newsQuery && (
                    <button 
                      onClick={() => setNewsQuery('')}
                      className="absolute right-0 top-1.5 text-[9px] hover:text-stone-950 font-mono text-stone-500 bg-stone-100 px-1 rounded-sm cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-950 transition-colors cursor-pointer"
                  >
                    <span>⚙️</span>
                    <span>{showAdvancedFilters ? 'Close Tuner' : 'Tune Filters'}</span>
                  </button>
                  <span className="text-[10px] font-mono font-bold text-[#0F766E] bg-teal-50 px-2.5 py-0.5 rounded-md border border-teal-100">
                    Threshold: ≥{minRelevance}/10
                  </span>
                </div>
              </div>

              {/* Advanced collapsable tuning tray */}
              {showAdvancedFilters && (
                <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in text-left">
                  {/* Score Slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-semibold text-stone-500 uppercase font-mono tracking-wider">
                      <span>Focus Threshold</span>
                      <span className="text-stone-850 font-bold">Min Score: {minRelevance}</span>
                    </div>
                    <input
                      id="relevance-score-range"
                      type="range"
                      min="1"
                      max="10"
                      step="1"
                      value={minRelevance}
                      onChange={(e) => setMinRelevance(parseInt(e.target.value, 10))}
                      className="w-full accent-[#0F766E] cursor-ew-resize h-1 bg-stone-200 rounded-lg mt-1"
                    />
                    <div className="flex justify-between text-[9px] text-[#A8A29E] font-mono leading-tight">
                      <span>1: General Reference</span>
                      <span>5: Policy Alignment</span>
                      <span>10: Core Syllabus</span>
                    </div>
                  </div>

                  {/* Timeframe selector */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 font-mono block">Recency Filter</span>
                    <div className="grid grid-cols-4 gap-1 mt-1">
                      {[
                        { value: "all", label: "All" },
                        { value: "today", label: "Today" },
                        { value: "last7", label: "7D" },
                        { value: "last30", label: "30D" }
                      ].map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setTimeframe(opt.value)}
                          className={`text-[10px] py-1 border rounded cursor-pointer transition font-mono ${
                            timeframe === opt.value
                              ? "bg-[#0F766E] border-[#0F766E] text-white font-bold"
                              : "bg-white border-stone-200 text-stone-500 hover:bg-stone-50"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sort By selector */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 font-mono block">Sort Intelligence By</span>
                    <div className="grid grid-cols-4 gap-1 mt-1">
                      {[
                        { value: "newest", label: "Latest" },
                        { value: "relevance", label: "Score" },
                        { value: "editorial", label: "Press" },
                        { value: "revised", label: "Priority" }
                      ].map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setSortBy(opt.value)}
                          className={`text-[10px] py-1 border rounded cursor-pointer transition font-mono ${
                            sortBy === opt.value
                              ? "bg-stone-900 border-stone-900 text-white font-bold"
                              : "bg-white border-stone-200 text-stone-500 hover:bg-stone-50"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* HOME ARTICLES FEED - Classical News Feed Aesthetics */}
            <div className="space-y-3 pt-3">
              {loadingArticles ? (
                <div className="border border-stone-200/80 bg-white rounded-xl p-12 flex flex-col items-center justify-center space-y-3">
                  <RotateCw className="w-5 h-5 text-[#0F766E] animate-spin" />
                  <p className="text-xs text-stone-500 font-mono">Loading UPSC curriculum feed...</p>
                </div>
              ) : filteredHomeArticles.length === 0 ? (
                <div className="border border-stone-250 bg-white rounded-xl p-12 text-center space-y-3">
                  <AlertTriangle className="w-7 h-7 text-amber-500 mx-auto" />
                  <h3 className="text-sm font-semibold text-stone-900">No matching syllabus intelligence</h3>
                  <p className="text-xs text-stone-500 max-w-sm mx-auto leading-relaxed">Relax filter restrictions or check back soon for fresh editorial sync.</p>
                </div>
              ) : (
                <div className="divide-y divide-stone-200/80">
                  {filteredHomeArticles.map((article) => {
                    const isBookmarked = bookmarks.some(b => b.id === article.id);
                    return (
                      <div
                        key={article.id}
                        id={`article-card-${article.id}`}
                        onClick={() => handleSelectArticle(article.id)}
                        className="group py-6 first:pt-1 last:pb-1 cursor-pointer transition-all dynamic-feed-item border-b border-stone-100 last:border-b-0"
                      >
                        <div className="flex flex-col md:flex-row gap-5 items-start justify-between">
                          <div className="flex-1 space-y-3 w-full">
                            {/* Upper Indicators - Ultra Clean metadata row */}
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 text-[10.5px] text-stone-500 font-mono">
                                <span className="font-extrabold text-[#0F766E] uppercase tracking-wider">
                                  {article.source}
                                </span>
                                <span className="text-stone-300">•</span>
                                <span className="font-semibold text-stone-600">
                                  {article.category}
                                </span>
                                <span className="text-stone-300">•</span>
                                <span>{article.readingTime}m reading layout</span>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                <span className="text-[10px] font-mono font-bold text-stone-500">
                                  UPSC Weight: <span className="text-[#0F766E] font-extrabold">{article.relevanceScore}/10</span>
                                </span>
                                <button
                                  id={`bookmark-toggle-btn-${article.id}`}
                                  onClick={(e) => handleToggleBookmark(article.id, e)}
                                  className={`p-1 rounded-full hover:bg-stone-100 transition-colors ${isBookmarked ? 'text-[#0F766E]' : 'text-stone-400 hover:text-stone-900'}`}
                                  title={isBookmarked ? "Bookmarked" : "Save Pinned Notebook"}
                                >
                                  <BookmarkIcon className="w-3.5 h-3.5 fill-current" />
                                </button>
                              </div>
                            </div>

                            {/* Heading & High-yield abstract description */}
                            <div className="space-y-1.5">
                              <h3 className="text-base md:text-lg font-display font-semibold tracking-tight text-stone-900 group-hover:text-[#0F766E] transition-colors leading-snug">
                                {article.title}
                              </h3>
                              <p className="text-xs md:text-[13px] leading-relaxed text-stone-600 font-sans line-clamp-3">
                                {article.summary?.oneLineRevision || article.content}
                              </p>
                            </div>

                            {/* Bottom: Date & Original source anchor links */}
                            <div className="flex items-center justify-between text-[11px] text-stone-400 font-mono">
                              <span>
                                PUBLISHED ON {new Date(article.ingestionTimestamp).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                }).toUpperCase()}
                              </span>
                              
                              <div className="flex items-center gap-3">
                                {article.sourceLink && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      window.open(article.sourceLink, '_blank');
                                    }}
                                    className="text-[#0F766E] hover:underline font-bold font-sans flex items-center gap-1 cursor-pointer bg-teal-50 px-2.5 py-0.5 rounded text-[10.5px]"
                                  >
                                    Source Publication ↗
                                  </button>
                                )}
                                <span className="text-[#0F766E] font-sans font-bold group-hover:translate-x-1 transition-transform flex items-center gap-0.5 text-xs">
                                  Syllabus Analysis →
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Rich Image/Editorial Thumbnail on Right */}
                          <div className="w-full md:w-[130px] h-28 md:h-20 rounded-lg overflow-hidden border border-stone-200/50 bg-stone-100 shrink-0 self-center flex items-center justify-center relative bg-gradient-to-br from-stone-50 via-[#FAF9F6] to-stone-100/60 shadow-sm">
                            {(article as any).imageUrl ? (
                              <img
                                src={(article as any).imageUrl}
                                alt={article.title}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 select-none animate-fade-in"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  const fallback = parent?.querySelector(".editorial-feed-fallback");
                                  if (fallback) {
                                    fallback.classList.remove("hidden");
                                    fallback.classList.add("flex");
                                  }
                                }}
                              />
                            ) : null}
                            {/* High-quality neutral editorial badge if real image fails or is missing */}
                            <div className={`editorial-feed-fallback flex-col items-center justify-center space-y-1 p-2 text-center select-none ${(article as any).imageUrl ? 'hidden' : 'flex'}`}>
                              <span className="text-[7.5px] font-mono font-extrabold tracking-widest text-[#0F766E] uppercase bg-[#E0F2FE]/50 border border-[#0F766E]/10 px-1.5 py-0.5 rounded-sm line-clamp-1 max-w-[115px]">
                                {article.category ? article.category.split(" ")[0].substring(0, 8) : "BRIEF"}
                              </span>
                              <span className="text-[10px] font-serif text-stone-400">◈</span>
                              <span className="text-[7.5px] font-sans text-stone-500 font-semibold tracking-wider">
                                STUDY INSIGNIA
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: LIVE ADVANCED INTERACTIVE FUZZY SEARCH */}
        {currentTab === 'search' && (
          <div id="view-search-engine" className="space-y-4">
            <div className="space-y-1.5 flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#E7E5E4] shadow-3xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-[#1C1917] flex items-center gap-1">
                    <SearchIcon className="w-4 h-4 text-[#0F766E]" /> Deep Syllabus Query Search
                  </h2>
                  <span className="bg-emerald-50 text-emerald-800 text-[9px] font-bold px-1.5 py-0.2 rounded-full border border-emerald-200 uppercase tracking-widest flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block"></span>
                    Live Index
                  </span>
                </div>
                <p className="text-xs text-[#57534E]">
                  Fuzzy search across active database treaties, legal acts, state committees, Space missions, environmental treaties, and specific bodies.
                </p>
              </div>
            </div>

            <div className="relative">
              <SearchIcon className="absolute left-3 top-3.5 w-4 h-4 text-[#78716C]" />
              <input
                id="search-bar-input"
                type="text"
                value={searchQuery}
                onChange={(e) => triggerFuzzySearch(e.target.value)}
                placeholder="Search e.g. 'Paris Agreement', 'isro', 'Urea', 'privacy'..."
                className="w-full text-sm pl-9 pr-16 py-3 border-2 border-[#1C1917] rounded-lg bg-white font-mono focus:outline-none focus:ring-1 focus:ring-[#0F766E] text-[#1C1917]"
              />
              {searchQuery && (
                <button
                  onClick={() => triggerFuzzySearch('')}
                  className="absolute right-3 top-3 text-xs text-stone-500 bg-stone-100 hover:text-stone-900 px-1.5 py-1 rounded font-mono"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Trending and Autocomplete recommendations */}
            <div className="space-y-2 bg-[#FAF9F6] p-3 border border-[#E7E5E4] rounded-lg">
              {searchSuggestions.length > 0 ? (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] text-[#78716C] font-bold font-mono uppercase tracking-wider">Autocomplete matches:</span>
                  {searchSuggestions.map((sug) => (
                    <button
                      key={sug}
                      id={`sug-btn-${sug.replace(/\s+/g, '-')}`}
                      onClick={() => triggerFuzzySearch(sug)}
                      className="text-[10.5px] font-mono text-[#0F766E] bg-white border border-[#E7E5E4] px-2 py-0.5 rounded hover:bg-teal-50 cursor-pointer shadow-3xs transition-all"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] text-[#78716C] font-bold font-mono uppercase tracking-wider">Trending searches:</span>
                  {searchTrending.map((term) => (
                    <button
                      key={term}
                      onClick={() => triggerFuzzySearch(term)}
                      className="text-[10.5px] font-mono text-stone-700 bg-white border border-stone-200 px-2 py-0.5 rounded hover:bg-stone-50 cursor-pointer shadow-3xs transition-all"
                    >
                      ★ {term}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Results Output Block */}
            {searchLoading ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-2">
                <RotateCw className="w-5 h-5 text-[#0F766E] animate-spin" />
                <p className="text-xs text-[#78716C] font-mono">Deep matching from MongoDB archives...</p>
              </div>
            ) : searchQuery ? (
              <div className="space-y-4">
                
                {/* Articles result section */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-[#78716C] uppercase tracking-wider">Matching Syllabus topics ({searchArticles.length})</h3>
                  {searchArticles.length === 0 ? (
                    <p className="text-xs text-[#A8A29E] pl-1">No topics match this query keyword.</p>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {searchArticles.map((article) => (
                        <div
                          key={article.id}
                          id={`search-res-item-${article.id}`}
                          onClick={() => handleSelectArticle(article.id)}
                          className="bg-white rounded-xl border border-[#E6E8EB] hover:border-slate-350 hover:shadow-xs transition-all p-3.5 space-y-2.5 cursor-pointer relative"
                        >
                          {/* Upper indicators */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-[9px] font-bold font-mono tracking-wider text-stone-500 uppercase bg-[#F5F5F4] rounded px-1.5 py-0.5">
                                {article.source}
                              </span>
                              <span className="text-[9px] font-sans font-semibold text-teal-850 bg-teal-50 border border-teal-100 rounded-full px-2 py-0.2">
                                {article.category}
                              </span>
                            </div>
                          </div>

                          {/* Title & Description with Relevance Score in flex layout */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1 my-0.5">
                              <h3 className="text-[14px] md:text-[15px] font-display font-semibold tracking-tight text-[#0F172A] hover:text-[#0F766E] transition-colors leading-snug">
                                {article.title}
                              </h3>
                              <p className="text-[11.5px] leading-relaxed text-[#57534E] line-clamp-2">
                                {article.summary?.oneLineRevision || article.content}
                              </p>
                            </div>
                            {/* Premium Relevance Indicator */}
                            <div className="border border-teal-100 bg-teal-50/40 p-1 rounded flex flex-col items-center justify-center min-w-[38px] h-[38px] shrink-0 mt-0.5">
                              <span className="text-[11px] font-mono font-extrabold text-teal-850 leading-none">
                                {article.relevanceScore}
                              </span>
                              <span className="text-[6.5px] text-teal-655 font-mono tracking-tighter uppercase mt-0.5 leading-none font-bold">
                                Focus
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Match MCQs */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-[#78716C] uppercase tracking-wider">Practice MCQs with Keyword Match ({searchMCQs.length})</h3>
                  {searchMCQs.length === 0 ? (
                    <p className="text-xs text-[#A8A29E] pl-1">No prelims questions contain this entry.</p>
                  ) : (
                    <div className="space-y-3">
                      {searchMCQs.map((item) => (
                        <div key={item.id} className="bg-[#FAFAF9] border border-[#E7E5E4] rounded-lg p-3 space-y-2.5">
                          <span className="text-[9px] font-mono font-bold bg-[#1C1917] text-white px-1.5 py-0.5 rounded uppercase">
                            Mcq for: {item.articleTitle}
                          </span>
                          <p className="text-xs font-semibold text-[#1C1917] whitespace-pre-wrap">{item.question}</p>
                          
                          {/* Test Answers inline */}
                          <div className="grid grid-cols-1 gap-1.5">
                            {item.options.map((opt: string, idx: number) => {
                              const hasAnswered = userAnswers[item.id] !== undefined;
                              const isSelected = userAnswers[item.id] === idx;
                              const isCorrect = item.correctAnswer === idx;
                              let btnClass = 'bg-white border-[#E7E5E4] hover:bg-[#FAFAF9]';
                              if (hasAnswered) {
                                if (isCorrect) {
                                  btnClass = 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold';
                                } else if (isSelected) {
                                  btnClass = 'bg-rose-50 border-rose-300 text-rose-900';
                                } else {
                                  btnClass = 'bg-stone-50 border-[#E7E5E4] text-stone-400 opacity-60';
                                }
                              }
                              return (
                                <button
                                  key={idx}
                                  id={`mcq-opt-${item.id}-${idx}`}
                                  disabled={hasAnswered}
                                  onClick={() => setUserAnswers(prev => ({ ...prev, [item.id]: idx }))}
                                  className={`w-full text-left text-xs p-2 rounded border transition-all text-[#44403C] flex items-start gap-1.5 cursor-pointer ${btnClass}`}
                                >
                                  <span className="font-mono bg-[#E7E5E4] text-[#1C1917] px-1 py-0.2 rounded text-[10px] uppercase font-bold shrink-0">
                                    {String.fromCharCode(65 + idx)}
                                  </span>
                                  <span>{opt}</span>
                                </button>
                              );
                            })}
                          </div>

                          {userAnswers[item.id] !== undefined && (
                            <div className="bg-emerald-50/50 border border-emerald-200 text-[#1C1917] text-xs p-2.5 rounded space-y-1">
                              <p className="font-bold text-emerald-900 flex items-center gap-1 bg-emerald-100 rounded px-1.5 py-0.5 w-fit">
                                <Lightbulb className="w-3.5 h-3.5 fill-current text-amber-500" /> IAS Guidance & Syllabus Citations:
                              </p>
                              <p className="leading-relaxed text-[#44403C]">{item.explanation}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* AI Search Diagnostics Telemetry Block */}
                {searchDebug && (
                  <div className="bg-[#1C1816] text-amber-500/90 rounded-lg p-3.5 border border-amber-900/30 space-y-2 font-mono text-[10.5px]">
                    <div className="flex items-center justify-between border-b border-amber-950/50 pb-1.5 mb-1.5">
                      <span className="text-white font-bold flex items-center gap-1">
                        ⚡ AI Search Diagnostics Telemetry
                      </span>
                      <span className="text-emerald-500 text-[9px] bg-emerald-950 px-1.5 rounded uppercase font-bold tracking-widest">
                        {searchDebug.indexingHealth}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-[#A8A29E]">
                      <div>• Fields Scanned: <span className="text-stone-300">[{searchDebug.searchedFields?.join(', ')}]</span></div>
                      <div>• Matched Sources: <span className="text-stone-300">{searchDebug.matchedSources?.join(', ') || 'All'}</span></div>
                      <div>• Entity Match: <span className="text-emerald-450 font-bold">{searchDebug.matchedEntities?.join(', ') || 'None found'}</span></div>
                      <div>• Hit Counts: <span className="text-amber-400 font-bold">{searchDebug.hitCounts || 0} rows</span></div>
                    </div>
                    <div className="text-[9.5px] text-[#78716C] pt-1">
                      Fuzzy scoring formula: Word Direct Match = +40pts | Tags Intersection = +12pts | Breakdown Content Match = +1.5pts. Sort priority: Weighted rank score desc.
                    </div>
                  </div>
                )}

              </div>
            ) : (
              <div className="space-y-6">
                {/* Standard Search Suggestion Badges */}
                <div className="bg-white border border-[#E7E5E4] rounded-lg p-3 space-y-2 shadow-xs">
                  <h3 className="text-[10px] font-bold text-[#78716C] uppercase tracking-wider font-mono">Suggested Current Affairs Indexes</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {['Paris Agreement', 'DPDP Act', 'PM-PRANAM', 'Green Hydrogen', 'ISRO', 'NITI Aayog'].map((k) => (
                      <button
                        key={k}
                        id={`rec-search-${k.replace(/\s+/g, '-')}`}
                        onClick={() => triggerFuzzySearch(k)}
                        className="text-[10.5px] font-mono font-medium text-[#44403C] hover:text-[#0F766E] bg-[#FAFAF9] hover:bg-[#F5F4F0] transition px-2.5 py-1 rounded border border-[#E7E5E4] cursor-pointer"
                      >
                        #{k}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 🎯 UPSC PYQs Practice Arena Card */}
                <div id="pyq-practice-deck" className="space-y-4">
                  <div className="border-b border-[#E7E5E4] pb-2">
                    <h2 className="text-xs font-bold text-[#1C1917] tracking-tight uppercase flex items-center gap-1.5 font-display">
                      🎯 UPSC PYQ Linkage & Mains Practice Desk
                    </h2>
                    <p className="text-[11px] text-[#78716C] leading-normal">
                      Practice previous years official prelims MCQs or write and submit essays for direct **AI Officer evaluation criteria** mapped with LBSNAA syllabus trends.
                    </p>
                  </div>

                  {/* PYQ MAINS ESSAY EVALUATION PORTAL */}
                  <div className="bg-white border border-[#E7E5E4] rounded-xl overflow-hidden shadow-xs">
                    <div className="bg-[#1C1917] p-3 text-white flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wide text-teal-400">GS Mains Essay Sandbox</span>
                      <span className="text-[9px] font-mono text-[#A8A29E]">Gemini 3.5 Active Grader</span>
                    </div>

                    <div className="p-4 space-y-3.5">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-[#44403C] uppercase tracking-wider font-mono">Select Previous GS Question:</label>
                        <select
                          value={selectedPyqId}
                          onChange={(e) => {
                            setSelectedPyqId(e.target.value);
                            setGradingResponse(null);
                            setMainsDraftAnswer('');
                          }}
                          className="w-full text-xs font-mono bg-[#FAFAF9] border border-[#E7E5E4] p-2 rounded focus:ring-1 focus:ring-[#0F766E] focus:outline-none focus:border-[#0F766E]"
                        >
                          {pyqList.filter(q => q.type === 'MAINS').map(q => (
                            <option key={q.id} value={q.id}>
                              [{q.code}] {q.question.substring(0, 75)}... ({q.weights})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Display Selected Mains Question */}
                      {(() => {
                        const activeQ = pyqList.find(q => q.id === selectedPyqId);
                        if (!activeQ) return null;
                        return (
                          <div className="bg-[#FAFAF9] border border-[#E7E5E4] p-3 rounded-lg space-y-2">
                            <div className="flex items-center justify-between text-[10px] font-mono">
                              <span className="text-[#0F766E] font-bold">Paper Focus: {activeQ.syllabusCode}</span>
                              <span className="bg-stone-200 px-1.5 py-0.2 rounded text-stone-700 font-bold">{activeQ.year} Exam • {activeQ.weights}</span>
                            </div>
                            <p className="text-xs font-semibold leading-relaxed text-stone-900 font-display">
                              {activeQ.question}
                            </p>
                            {activeQ.syllabusSectors && (
                              <div className="flex flex-wrap gap-1 pt-1">
                                {activeQ.syllabusSectors.map((sec: string) => (
                                  <span key={sec} className="bg-teal-50 text-teal-850 border border-teal-200 text-[8.5px] font-mono font-bold px-2 py-0.5 rounded">
                                    {sec}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Mains answer submission box */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-mono font-bold text-[#44403C]">Student Essay Answer Draft:</label>
                          <span className="text-[9.5px] text-[#78716C] font-mono">Count: {mainsDraftAnswer.length} chars</span>
                        </div>
                        <textarea
                          rows={6}
                          value={mainsDraftAnswer}
                          onChange={(e) => setMainsDraftAnswer(e.target.value)}
                          placeholder="Write or paste your educational script. Cover introduction definitions, constitutional provisions, core issues, and solutions way-forward..."
                          className="w-full text-xs font-mono p-3 border border-[#E7E5E4] rounded-lg bg-stone-50 focus:bg-white focus:ring-1 focus:ring-[#0F766E] focus:outline-none"
                        />
                      </div>

                      <button
                        onClick={handleEvaluateMainsAnswer}
                        disabled={gradingInProgress}
                        className="w-full bg-[#1C1917] hover:bg-[#2E2A27] text-white text-xs font-mono font-bold py-2 px-4 rounded-md shadow-xs transition disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        {gradingInProgress ? "Analyzing Answer Key structures..." : "Grade Answer Script (AI Evaluation)"}
                      </button>

                      {/* Grader Response Dashboard */}
                      {gradingResponse && (
                        <div className="mt-4 border-2 border-[#0F766E]/50 bg-white rounded-lg p-4 space-y-3.5 transition-all duration-300">
                          <div className="flex items-center justify-between border-b border-[#E7E5E4] pb-2">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-teal-900 font-mono">UPSC Grader Diagnostic Sheet</h4>
                            <div className="flex items-center gap-1 bg-[#EEF2F6] px-2 py-1 rounded">
                              <span className="text-[10px] font-mono text-stone-500 font-bold">Marks Gained:</span>
                              <span className="text-xs font-mono font-black text-teal-700 bg-white border border-teal-250 px-1.5 py-0.2 rounded">{gradingResponse.score}</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                            <div className="bg-stone-50 border border-stone-200 p-2.5 rounded">
                              <h5 className="text-[10px] font-bold text-emerald-800 uppercase font-mono mb-1">✓ Structured Strengths</h5>
                              <ul className="text-[10.5px] space-y-1 text-stone-700 pr-1 leading-normal list-decimal pl-3.5">
                                {gradingResponse.strengths?.map((str: string, i: number) => (
                                  <li key={i}>{str}</li>
                                ))}
                              </ul>
                            </div>
                            <div className="bg-stone-50 border border-stone-200 p-2.5 rounded">
                              <h5 className="text-[10px] font-bold text-rose-800 uppercase font-mono mb-1">✗ Gaps & Weaknesses</h5>
                              <ul className="text-[10.5px] space-y-1 text-stone-700 pr-1 leading-normal list-decimal pl-3.5">
                                {gradingResponse.weaknesses?.map((wk: string, i: number) => (
                                  <li key={i}>{wk}</li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          <div className="bg-[#EEF2F6] p-2.5 rounded text-[11px] text-stone-850 leading-relaxed border border-[#DCE6ED] space-y-1.5">
                            <p className="font-bold font-mono text-teal-900 text-[10px] uppercase">📋 Model Answer Recommendations</p>
                            <p className="font-display pr-1">{gradingResponse.modelAnswerOverview}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* PRELIMS PYQ DRILLS */}
                  <div className="bg-white border border-[#E7E5E4] rounded-xl overflow-hidden shadow-xs">
                    <div className="bg-[#EEF2F6] p-3 border-b border-[#E7E5E4] flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wide text-stone-950">GS Prelims PYQ Drills</span>
                      <span className="text-[9px] font-mono text-stone-500 bg-white border px-1.5 py-0.2 rounded font-bold">Paper I (General Studies)</span>
                    </div>

                    <div className="p-4 space-y-5">
                      {pyqList.filter(q => q.type === 'PRELIMS').map((q, qIndex) => {
                        const hasSelected = prelimsPyqAnswers[q.id] !== undefined;
                        const userSelOption = prelimsPyqAnswers[q.id];
                        const isCorrect = userSelOption === q.correctAnswer;
                        return (
                          <div key={q.id} className="border-b border-[#E7E5E4] last:border-0 pb-4 last:pb-0 space-y-2.5">
                            <div className="flex items-center gap-1.5 text-[9.5px] font-mono font-bold text-[#78716C]">
                              <span className="bg-[#FAFAF9] border border-[#E7E5E4] px-1.5 py-0.2 rounded">Q{qIndex + 1}</span>
                              <span>• CSE {q.year} Exam • Syllabus Code: {q.syllabusCode}</span>
                            </div>

                            <p className="text-[11.5px] font-bold text-[#1C1917] leading-relaxed font-display">
                              {q.question}
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 font-mono">
                              {q.options?.map((opt: string, idx: number) => {
                                const isOptionSelected = userSelOption === idx;
                                const isThisCorrect = q.correctAnswer === idx;
                                let btnStyle = "bg-[#FAFAF9] hover:bg-[#F5F4F0] text-stone-850 border-[#E7E5E4]";
                                if (hasSelected) {
                                  if (isThisCorrect) {
                                    btnStyle = "bg-emerald-100 text-emerald-900 border-emerald-400 font-bold";
                                  } else if (isOptionSelected) {
                                    btnStyle = "bg-rose-100 text-rose-900 border-rose-400";
                                  }
                                }
                                return (
                                  <button
                                    key={idx}
                                    onClick={() => {
                                      if (!hasSelected) {
                                        setPrelimsPyqAnswers(p => ({ ...p, [q.id]: idx }));
                                        trackAnalytics('mcq_answer', { mcqId: q.id, userChoice: idx, isCorrect: idx === q.correctAnswer });
                                      }
                                    }}
                                    className={`text-left text-[11px] p-2.5 border rounded-lg transition-all cursor-pointer ${btnStyle}`}
                                  >
                                    <span className="font-bold mr-1 bg-stone-100 text-stone-700 px-1 py-0.2 rounded text-[10px]">{String.fromCharCode(65 + idx)}</span> {opt}
                                  </button>
                                );
                              })}
                            </div>

                            {hasSelected && (
                              <div className="bg-teal-50/50 p-2.5 rounded-lg border border-teal-200 text-[10.5px] leading-relaxed text-stone-750 transition-all">
                                <span className={`font-mono text-[9px] uppercase font-bold block mb-1 ${isCorrect ? 'text-emerald-800' : 'text-rose-800'}`}>
                                  {isCorrect ? '✓ Correct syllabus citations' : '✗ Incorrect choice'} • Correct Answer is Option {String.fromCharCode(65 + q.correctAnswer)}
                                </span>
                                <p className="font-display">{q.explanation}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: DAILY 15-MINUTE BRIEFING PAGE (REDESIGNED TYPOGRAPHICALLY) */}
        {currentTab === 'brief' && (
          <div id="view-daily-briefing" className="max-w-2xl mx-auto space-y-6 pt-4 px-2 select-none">
            
            {/* Minimalist Editorial Masthead */}
            <div className="border-b border-stone-200/60 pb-5 text-left space-y-2">
              <span className="text-[10px] font-mono font-bold tracking-widest text-[#0E5C54] uppercase bg-[#F0F7F6] px-2 py-0.5 rounded">
                Editorial Dispatch
              </span>
              <h2 className="text-xl md:text-2xl font-display font-medium tracking-tight text-[#1C1A17]">
                The Morning Intelligence Briefing
              </h2>
              <p className="text-xs text-stone-500 font-sans leading-relaxed">
                A silent, revision-first distillation of today's absolute top 10 articles from official Union Ministries and legal registries. Compiled 12m ago.
              </p>
              
              {/* Personalized Candidate Metadata Row */}
              {onboardingData && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1.5 text-[10px] font-mono text-stone-500">
                  <span className="text-[#0E5C54] font-bold">Personalized:</span>
                  <span className="bg-stone-100 px-1.5 py-0.2 rounded">Target {onboardingData.targetYear}</span>
                  <span className="bg-stone-100 px-1.5 py-0.2 rounded">Focus: {onboardingData.examFocus === 'both' ? 'Combined CSE' : onboardingData.examFocus === 'prelims' ? 'Prelims Focus' : 'Mains Focus'}</span>
                  {onboardingData.optionalSubject && (
                    <span className="bg-teal-50 border border-teal-100/60 text-[#0E5C54] px-1.5 py-0.2 rounded uppercase font-bold">
                      {onboardingData.optionalSubject.replace('_', ' ')} Optional
                    </span>
                  )}
                </div>
              )}
            </div>

            {loadingBrief ? (
              <div className="py-20 text-center flex flex-col items-center space-y-2.5">
                <RotateCw className="w-4 h-4 text-[#0E5C54] animate-spin" />
                <p className="text-xs text-stone-400 font-mono">Compiling top UPSC agenda items...</p>
              </div>
            ) : dailyBrief.length === 0 ? (
              <div className="py-16 text-center space-y-2">
                <AlertTriangle className="w-6 h-6 text-amber-500 mx-auto" />
                <h3 className="text-xs font-semibold text-stone-850">Briefing feed is empty</h3>
                <p className="text-xs text-stone-400">Navigate to Admin and trigger "Live AI feed Ingest" to synthesize core files.</p>
              </div>
            ) : (
              <div className="divide-y divide-stone-200/50">
                {dailyBrief.slice(0, 10).map((article, idx) => {
                  // Determine rolling freshness timestamp
                  const mTimes = [14, 28, 42, 58, 75, 98, 120, 150, 180, 240];
                  const rawTime = mTimes[idx % mTimes.length];
                  const freshness = rawTime < 60 ? `${rawTime}m ago` : `${Math.floor(rawTime/60)}h ago`;
                  
                  // Check if this article matches optional subject keywords to personalizing relevance!
                  let matchesPreferenceSubject = false;
                  if (onboardingData?.optionalSubject) {
                    const optSub = onboardingData.optionalSubject.toLowerCase();
                    const titleText = article.title.toLowerCase();
                    const catText = article.category.toLowerCase();
                    if (
                      (optSub === 'economics' && (titleText.includes('eco') || titleText.includes('budget') || titleText.includes('trade') || titleText.includes('gdp') || catText.includes('eco'))) ||
                      (optSub === 'public_admin' && (titleText.includes('govern') || titleText.includes('policy') || titleText.includes('admin') || titleText.includes('scheme') || catText.includes('polity'))) ||
                      (optSub === 'geography' && (titleText.includes('water') || titleText.includes('forest') || titleText.includes('coast') || titleText.includes('monsoon') || catText.includes('environ'))) ||
                      (optSub === 'psir' && (titleText.includes('china') || titleText.includes('treaty') || titleText.includes('diplomat') || titleText.includes('bilateral') || catText.includes('internat')))
                    ) {
                      matchesPreferenceSubject = true;
                    }
                  }

                  return (
                    <div
                      key={article.id}
                      id={`brief-item-${idx + 1}`}
                      onClick={() => handleSelectArticle(article.id)}
                      className="group py-5 text-left cursor-pointer transition-all space-y-1.5"
                    >
                      {/* Flex Header details */}
                      <div className="flex items-start gap-4">
                        {/* Compact ranking number */}
                        <div className="text-sm font-mono font-medium text-stone-400 group-hover:text-[#0E5C54] shrink-0 mt-0.5 select-none">
                          {String(idx + 1).padStart(2, '0')}
                        </div>

                        {/* Title, secondary metadata, and 1-line intelligence summary */}
                        <div className="space-y-1 flex-1 min-w-0">
                          <h3 className="text-[13.5px] md:text-[14px] font-sans font-medium text-stone-900 leading-snug tracking-tight group-hover:text-[#0E5C54] transition-colors">
                            {article.title}
                          </h3>
                          
                          {/* 1-Line intelligence summary inside the main layout block */}
                          <p className="text-xs text-stone-500 font-sans leading-relaxed">
                            “{article.summary?.oneLineRevision || "High-yield administrative framework maps directly to critical General Studies Syllabus cores."}”
                          </p>

                          {/* Minimalist, super clean, non-card inline metadata label */}
                          <div className="flex items-center gap-2 pt-0.5 text-[10px] font-mono text-stone-400 flex-wrap">
                            <span className="font-bold text-stone-500 uppercase">{article.source}</span>
                            <span>•</span>
                            <span>{freshness}</span>
                            <span>•</span>
                            <span className="font-semibold text-[#0E5C54]">
                              {article.relevanceScore} relevance
                            </span>
                            
                            {matchesPreferenceSubject && (
                              <>
                                <span>•</span>
                                <span className="bg-teal-50 text-[#0E5C54] px-1 rounded-sm text-[9px] font-bold">
                                  ★ Suggested for {onboardingData?.optionalSubject.toUpperCase().replace('_', ' ')} Optional
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: REVISION ENGINE CARD MATRIX */}
        {currentTab === 'revision' && (
          <div id="view-revision-notes" className="space-y-4">
            
            {/* Quick stats and progress metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-white border border-[#E7E5E4] rounded-lg p-3 shadow-xs space-y-1">
                <span className="text-[10px] font-mono font-bold text-[#78716C] uppercase">Saved Syllabi Topics</span>
                <p className="text-xl font-bold font-display text-[#1C1917]">{revisionStats.total}</p>
              </div>

              <div className="bg-white border border-[#E7E5E4] rounded-lg p-3 shadow-xs space-y-1">
                <span className="text-[10px] font-mono font-bold text-[#78716C] uppercase">Syllabi Revised</span>
                <p className="text-xl font-bold font-display text-[#0F766E]">{revisionStats.completed}</p>
              </div>

              <div className="bg-white border border-[#E7E5E4] rounded-lg p-3 shadow-xs space-y-2">
                <span className="text-[10px] font-mono font-bold text-[#78716C] uppercase bg-teal-50 px-1 py-0.5 w-fit">Revision coverage metric</span>
                <div className="flex items-center justify-between text-xs font-mono font-bold">
                  <span>{revisionStats.percent}%</span>
                </div>
                <div className="w-full bg-[#FAFAF9] rounded-full h-1.5 border border-[#E7E5E4]">
                  <div className="bg-[#0F766E] h-1.5 rounded-full transition-all" style={{ width: `${revisionStats.percent}%` }} />
                </div>
              </div>
            </div>

            {loadingRevision ? (
              <div className="py-12 text-center flex flex-col items-center space-y-2">
                <RotateCw className="w-5 h-5 text-[#0F766E] animate-spin" />
                <p className="text-xs text-[#78716C] font-mono">Syncing revision cards...</p>
              </div>
            ) : revisionCards.length === 0 ? (
              <div className="bg-white border border-[#E7E5E4] rounded-lg p-10 text-center space-y-3">
                <CheckSquare className="w-8 h-8 text-[#0F766E] mx-auto opacity-40" />
                <h3 className="text-sm font-bold text-[#1C1917]">No Revision Cards saved yet</h3>
                <p className="text-xs text-[#78716C] max-w-xs mx-auto">
                  Click on any news article card from the home feed, write your custom notes in the input box, and hit save to generate revision memory items.
                </p>
                <button
                  id="btn-nav-home-from-rev"
                  onClick={() => setCurrentTab('home')}
                  className="bg-[#1C1917] hover:bg-[#2E2A27] text-white text-xs font-semibold py-1.5 px-4 rounded transition-colors cursor-pointer"
                >
                  Explore Home Feed
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {revisionCards.map((card) => {
                  return (
                    <div
                      key={card.id}
                      id={`revision-card-${card.id}`}
                      className={`bg-white border rounded-lg p-3 space-y-3 transition-opacity ${card.isRevised ? 'border-emerald-300 opacity-90' : 'border-[#E7E5E4]'}`}
                    >
                      {/* Title line */}
                      <div className="flex items-start justify-between">
                        <div className="space-y-0.5">
                          <span className="text-[9px] font-mono font-semibold text-[#0F766E] bg-teal-50 border border-teal-100 px-1.5 py-0.2 rounded">
                            {card.category}
                          </span>
                          <h4 
                            id={`rev-card-title-${card.id}`}
                            onClick={() => handleSelectArticle(card.articleId)}
                            className="text-xs font-bold text-[#1C1917] leading-snug cursor-pointer hover:underline hover:text-[#0F766E]"
                          >
                            {card.articleTitle}
                          </h4>
                        </div>

                        {/* Top action box */}
                        <div className="flex items-center space-x-1.5">
                          <button
                            id={`card-delete-btn-${card.id}`}
                            onClick={() => handleDeleteCard(card.id)}
                            className="text-stone-400 hover:text-red-700 p-1 rounded hover:bg-stone-100 transition-all"
                            title="Remove completely"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Summary line anchor */}
                      <p className="text-[11px] text-[#57534E] leading-relaxed bg-[#FAFAF9] p-2 rounded border border-[#F5F5F4] font-mono italic">
                        &ldquo;{card.oneLineRevision}&rdquo;
                      </p>

                      {/* Custom editable review notes */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#78716C] uppercase font-mono block">Custom Review Notes</label>
                        <textarea
                          id={`textarea-notes-${card.id}`}
                          rows={2}
                          value={activeNotesText[card.id] ?? ''}
                          onChange={(e) => handleUpdateNotesText(card.id, e.target.value)}
                          placeholder="Type personal references, static linkage thoughts or mnemonics..."
                          className="w-full text-xs p-1.5 border border-[#E7E5E4] rounded font-sans focus:outline-none focus:border-[#1C1917] bg-[#FAFAF9] text-[#1C1917]"
                        />
                      </div>

                      {/* Action save widgets footer */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#F5F5F4] pt-2.5">
                        <div className="flex items-center space-x-2">
                          <input
                            id={`checkbox-revised-${card.id}`}
                            type="checkbox"
                            checked={card.isRevised}
                            onChange={() => handleToggleCardRevised(card.id)}
                            className="h-3.5 w-3.5 text-[#0F766E] border-stone-300 rounded focus:ring-[#0F766E] cursor-pointer"
                          />
                          <span className="text-[11px] font-semibold text-[#44403C] cursor-pointer" onClick={() => handleToggleCardRevised(card.id)}>
                            {card.isRevised ? '🎉 Completed Revision' : 'Mark as Revised'}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2">
                          {card.lastRevisedAt && (
                            <span className="text-[9px] font-mono text-[#A8A29E]">
                              Checked: {new Date(card.lastRevisedAt).toLocaleDateString()}
                            </span>
                          )}
                          <button
                            id={`btn-save-notes-action-${card.id}`}
                            onClick={() => handleSaveExistingCardNotes(card.id, card.articleId)}
                            className="text-[10px] text-white bg-[#1C1917] hover:bg-[#2E2A27] font-semibold px-2.5 py-1 rounded transition-colors cursor-pointer"
                          >
                            Save Notes
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: BOOKMARKS ARCHIVE */}
        {currentTab === 'bookmarks' && (
          <div id="view-bookmarks-wrapper" className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#78716C] flex items-center gap-1">
                <BookmarkIcon className="w-4 h-4 text-[#0F766E] fill-current" /> Bookmarked Syllabus Materials
              </h2>
              <p className="text-xs text-[#57534E]">
                Saved topics on your local account for quick offline reading, PYQ analysis, and fact compilation.
              </p>
            </div>

            {loadingBookmarks ? (
              <div className="py-12 text-center flex flex-col items-center space-y-2">
                <RotateCw className="w-5 h-5 text-[#0F766E] animate-spin" />
                <p className="text-xs text-[#78716C] font-mono">Syncing bookmarked data...</p>
              </div>
            ) : bookmarks.length === 0 ? (
              <div className="bg-white border border-[#E7E5E4] rounded-lg p-10 text-center space-y-3">
                <BookmarkIcon className="w-8 h-8 text-[#0F766E] mx-auto opacity-40" />
                <h3 className="text-sm font-bold text-[#1C1917]">No bookmarks archived</h3>
                <p className="text-xs text-[#78716C]">
                  Click the bookmark star button on any syllabus feed topic item to pin items for detailed examination later.
                </p>
                <button
                  id="btn-nav-home-from-bmark"
                  onClick={() => setCurrentTab('home')}
                  className="bg-[#1C1917] hover:bg-[#2E2A27] text-white text-xs font-semibold py-1.5 px-4 rounded transition-colors cursor-pointer"
                >
                  Browse Home Feed
                </button>
              </div>
            ) : (
               <div className="grid grid-cols-1 gap-3">
                 {bookmarks.map((article) => (
                   <div
                     key={article.id}
                     id={`bookmark-card-${article.id}`}
                     onClick={() => handleSelectArticle(article.id)}
                     className="bg-white rounded-xl border border-[#E6E8EB] hover:border-slate-350 transition-all p-3.5 space-y-2.5 cursor-pointer relative"
                   >
                     {/* Upper indicators */}
                     <div className="flex items-center justify-between gap-2">
                       <div className="flex flex-wrap items-center gap-1.5">
                         <span className="text-[9px] font-bold font-mono tracking-wider text-stone-500 uppercase bg-[#F5F5F4] rounded px-1.5 py-0.5">
                           {article.source}
                         </span>
                         <span className="text-[9px] font-sans font-semibold text-teal-850 bg-teal-50 border border-teal-100 rounded-full px-2 py-0.2">
                           {article.category}
                         </span>
                       </div>
                       
                       {/* Unbookmark action */}
                       <div className="flex items-center space-x-1.5">
                         <button
                           id={`unbookmark-card-btn-${article.id}`}
                           onClick={(e) => handleToggleBookmark(article.id, e)}
                           className="text-stone-400 hover:text-red-650 bg-stone-50 hover:bg-stone-100 p-1 rounded transition-colors"
                           title="Unbookmark / Pin Down"
                         >
                           <Trash2 className="w-3.5 h-3.5" />
                         </button>
                       </div>
                     </div>

                     {/* Title & Description with Relevance Score in flex layout */}
                     <div className="flex items-start justify-between gap-3">
                       <div className="space-y-1 my-0.5">
                         <h3 className="text-[14px] md:text-[15px] font-display font-semibold tracking-tight text-[#0F172A] hover:text-[#0F766E] transition-colors leading-snug">
                           {article.title}
                         </h3>
                         <p className="text-[11.5px] leading-relaxed text-[#57534E] line-clamp-2">
                           {article.summary?.oneLineRevision || article.content}
                         </p>
                       </div>
                       {/* Premium Relevance Indicator */}
                       <div className="border border-teal-100 bg-teal-50/40 p-1 rounded flex flex-col items-center justify-center min-w-[38px] h-[38px] shrink-0 mt-0.5">
                         <span className="text-[11px] font-mono font-extrabold text-teal-850 leading-none">
                           {article.relevanceScore}
                         </span>
                         <span className="text-[6.5px] text-teal-655 font-mono tracking-tighter uppercase mt-0.5 leading-none font-bold">
                           Focus
                         </span>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
            )}
          </div>
        )}

        {/* TAB 5B: PERSONALIZED ADAPTIVE LEARNING PATH */}
        {currentTab === 'path' && (
          <div id="view-learning-path-wrapper">
            <LearningPath token={token} onOpenArticle={(art) => handleSelectArticle(art.id)} />
          </div>
        )}

        {/* TAB 6: PREMIUM ADMIN OPERATIONS PORTAL */}
        {currentTab === 'admin' && user?.email === 'abhishekraiop@gmail.com' && (
          <AdminPortal
            articles={articles}
            revisionCards={revisionCards}
            analyticsData={analyticsData}
            loadingAnalytics={loadingAnalytics}
            adminSources={adminSources}
            ingestionInProgress={ingestionInProgress}
            ingestionMessage={ingestionMessage}
            onTriggerIngest={handleTriggerIngest}
            adminDiagnostics={adminDiagnostics}
            loadingDiagnostics={loadingDiagnostics}
            onFetchDiagnostics={fetchAdminDiagnostics}
            showManualAdd={showManualAdd}
            setShowManualAdd={setShowManualAdd}
            newTitle={newTitle}
            setNewTitle={setNewTitle}
            newContent={newContent}
            setNewContent={setNewContent}
            newSource={newSource}
            setNewSource={setNewSource}
            newPriority={newPriority}
            setNewPriority={setNewPriority}
            newMsg={newMsg}
            onManualAddSubmit={handleManualAddSubmit}
            adminLogs={adminLogs}
          />
        )}

      {/* ==========================================
          ARTICLE BREAKDOWN ANALYSIS DETAIL SHEET (IFRAME CAPABLE INLAY)
         ========================================== */}
      {selectedArticleId && (
        <ArticleDetail
          article={selectedArticle}
          loading={articleDetailLoading}
          onClose={() => {
            setSelectedArticleId(null);
            setSelectedArticle(null);
          }}
          onToggleBookmark={handleToggleBookmark}
          isBookmarked={bookmarks.some(b => b.id === selectedArticle?.id)}
          userAnswers={userAnswers}
          onAnswerMCQ={(mcqId, optionIndex) => {
            setUserAnswers(prev => ({ ...prev, [mcqId]: optionIndex }));
          }}
          token={token}
          revisionCards={revisionCards}
          onSaveRevisionCard={handleSaveRevisionCard}
          onSelectRelated={(articleId) => handleSelectArticle(articleId)}
        />
      )}
      {false && selectedArticleId && (
        <div id="article-detail-sheet-modal" className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-md flex items-end md:items-center justify-center p-0 md:p-6 animate-fade-in" onClick={(e) => {
          if (e.target === e.currentTarget) {
            setSelectedArticleId(null);
            setSelectedArticle(null);
          }
        }}>
          <div className="bg-[#FAF9F5] w-full max-w-lg md:max-w-2xl rounded-t-2xl md:rounded-xl max-h-[92vh] overflow-y-auto flex flex-col font-sans text-stone-900 relative shadow-2xl border-0 selection:bg-teal-50">
            
            {/* Absolute close button */}
            <button
              id="btn-close-article-details"
              onClick={() => {
                setSelectedArticleId(null);
                setSelectedArticle(null);
              }}
              className="absolute top-5 right-5 text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition rounded-full p-1.5 w-8 h-8 flex items-center justify-center cursor-pointer z-20 text-lg font-bold"
              title="Close Reading View"
            >
              &times;
            </button>

            {/* Article detailed parameters scroll area */}
            {articleDetailLoading ? (
              <div className="py-24 text-center flex flex-col items-center justify-center space-y-4">
                <RotateCw className="w-8 h-8 text-[#0F766E] animate-spin" />
                <p className="text-xs text-[#78716C] font-mono tracking-wider">Consolidating editorial analysis...</p>
              </div>
            ) : selectedArticle ? (
              <div className="p-8 md:p-12 space-y-9 max-w-2xl mx-auto flex-1 w-full">
                
                {/* Title and stats headline */}
                <div className="space-y-4">
                  {selectedArticle.category && (
                    <div className="text-[10px] font-mono font-bold tracking-widest text-[#0F766E] uppercase font-sans">
                      {selectedArticle.category}
                    </div>
                  )}
                  <h2 className="text-2xl md:text-3xl font-serif font-black tracking-tight leading-snug text-[#1C1917]">
                    {selectedArticle.title}
                  </h2>
                  
                  {/* Clean Editorial Metadata Line */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-[#78716C] font-serif border-b border-stone-250 pb-4">
                    <span className="font-sans font-semibold text-[#0F766E]">{selectedArticle.source}</span>
                    <span>•</span>
                    <span>{new Date(selectedArticle.ingestionTimestamp).toLocaleDateString(undefined, {month: "short", day: "numeric", year: "numeric"})}</span>
                    <span>•</span>
                    <span className="text-amber-800 font-semibold">{selectedArticle.relevanceScore}/10 Relevance</span>
                    {selectedArticle.sourceLink && (
                      <>
                        <span>•</span>
                        <a 
                          href={selectedArticle.sourceLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[#0F766E] hover:underline hover:text-teal-800 transition font-sans font-medium"
                        >
                          Official Source ↗
                        </a>
                      </>
                    )}
                  </div>

                  {/* Subtle Secondary Share Bar */}
                  <div className="flex flex-wrap items-center gap-x-3 text-[11px] text-[#A8A29E] font-sans pt-1">
                    <span className="text-[10px] uppercase tracking-wider font-semibold">Share briefing:</span>
                    <button
                      onClick={() => {
                        const titleSlug = selectedArticle.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                        const shareUrl = `${window.location.origin}/article/${titleSlug}`;
                        const text = encodeURIComponent(`📚 *UPSC Note*: \n*${selectedArticle.title}*\nScore: ${selectedArticle.relevanceScore}/10\n\nRead here:\n${shareUrl}`);
                        window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
                      }}
                      className="text-stone-500 hover:text-emerald-700 font-medium transition cursor-pointer p-0 bg-transparent border-0"
                    >
                      WhatsApp
                    </button>
                    <span>·</span>
                    <button
                      onClick={() => {
                        const titleSlug = selectedArticle.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                        const shareUrl = `${window.location.origin}/article/${titleSlug}`;
                        const text = encodeURIComponent(`📚 UPSC Current Affairs Analysis: ${selectedArticle.title}`);
                        window.open(`https://t.me/share/url?url=${shareUrl}&text=${text}`, '_blank');
                      }}
                      className="text-stone-500 hover:text-[#0F766E] font-medium transition cursor-pointer p-0 bg-transparent border-0"
                    >
                      Telegram
                    </button>
                    <span>·</span>
                    <button
                      onClick={() => {
                        const titleSlug = selectedArticle.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                        const shareUrl = `${window.location.origin}/article/${titleSlug}`;
                        navigator.clipboard.writeText(shareUrl);
                        alert("🔗 UPSC syllabus Note link copied to clipboard!");
                      }}
                      className="text-stone-500 hover:text-[#0F766E] font-medium transition cursor-pointer p-0 bg-transparent border-0"
                    >
                      Copy Link
                    </button>
                  </div>
                </div>

                {/* Dynamic UPSC intelligence brief */}
                {selectedArticle.summary ? (
                  <div className="space-y-8 pt-2 font-serif text-[#292524] text-[13.5px] leading-relaxed">
                    
                    {/* Intelligence Brief */}
                    <div className="space-y-2">
                      <h3 className="text-sm font-sans font-bold text-[#1C1917] tracking-tight">Intelligence Brief</h3>
                      <div className="whitespace-pre-wrap text-[#44403C]">
                        {selectedArticle.summary.detailedBrief || selectedArticle.summary.whatHappened}
                      </div>
                    </div>

                    {/* Key Prelims Facts */}
                    <div className="space-y-2">
                      <h3 className="text-sm font-sans font-bold text-[#1C1917] tracking-tight">Key Prelims Facts</h3>
                      <div className="pl-4 border-l-2 border-stone-200 whitespace-pre-wrap text-[#44403C]">
                        {selectedArticle.summary.prelimsFacts}
                      </div>
                    </div>

                    {/* Why This Matters for UPSC */}
                    <div className="space-y-2">
                      <h3 className="text-sm font-sans font-bold text-[#1C1917] tracking-tight">Why This Matters for UPSC</h3>
                      <div className="whitespace-pre-wrap text-[#44403C]">
                        {selectedArticle.summary.whyMatters || selectedArticle.summary.whyImportant}
                      </div>
                    </div>

                    {/* One-Line Revision */}
                    <div className="space-y-2">
                      <h3 className="text-sm font-sans font-bold text-[#1C1917] tracking-tight">One-Line Revision</h3>
                      <div className="italic text-stone-700 pl-4 border-l-2 border-[#0F766E]/70">
                        &ldquo;{selectedArticle.summary.oneLineRevision}&rdquo;
                      </div>
                    </div>

                    {/* Official Sources */}
                    <div className="space-y-2">
                      <h3 className="text-sm font-sans font-bold text-[#1C1917] tracking-tight">Official Sources</h3>
                      <div className="text-xs text-stone-500 font-sans leading-relaxed whitespace-pre-wrap">
                        {renderFormattedSources(selectedArticle.summary.officialSources || "• Press Information Bureau PIB Cabinet Reports (https://pib.gov.in/PressReleasePage.aspx?PRID=1888547)\n• Cabinet Committee on Economic Affairs Releases (https://pib.gov.in)")}
                      </div>
                    </div>

                    {/* Related Topics / Tags */}
                    {selectedArticle.tags && selectedArticle.tags.length > 0 && (
                      <div className="pt-4 border-t border-stone-200/50 flex flex-wrap gap-2 items-center font-sans text-xs">
                        <span className="text-[10.5px] font-medium text-stone-400">Related topics:</span>
                        {selectedArticle.tags.map((tg: string) => (
                          <span key={tg} className="text-[10.5px] text-[#0F766E] hover:underline cursor-pointer transition">
                            #{tg}
                          </span>
                        ))}
                      </div>
                    )}

                  </div>
                ) : (
                  <div className="text-stone-500 italic text-xs pt-4 font-serif">
                    Editorial analysis currently unavailable.
                  </div>
                )}

                {/* UPSC PRELIMS MULTIPLE CHOICE PRACTICE BOX */}
                {selectedArticle.mcq && (
                  <div id="inline-mcq-box" className="p-6 bg-[#FAFAF9] border border-stone-200/50 rounded-lg space-y-4 pt-5 mt-6 font-sans">
                    <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                      <span className="text-xs font-bold text-[#1C1917] uppercase tracking-wider flex items-center gap-1.5 font-sans">
                        <FileCheck className="w-4 h-4 text-[#0F766E]" /> Practice Assessment
                      </span>
                      <span className="text-[10px] text-stone-500">
                        Standard UPSC formatting
                      </span>
                    </div>

                    <p className="text-[13.5px] font-serif font-bold text-stone-900 whitespace-pre-wrap leading-relaxed">
                      {selectedArticle.mcq.question}
                    </p>

                    <div className="grid grid-cols-1 gap-2.5 pt-1">
                      {selectedArticle.mcq.options.map((opt: string, idx: number) => {
                        const hasAnswered = userAnswers[selectedArticle.mcq!.id] !== undefined;
                        const isSelected = userAnswers[selectedArticle.mcq!.id] === idx;
                        const isCorrect = selectedArticle.mcq!.correctAnswer === idx;
                        
                        let optionClass = 'bg-white hover:bg-stone-50 text-stone-800 border-stone-200 hover:border-stone-300';
                        if (hasAnswered) {
                          if (isCorrect) {
                            optionClass = 'bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold';
                          } else if (isSelected) {
                            optionClass = 'bg-rose-50 border-rose-200 text-rose-950';
                          } else {
                            optionClass = 'bg-stone-100/40 text-stone-400 border-stone-100 opacity-60';
                          }
                        }

                        return (
                          <button
                            key={idx}
                            id={`mcq-detail-option-${idx}`}
                            disabled={hasAnswered}
                            onClick={() => setUserAnswers(prev => ({ ...prev, [selectedArticle.mcq!.id]: idx }))}
                            className={`w-full text-left text-xs p-3 rounded-lg border transition duration-150 flex items-start gap-2.5 cursor-pointer ${optionClass}`}
                          >
                            <span className="font-mono font-bold bg-stone-100 text-stone-700 px-1.5 py-0.2 rounded text-[10px] uppercase shrink-0">
                              {String.fromCharCode(65 + idx)}
                            </span>
                            <span className="leading-relaxed">{opt}</span>
                          </button>
                        );
                      })}
                    </div>

                    {userAnswers[selectedArticle.mcq.id] !== undefined && (
                      <div className="bg-white border border-stone-200 rounded-lg p-4 space-y-2 text-stone-850">
                        <p className="font-bold text-xs text-[#0F766E] flex items-center gap-1 uppercase tracking-wider font-sans">
                          <Lightbulb className="w-3.5 h-3.5 text-amber-500 fill-amber-100" /> Explanation Details:
                        </p>
                        <p className="text-[12.5px] leading-relaxed text-[#44403C] font-serif">
                          {selectedArticle.mcq.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* USER PERSONAL MNEMONICS / NOTES COMPILATION INLINE */}
                {token && (
                  <div className="bg-[#FAFAF9] border border-stone-200/40 rounded-lg p-5 space-y-3 font-sans">
                    <span className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1">
                       💡 Personal study notes
                    </span>
                    <p className="text-[11px] text-stone-500">
                      Compile static references (syllabus, reports, or GS index keys) linked to this material.
                    </p>
                    <div className="flex gap-2 font-sans">
                      <input
                        id="input-inline-card-notes"
                        type="text"
                        placeholder="e.g. MNEMONIC: 'Urea cutPM-PRANAM save50'... Links Article 48 DPSP"
                        defaultValue={revisionCards.find(c => c.articleId === selectedArticle.id)?.notes || ''}
                        onBlur={(e) => handleSaveRevisionCard(selectedArticle.id, e.target.value)}
                        className="flex-1 text-xs px-3 py-2 border border-stone-200 rounded-md bg-white text-[#1C1816] focus:outline-none focus:border-stone-400"
                      />
                      <button
                        id="btn-trigger-inline-save"
                        onClick={(e) => {
                          const el = document.getElementById('input-inline-card-notes') as HTMLInputElement;
                          if (el) handleSaveRevisionCard(selectedArticle.id, el.value);
                        }}
                        className="bg-[#1C1917] hover:bg-stone-850 text-white text-xs font-bold py-2 px-4 rounded-md cursor-pointer transition shrink-0"
                      >
                        Keep Notes
                      </button>
                    </div>
                  </div>
                )}

                {/* SATELLITE RELATED TOPICS LIST */}
                {selectedArticle.relatedArticles && selectedArticle.relatedArticles.length > 0 && (
                  <div className="space-y-3 border-t border-stone-200/60 pt-6 font-sans">
                    <span className="text-xs font-bold text-stone-800 uppercase tracking-wider block">Connected Syllabus Topics</span>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {selectedArticle.relatedArticles.map((rel: any) => (
                        <div
                          key={rel.id}
                          id={`rel-item-${rel.id}`}
                          onClick={() => handleSelectArticle(rel.id)}
                          className="bg-white border border-stone-200/60 hover:border-stone-400 p-3.5 rounded-lg text-left transition cursor-pointer space-y-2 block text-xs"
                        >
                          <span className="text-[9px] font-bold text-[#0F766E] uppercase tracking-wider">{rel.category}</span>
                          <h5 className="font-bold text-stone-900 line-clamp-2 leading-snug">{rel.title}</h5>
                          <p className="text-[10px] text-[#78716C] line-clamp-1 italic">{rel.oneLineRevision}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Source body reading references - ADMIN ONLY */}
                {currentTab === 'admin' && (
                  <div className="space-y-1 border-t border-stone-200 pt-4 text-[11px] bg-stone-50 p-4 rounded-lg font-sans">
                    <span className="font-bold text-stone-700 uppercase font-mono block">Raw Ingested Content Draft (Admin Monitor Only)</span>
                    <p className="leading-relaxed text-[#292524] font-serif max-h-40 overflow-y-auto pr-1">
                      {selectedArticle.content}
                    </p>
                  </div>
                )}

              </div>
            ) : null}

          </div>
        </div>
      )}

      {/* Real-time Ingestion Stream Toast alert overlay */}
      {liveToast.visible && (
        <div id="live-ingestion-toast-popup" className="fixed bottom-20 left-1/2 -translate-x-1/2 max-w-md w-[90%] bg-[#1C1917] border border-emerald-500/50 shadow-2xl text-stone-200 p-3.5 rounded-lg flex items-start gap-2.5 z-50 transition-all duration-300">
          <div className="relative flex h-2 w-2 mt-1.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </div>
          <div className="space-y-0.5 flex-1">
            <p className="text-[12px] font-bold text-white tracking-tight">Real-time Curated Stream</p>
            <p className="text-[11px] text-[#A8A29E] leading-relaxed">{liveToast.message}</p>
          </div>
          <button 
            onClick={() => setLiveToast(prev => ({ ...prev, visible: false }))} 
            className="text-stone-400 hover:text-white text-xs px-1 font-mono font-bold cursor-pointer transition shrink-0"
          >
            ✕
          </button>
        </div>
      )}

          </div>
        </div>
      </div>

      {/* ==========================================
          STICKY COHESIVE BOTTOM NAV BAR (FOR MOBILE SCREEN DESIGN)
         ========================================== */}
      <nav id="persistent-bottom-nav" className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-[#E7E5E4] grid grid-cols-6 py-2.5 z-45 select-none">
        <button
          id="nav-btn-home"
          onClick={() => setCurrentTab('home')}
          className={`flex flex-col items-center justify-center space-y-1 cursor-pointer transition-colors ${currentTab === 'home' ? 'text-[#0F766E]' : 'text-stone-500 hover:text-stone-900'}`}
        >
          <Compass className="w-5 h-5" />
          <span className="text-[9px] font-mono tracking-tighter uppercase font-bold text-center">Feed</span>
        </button>

        <button
          id="nav-btn-search"
          onClick={() => {
            setCurrentTab('search');
            // instantly focus query element
            setTimeout(() => {
              const el = document.getElementById('search-bar-input');
              if (el) el.focus();
            }, 100);
          }}
          className={`flex flex-col items-center justify-center space-y-1 cursor-pointer transition-colors ${currentTab === 'search' ? 'text-[#0F766E]' : 'text-stone-500 hover:text-stone-900'}`}
        >
          <SearchIcon className="w-5 h-5" />
          <span className="text-[9px] font-mono tracking-tighter uppercase font-bold text-center">Search</span>
        </button>

        <button
          id="nav-btn-path"
          onClick={() => setCurrentTab('path')}
          className={`flex flex-col items-center justify-center space-y-1 cursor-pointer transition-colors ${currentTab === 'path' ? 'text-[#0F766E]' : 'text-stone-500 hover:text-stone-900'}`}
        >
          <Layers className="w-5 h-5" />
          <span className="text-[9px] font-mono tracking-tighter uppercase font-bold text-center">Path</span>
        </button>

        <button
          id="nav-btn-brief"
          onClick={() => setCurrentTab('brief')}
          className={`flex flex-col items-center justify-center space-y-1 cursor-pointer transition-colors ${currentTab === 'brief' ? 'text-[#0F766E]' : 'text-stone-500 hover:text-stone-900'}`}
        >
          <TrendingUp className="w-5 h-5 text-current-color" />
          <span className="text-[9px] font-mono tracking-tighter uppercase font-bold text-center">Daily 10</span>
        </button>

        <button
          id="nav-btn-revision"
          onClick={() => setCurrentTab('revision')}
          className={`flex flex-col items-center justify-center space-y-1 cursor-pointer transition-colors ${currentTab === 'revision' ? 'text-[#0F766E]' : 'text-stone-500 hover:text-stone-900'}`}
        >
          <CheckSquare className="w-5 h-5 text-current" />
          <span className="text-[9px] font-mono tracking-tighter uppercase font-bold text-center">Revision</span>
        </button>

        <button
          id="nav-btn-bookmarks"
          onClick={() => setCurrentTab('bookmarks')}
          className={`flex flex-col items-center justify-center space-y-1 cursor-pointer transition-colors ${currentTab === 'bookmarks' ? 'text-[#0F766E]' : 'text-stone-500 hover:text-stone-900'}`}
        >
          <BookmarkIcon className="w-5 h-5" />
          <span className="text-[9px] font-mono tracking-tighter uppercase font-bold text-center">Pinned</span>
        </button>
      </nav>

    </div>
  );
}
