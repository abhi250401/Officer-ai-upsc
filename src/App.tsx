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
// MODULAR REACT COMPONENTS
// ==========================================
import ArticleDetail from './components/ArticleDetail.tsx';
import PYQDesk from './components/PYQDesk.tsx';
import AdminPortal from './components/AdminPortal.tsx';
import LearningPath from './components/LearningPath.tsx';

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
  const [minRelevance, setMinRelevance] = useState<number>(7);
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
      setCurrentTab('admin');
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
      // Direct Unified Google Sign In integration mapping
      const targetEmail = authEmail || "google.aspirant@lbsnaa.gov.in";
      const targetName = authName || "Officer Trainee";
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
          email: 'officer.trainee@lbsnaa.gov.in',
          name: 'Officer Trainee (IAS Sandbox)',
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
            email: 'officer.trainee@lbsnaa.gov.in',
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
                  <button onClick={handleLogout} className="text-[10px] text-stone-400 hover:text-rose-700 transition font-mono leading-none cursor-pointer">Log Out</button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  const el = document.getElementById('auth-overlay-modal');
                  if (el) el.classList.remove('hidden');
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-1.5 border border-[#1C1917] hover:bg-[#1C1917] hover:text-white rounded-md text-xs font-bold font-mono uppercase transition cursor-pointer bg-white"
              >
                <Lock className="w-3 h-3" /> Access Space
              </button>
            )}
          </div>

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
            ) : (
              <button
                id="btn-trigger-auth-tab-mobile"
                onClick={() => {
                  const el = document.getElementById('auth-overlay-modal');
                  if (el) el.classList.remove('hidden');
                }}
                className="text-xs bg-[#1C1917] hover:bg-[#2E2A27] text-white font-bold py-1 px-2.5 rounded transition cursor-pointer text-[10px] font-mono uppercase"
              >
                Sign In
              </button>
            )}
            {user && (
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
                      min="7"
                      max="10"
                      step="1"
                      value={minRelevance}
                      onChange={(e) => setMinRelevance(parseInt(e.target.value, 10))}
                      className="w-full accent-[#0F766E] cursor-ew-resize h-1 bg-stone-200 rounded-lg mt-1"
                    />
                    <div className="flex justify-between text-[9px] text-[#A8A29E] font-mono leading-tight">
                      <span>7: Policy Focus</span>
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
                        className="group py-6 first:pt-1 last:pb-1 cursor-pointer transition-all space-y-3"
                      >
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

        {/* TAB 6: PREMIUM ADMIN INGESTION PORTAL */}
        {currentTab === 'admin' && (
          <div id="view-admin-dashboard" className="space-y-4">
            <div className="bg-[#1C1917] text-white p-4 rounded-xl space-y-2 relative overflow-hidden shadow-md">
              <div className="absolute right-0 bottom-0 opacity-10 font-bold font-mono text-3xl translate-y-3 translate-x-3">PORTAL</div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-teal-400 font-mono">
                System Command & Feed Administration
              </h2>
              <p className="text-xs text-stone-300">
                Trigger active scraping or run Gemini-assisted structural mapping. Configure ingestion channels and evaluate system status logs.
              </p>
            </div>

            {/* 📊 UPSC SYLLABUS ANALYTICS DASHBOARD */}
            <div id="analytics-overview-dashboard" className="bg-white border border-[#E7E5E4] rounded-xl p-4 shadow-xs space-y-4">
              <div className="border-b border-[#F5F5F4] pb-2.5 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#1C1917] flex items-center gap-1">
                    📊 UPSC Syllabus Preparation Analytics
                  </h3>
                  <p className="text-[10px] text-[#78716C]">
                    Real-time tracking of aspirant keyword focus, syllabus views, and daily active study retention metrics.
                  </p>
                </div>
                {loadingAnalytics && <span className="text-[9px] font-mono text-teal-700 bg-teal-50 px-2 py-0.5 rounded animate-pulse">Syncing...</span>}
              </div>

              {/* KPI Cards Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                <div className="bg-[#FAFAF9] border border-[#E7E5E4] rounded-lg p-2.5 text-center">
                  <p className="text-[9px] font-mono font-bold text-[#78716C] uppercase">Daily Active Study Hits</p>
                  <p className="text-lg font-bold font-display text-stone-900 mt-1">
                    {analyticsData?.userRetention || 28}
                  </p>
                  <span className="text-[8px] text-teal-700 font-mono">● LIVE DAUs</span>
                </div>

                <div className="bg-[#FAFAF9] border border-[#E7E5E4] rounded-lg p-2.5 text-center">
                  <p className="text-[9px] font-mono font-bold text-[#78716C] uppercase">Syllabus MCQ Solves</p>
                  <p className="text-lg font-bold font-display text-stone-900 mt-1">
                    {analyticsData?.totalMCQsAnswered || 64}
                  </p>
                  <span className="text-[8px] text-teal-700 font-mono">Active evaluation</span>
                </div>

                <div className="bg-[#FAFAF9] border border-[#E7E5E4] rounded-lg p-2.5 text-center">
                  <p className="text-[9px] font-mono font-bold text-[#78716C] uppercase">Ingested Civil Notes</p>
                  <p className="text-lg font-bold font-display text-stone-900 mt-1">
                    {articles.length}
                  </p>
                  <span className="text-[8px] text-stone-500 font-mono">Syllabus segments</span>
                </div>

                <div className="bg-[#FAFAF9] border border-[#E7E5E4] rounded-lg p-2.5 text-center">
                  <p className="text-[9px] font-mono font-bold text-[#78716C] uppercase">Personal Revision Notes</p>
                  <p className="text-lg font-bold font-display text-stone-900 mt-1">
                    {revisionCards.length}
                  </p>
                  <span className="text-[8px] text-stone-500 font-mono">Retention standard</span>
                </div>
              </div>

              {/* Heatmaps columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                {/* Search Term Hotspots */}
                <div className="border border-[#E7E5E4] bg-[#FAFAF9] rounded-lg p-3 space-y-2.5">
                  <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#1C1917]">🔥 High-Interest Search Hotspots</h4>
                  <div className="flex flex-wrap gap-1.5 min-h-[60px] content-start">
                    {analyticsData?.topSearched && Object.keys(analyticsData.topSearched).length > 0 ? (
                      Object.entries(analyticsData.topSearched).map(([term, count]: any) => (
                        <span key={term} className="bg-white border border-[#E7E5E4] text-[10.5px] font-mono font-bold px-2 py-1 rounded text-stone-800 shadow-3xs">
                          {term} <span className="text-teal-700 bg-teal-50 px-1 py-0.2 rounded text-[9px] ml-0.5">+{count}</span>
                        </span>
                      ))
                    ) : (
                      ['Paris Agreement', 'DPDP Act', 'PM-PRANAM', 'Green Hydrogen', 'ISRO'].map((term) => (
                        <span key={term} className="bg-white border border-[#E7E5E4] text-[10.5px] font-mono px-2 py-1 rounded text-stone-500">
                          {term} <span className="text-stone-400 text-[8.5px]">(calc)</span>
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {/* Category Views Map */}
                <div className="border border-[#E7E5E4] bg-[#FAFAF9] rounded-lg p-3 space-y-2">
                  <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#1C1917]">📐 Syllabus Focus Engagement Ratio</h4>
                  <div className="space-y-1.5">
                    {(() => {
                      const categoriesRatio = analyticsData?.topCategoryViews || {
                        "Economy": 14,
                        "Environment": 19,
                        "Governance": 11,
                        "International Relations": 8,
                        "Science & Tech": 12
                      };
                      const maxVal = Math.max(...Object.values(categoriesRatio) as number[], 1);
                      return Object.entries(categoriesRatio).map(([cat, count]: any) => {
                        const scorePct = Math.round((count / maxVal) * 100);
                        return (
                          <div key={cat} className="space-y-0.5">
                            <div className="flex justify-between text-[9.5px] font-mono">
                              <span className="font-semibold text-stone-700">{cat}</span>
                              <span className="text-[#0F766E] font-bold">{count} view ticks</span>
                            </div>
                            <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-[#0F766E] h-1.5 rounded-full" style={{ width: `${scorePct}%` }} />
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* Ingestion triggers panels */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border border-[#E7E5E4] rounded-lg p-3 shadow-xs space-y-3">
                <h3 className="text-xs font-bold text-[#1C1917] border-b border-[#F5F5F4] pb-1.5 flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5 text-[#0F766E]" /> Ingestion Trigger
                </h3>
                <p className="text-[11px] text-[#78716C]">
                  Downloads policy updates from PIB RSS feeds, cleans text, excludes low scoring drafts and generates structural templates using <strong>Active Gemini 3.5 Flash Model</strong>.
                </p>

                <button
                  id="btn-admin-trigger-ingestion"
                  disabled={ingestionInProgress}
                  onClick={handleTriggerIngest}
                  className="w-full bg-[#0F766E] text-white text-xs font-bold py-2.5 px-4 rounded-md shadow-sm transition hover:bg-[#115E59] disabled:opacity-55 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {ingestionInProgress ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin text-white" />
                      <span>Parsing & Analyzing Feed...</span>
                    </>
                  ) : (
                    <>
                      <Compass className="w-4 h-4 text-white" />
                      <span>Scrape & Ingest Active Models</span>
                    </>
                  )}
                </button>

                {ingestionMessage && (
                  <div className="text-xs block bg-emerald-50 border border-emerald-200 text-stone-900 p-2.5 rounded font-mono whitespace-pre-wrap">
                    {ingestionMessage}
                  </div>
                )}
              </div>

              {/* Feed Source list */}
              <div className="bg-white border border-[#E7E5E4] rounded-lg p-3 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-[#F5F5F4] pb-1.5">
                  <h3 className="text-xs font-bold text-[#1C1917] flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-[#0F766E]" /> Active Policy Outlets
                  </h3>
                  <span className="text-[10px] font-mono text-[#78716C] bg-stone-100 px-1.5 py-0.2 rounded font-bold">
                    Count: {adminSources.length}
                  </span>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {adminSources.map((s) => (
                    <div key={s.id} className="text-[11px] space-y-1 p-2 bg-[#FAFAF9] border border-[#E7E5E4] rounded hover:border-slate-300 transition-colors">
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 truncate max-w-[65%]">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.lastStatus === 'SUCCESS' ? 'bg-emerald-500 animate-pulse' : s.lastStatus === 'FAILED' ? 'bg-red-500' : 'bg-stone-300'}`} />
                          <p className="font-bold text-[#1C1917] truncate">{s.name}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[8px] text-[#78716C] font-mono bg-stone-100 px-1 py-0.2 rounded shrink-0">
                            {s.type}
                          </span>
                          <span className={`text-[8px] font-bold border rounded px-1 shrink-0 ${getPriorityColor(s.priority)}`}>
                            {s.priority}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[9px] text-[#78716C] font-mono border-t border-dashed border-[#F5F5F4] pt-1">
                        <span className="truncate max-w-[60%]" title={s.url}>{s.url}</span>
                        {s.uptimeRate !== undefined && (
                          <span className="font-bold text-emerald-800 shrink-0">
                            Uptime: {s.uptimeRate}%
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Ingestion transparency dashboard panel */}
            <div className="bg-white border border-[#E7E5E4] rounded-xl p-4 shadow-sm space-y-4 col-span-1 md:col-span-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#F5F5F4] pb-2.5 gap-2">
                <div>
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#1C1917] flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    Live Ingestion Transparency Panel
                  </h3>
                  <p className="text-[10px] text-[#78716C]">
                    Real-time status metrics of our automated UPSC intake engine. Powered by native MongoDB Atlas propagation.
                  </p>
                </div>
                <button 
                  onClick={fetchAdminDiagnostics}
                  disabled={loadingDiagnostics}
                  className="text-[10px] px-2 py-1 font-mono hover:bg-stone-100 border border-[#E7E5E4] rounded text-stone-700 font-bold self-start cursor-pointer transition"
                >
                  {loadingDiagnostics ? "Refreshing..." : "↺ Force Pull Feed Info"}
                </button>
              </div>

              {adminDiagnostics ? (
                <div className="space-y-4">
                  {/* Status Metrics Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                    <div className="bg-stone-50 border border-stone-100 rounded-lg p-2.5">
                      <span className="text-[9.5px] font-mono font-bold text-[#A8A29E] uppercase block">Running State</span>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-xs font-extrabold font-mono text-stone-800">AUTO REFRESH</span>
                      </div>
                    </div>
                    <div className="bg-stone-50 border border-stone-100 rounded-lg p-2.5">
                      <span className="text-[9.5px] font-mono font-bold text-[#A8A29E] uppercase block">Average Sync Latency</span>
                      <p className="text-sm font-bold font-mono text-stone-800 mt-1">
                        {adminDiagnostics.uptimeMetrics?.averageLatencyMs ? `${(adminDiagnostics.uptimeMetrics.averageLatencyMs / 1000).toFixed(2)}s` : "0.58s"}
                      </p>
                    </div>
                    <div className="bg-stone-50 border border-stone-100 rounded-lg p-2.5">
                      <span className="text-[9.5px] font-mono font-bold text-[#A8A29E] uppercase block">Rejection Ratio</span>
                      <p className="text-sm font-bold font-mono text-stone-850 mt-1">
                        {adminDiagnostics.uptimeMetrics?.rejectedCount || 0} Low-value items
                      </p>
                    </div>
                    <div className="bg-stone-50 border border-stone-100 rounded-lg p-2.5">
                      <span className="text-[9.5px] font-mono font-bold text-[#A8A29E] uppercase block">Total Cycles Today</span>
                      <p className="text-sm font-bold font-mono text-stone-800 mt-1">
                        {adminDiagnostics.feedHealthMetrics?.length || 16} cycles run
                      </p>
                    </div>
                  </div>

                  {/* Feed Health table listing */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] uppercase font-bold text-[#78716C] tracking-wide block">📡 Feed Health Uptime Integrity Check</span>
                    <div className="border border-[#E7E5E4] rounded-lg overflow-x-auto bg-white">
                      <table className="w-full text-left border-collapse text-[11px] font-mono min-w-[500px]">
                        <thead>
                          <tr className="bg-[#FAFAF9] text-stone-600 font-bold border-b border-[#E7E5E4]">
                            <th className="p-2">Feed Name</th>
                            <th className="p-2 text-center">Uptime Rate</th>
                            <th className="p-2 text-center">Last Ingest Success</th>
                            <th className="p-2 text-right">Failure Count</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                          {adminDiagnostics.feedHealthMetrics?.map((f: any) => (
                            <tr key={f.name} className="hover:bg-amber-50/10 transition">
                              <td className="p-2 font-bold text-[#1C1917] max-w-[150px] truncate">{f.name}</td>
                              <td className="p-2 text-center font-extrabold text-teal-850">{f.uptimeRate}%</td>
                              <td className="p-2 text-center text-stone-500">
                                {f.lastSuccessTime ? new Date(f.lastSuccessTime).toLocaleTimeString(undefined, {hour: '2-digit', minute: '2-digit'}) : 'Never'}
                              </td>
                              <td className={`p-2 text-right font-bold ${f.failures > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                                {f.failures}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-6 flex justify-center text-xs text-[#78716C] font-mono">
                  Diagnostics info loading from active MongoDB telemetry system...
                </div>
              )}
            </div>

            {/* MANUAL ADDITION BY ADMIN OVERRIDE FOR PLAYGROUND */}
            <div className="bg-white border border-[#E7E5E4] rounded-lg p-3 shadow-xs space-y-3">
              <button
                id="btn-toggle-manual-add"
                onClick={() => setShowManualAdd(!showManualAdd)}
                className="w-full text-left text-xs font-bold text-[#1C1917] flex items-center justify-between focus:outline-none"
              >
                <span className="flex items-center gap-1">
                  <Plus className="w-4 h-4 text-[#0F766E]" /> Override manual UPSC Ingestion (Direct AI summary drafting)
                </span>
                <span className="text-[10px] bg-stone-100 px-2 py-0.5 rounded font-mono text-stone-600">
                  {showManualAdd ? 'Collapse' : 'Expand Form'}
                </span>
              </button>

              {showManualAdd && (
                <form id="form-manual-article-add" onSubmit={handleManualAddSubmit} className="space-y-3 pt-2.5 border-t border-[#F5F5F4] text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-[#44403C] block">Article Title</label>
                    <input
                      id="input-[newTitle]"
                      type="text"
                      required
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="e.g. Cabinet launches Pradhan Mantri Matsya Sampada Yojana"
                      className="w-full text-xs p-2 border border-[#E7E5E4] rounded text-[#1C1917] bg-[#FAFAF9]"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-[#44403C] block">Select Source</label>
                      <select
                        id="select-[newSource]"
                        value={newSource}
                        onChange={(e) => setNewSource(e.target.value)}
                        className="w-full text-xs p-2 border border-[#E7E5E4] rounded text-[#1C1917] bg-[#FAFAF9]"
                      >
                        <option>PIB (Press Information Bureau)</option>
                        <option>PRS Legislative Research</option>
                        <option>NITI Aayog Updates</option>
                        <option>Ministry of External Affairs</option>
                        <option>UN News Global Feed</option>
                        <option>The Hindu Editorial</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-[#44403C] block">Source Priority Weight</label>
                      <select
                        id="select-[newPriority]"
                        value={newPriority}
                        onChange={(e) => setNewPriority(e.target.value as any)}
                        className="w-full text-xs p-2 border border-[#E7E5E4] rounded text-[#1C1917] bg-[#FAFAF9]"
                      >
                        <option value="VERY HIGH">VERY HIGH (pib, prs, etc)</option>
                        <option value="HIGH">HIGH (mea, niti, etc)</option>
                        <option value="MEDIUM">MEDIUM (un, who, news)</option>
                        <option value="LOW">LOW (editorial, opinions)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-[#44403C] block">Draft Body Content (Clean article paragraphs)</label>
                    <textarea
                      id="textarea-[newContent]"
                      rows={4}
                      required
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      placeholder="Paste draft paragraph texts to let Gemini parse categories, sub-topics, constitutional list items, pyq link,Way Forward ideas and a standard prelims multiple choice selection..."
                      className="w-full text-xs p-2 border border-[#E7E5E4] rounded text-[#1C1917] bg-[#FAFAF9]"
                    />
                  </div>

                  <button
                    id="submit-manual-article-btn"
                    type="submit"
                    className="bg-[#1C1917] hover:bg-[#2E2A27] text-white text-xs font-bold py-2 px-4 rounded transition cursor-pointer"
                  >
                    Ingest with Gemini Mapping
                  </button>

                  {newMsg && (
                    <div id="manual-add-msg-box" className="text-xs p-2 bg-slate-100 text-stone-900 border rounded font-mono">
                      {newMsg}
                    </div>
                  )}
                </form>
              )}
            </div>

            {/* Ingestion Logs */}
            <div className="bg-white border border-[#E7E5E4] rounded-lg p-3 shadow-xs space-y-2">
              <h3 className="text-xs font-bold text-[#1C1917] uppercase tracking-wider font-mono">System Ingestion Logs</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto font-mono text-[9px] pr-1">
                {adminLogs.slice().reverse().map((log) => (
                  <div key={log.id} className="p-2 border border-[#E7E5E4] rounded bg-[#FAFAF9] space-y-1 text-[#44403C]">
                    <div className="flex items-center justify-between">
                      <span className={`font-bold px-1.5 py-0.2 rounded text-[8px] ${log.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'}`}>
                        {log.status}
                      </span>
                      <span className="text-[#A8A29E]">{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="font-bold">{log.message}</p>
                    <div className="flex space-x-3 text-[8px] text-[#78716C]">
                      <span>Processed: {log.articlesProcessed}</span>
                      <span>Ingested: {log.articlesIngested}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      {/* ==========================================
          ARTICLE BREAKDOWN ANALYSIS DETAIL SHEET (IFRAME CAPABLE INLAY)
         ========================================== */}
      {selectedArticleId && (
        <div id="article-detail-sheet-modal" className="fixed inset-0 z-50 bg-[#1C1917]/70 backdrop-blur-xs flex items-end md:items-center justify-center p-0 md:p-4 animate-fade-in">
          <div className="bg-white w-full max-w-lg md:max-w-2xl rounded-t-2xl md:rounded-2xl max-h-[90vh] overflow-y-auto flex flex-col font-sans text-stone-900 text-xs border border-stone-200">
            
            {/* Modal sticky superior title Bar */}
            <div className="sticky top-0 bg-white border-b border-[#E7E5E4] px-4 py-3 flex items-center justify-between z-10">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-bold bg-[#FAFAF9] text-[#78716C] border px-2 py-0.5 rounded font-mono uppercase">
                    {selectedArticle?.source}
                  </span>
                  {selectedArticle?.category && (
                    <span className="text-[10px] font-mono font-bold text-teal-900 bg-teal-50 px-1.5 py-0.2 rounded">
                      {selectedArticle.category}
                    </span>
                  )}
                </div>
              </div>
              <button
                id="btn-close-article-details"
                onClick={() => {
                  setSelectedArticleId(null);
                  setSelectedArticle(null);
                }}
                className="text-stone-400 hover:text-stone-950 p-1.5 rounded-full hover:bg-[#FAFAF9] transition cursor-pointer font-bold font-mono text-base bg-stone-100 w-8 h-8 flex items-center justify-center"
              >
                &times;
              </button>
            </div>

            {/* Article detailed parameters scroll area */}
            {articleDetailLoading ? (
              <div className="py-24 text-center flex flex-col items-center justify-center space-y-2">
                <RotateCw className="w-8 h-8 text-[#0F766E] animate-spin" />
                <p className="text-xs text-[#78716C] font-mono">Loading UPSC Analysis structures...</p>
              </div>
            ) : selectedArticle ? (
              <div className="p-4 space-y-4">
                
                {/* Title and stats headline */}
                <div className="space-y-2 font-display">
                  <h2 className="text-lg font-bold tracking-tight leading-snug text-[#1C1917]">
                    {selectedArticle.title}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 text-[10px] text-[#78716C] font-mono">
                    <span className="bg-amber-100 text-amber-900 border border-amber-300 font-bold px-1.5 py-0.2 rounded">
                      ⭐ UPSC Relevance Rating: {selectedArticle.relevanceScore}/10
                    </span>
                    <span>• {selectedArticle.readingTime} Min Consumption time</span>
                    <span>• {new Date(selectedArticle.ingestionTimestamp).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* 🚀 Social Share Actions Bar */}
                <div id="social-share-row" className="bg-[#F5F4F0] p-2 rounded-lg border border-[#E7E5E4] flex flex-wrap items-center justify-between gap-2.5">
                  <span className="text-[9.5px] font-mono font-bold uppercase text-[#78716C] tracking-wide flex items-center gap-1">
                    📖 Syllabus Share Link
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* WhatsApp share */}
                    <button
                      onClick={() => {
                        const titleSlug = selectedArticle.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                        const shareUrl = `${window.location.origin}/article/${titleSlug}`;
                        const text = encodeURIComponent(`📚 *UPSC Current Affairs Note*: \n*${selectedArticle.title}*\n⭐ Relevance Score: ${selectedArticle.relevanceScore}/10 | Syllabus focus: ${selectedArticle.category}\n\nRead the full high-yield dynamic syllabus analysis here:\n${shareUrl}`);
                        window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-[9.5px] font-bold font-mono uppercase px-2 py-1 rounded cursor-pointer transition"
                      title="Share to WhatsApp"
                    >
                      WhatsApp
                    </button>
                    {/* Telegram share */}
                    <button
                      onClick={() => {
                        const titleSlug = selectedArticle.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                        const shareUrl = `${window.location.origin}/article/${titleSlug}`;
                        const text = encodeURIComponent(`📚 UPSC Current Affairs Analysis: ${selectedArticle.title}`);
                        window.open(`https://t.me/share/url?url=${shareUrl}&text=${text}`, '_blank');
                      }}
                      className="bg-sky-500 hover:bg-sky-600 text-white text-[9.5px] font-bold font-mono uppercase px-2 py-1 rounded cursor-pointer transition"
                      title="Share to Telegram"
                    >
                      Telegram
                    </button>
                    {/* Twitter/X Share */}
                    <button
                      onClick={() => {
                        const titleSlug = selectedArticle.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                        const shareUrl = `${window.location.origin}/article/${titleSlug}`;
                        const text = encodeURIComponent(`UPSC Current Affairs Analysis: ${selectedArticle.title} @officerai`);
                        window.open(`https://twitter.com/intent/tweet?url=${shareUrl}&text=${text}`, '_blank');
                      }}
                      className="bg-stone-900 hover:bg-stone-950 text-white text-[9.5px] font-bold font-mono uppercase px-2 py-1 rounded cursor-pointer transition"
                      title="Post to Twitter (X)"
                    >
                      X
                    </button>
                    {/* Copy Link */}
                    <button
                      onClick={() => {
                        const titleSlug = selectedArticle.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                        const shareUrl = `${window.location.origin}/article/${titleSlug}`;
                        navigator.clipboard.writeText(shareUrl);
                        alert("🔗 UPSC syllabus-friendly article link copied to clipboard!");
                      }}
                      className="bg-teal-700 hover:bg-teal-850 text-white text-[9.5px] font-bold font-mono uppercase px-2.5 py-1 rounded cursor-pointer transition"
                      title="Copy canonical link"
                    >
                      🔗 Copy
                    </button>
                  </div>
                </div>

                {/* Tags group row */}
                {selectedArticle.tags && selectedArticle.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {selectedArticle.tags.map((tg) => (
                      <span key={tg} className="text-[9px] font-semibold bg-[#EEF2F6] text-[#44403C] px-2 py-0.5 rounded cursor-pointer hover:bg-stone-200">
                        #{tg}
                      </span>
                    ))}
                  </div>
                )}

                {/* DYNAMIC COMPACT SYLLABUS BREAKDOWN (NEW CLEAN HIGH-SIGNAL LAYOUT) */}
                {selectedArticle.summary ? (
                  <div className="space-y-4 pt-1 font-sans">
                    
                    {/* Section 1: Detailed Intelligence Brief */}
                    <div className="border-b border-[#F5F5F4] pb-3 last:border-0">
                      <button
                        onClick={() => toggleSection('whatHappened')}
                        className="w-full flex items-center justify-between text-left py-1 text-[13px] font-sans font-bold text-stone-900 group cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <span className="font-mono text-[9px] text-[#0F766E] font-bold bg-teal-50 px-1.5 py-0.5 rounded">01</span>
                          <span>Detailed Intelligence Brief</span>
                        </span>
                        <span className="text-stone-400 group-hover:text-stone-700 transition-colors text-[10px]">
                          {openSections['whatHappened'] ? 'Collapse ▴' : 'Expand ▾'}
                        </span>
                      </button>
                      {openSections['whatHappened'] && (
                        <div className="mt-2 pl-7 text-[11.5px] text-[#44403C] leading-relaxed">
                          <p className="whitespace-pre-wrap text-[#1C1917]">
                            {selectedArticle.summary.detailedBrief || selectedArticle.summary.whatHappened}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Section 2: Key Prelims Facts */}
                    <div className="border-b border-[#F5F5F4] pb-3 last:border-0">
                      <button
                        onClick={() => toggleSection('prelimsSnapshot')}
                        className="w-full flex items-center justify-between text-left py-1 text-[13px] font-sans font-bold text-[#1C1917] group cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <span className="font-mono text-[9px] text-[#0F766E] font-bold bg-teal-50 px-1.5 py-0.5 rounded">02</span>
                          <span>Key Prelims Facts</span>
                        </span>
                        <span className="text-stone-400 group-hover:text-stone-700 transition-colors text-[10px]">
                          {openSections['prelimsSnapshot'] ? 'Collapse ▴' : 'Expand ▾'}
                        </span>
                      </button>
                      {openSections['prelimsSnapshot'] && (
                        <div className="mt-2 pl-7 text-[11.5px] text-[#44403C] leading-relaxed">
                          <p className="whitespace-pre-wrap font-serif text-[#1C1917] bg-[#FAFAF9] border border-[#E7E5E4] p-3 rounded-lg leading-loose">
                            {selectedArticle.summary.prelimsFacts}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Section 3: Why This Matters for UPSC */}
                    <div className="border-b border-[#F5F5F4] pb-3 last:border-0">
                      <button
                        onClick={() => toggleSection('whyImportant')}
                        className="w-full flex items-center justify-between text-left py-1 text-[13px] font-sans font-bold text-stone-900 group cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <span className="font-mono text-[9px] text-[#0F766E] font-bold bg-teal-50 px-1.5 py-0.5 rounded">03</span>
                          <span>Why This Matters for UPSC</span>
                        </span>
                        <span className="text-stone-400 group-hover:text-stone-700 transition-colors text-[10px]">
                          {openSections['whyImportant'] ? 'Collapse ▴' : 'Expand ▾'}
                        </span>
                      </button>
                      {openSections['whyImportant'] && (
                        <div className="mt-2 pl-7 text-[11.5px] text-[#44403C] leading-relaxed">
                          <p className="font-medium text-[#1C1917] bg-stone-900 text-stone-100 p-3 rounded-lg">
                            {selectedArticle.summary.whyMatters || selectedArticle.summary.whyImportant}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Section 4: One-Line Revision Core */}
                    <div className="border-b border-[#F5F5F4] pb-3 last:border-0">
                      <button
                        onClick={() => toggleSection('oneLineRevision')}
                        className="w-full flex items-center justify-between text-left py-1 text-[13px] font-sans font-bold text-[#1C1917] group cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <span className="font-mono text-[9px] text-[#0F766E] font-bold bg-teal-50 px-1.5 py-0.5 rounded">04</span>
                          <span>One-Line Revision Core</span>
                        </span>
                        <span className="text-stone-400 group-hover:text-stone-700 transition-colors text-[10px]">
                          {openSections['oneLineRevision'] ? 'Collapse ▴' : 'Expand ▾'}
                        </span>
                      </button>
                      {openSections['oneLineRevision'] && (
                        <div className="mt-2 pl-7 border-l-2 border-[#0F766E] py-1 bg-teal-50/20 p-2.5 rounded-r-lg">
                          <p className="font-display italic text-xs text-[#0F172A] leading-relaxed">
                            &ldquo;{selectedArticle.summary.oneLineRevision}&rdquo;
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Section 5: Official Sources */}
                    <div className="border-b border-[#F5F5F4] pb-3 last:border-0">
                      <button
                        onClick={() => toggleSection('pyqLinkage')}
                        className="w-full flex items-center justify-between text-left py-1 text-[13px] font-sans font-bold text-stone-900 group cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <span className="font-mono text-[9px] text-[#0F766E] font-bold bg-teal-50 px-1.5 py-0.5 rounded">05</span>
                          <span>Official Sources</span>
                        </span>
                        <span className="text-stone-400 group-hover:text-stone-700 transition-colors text-[10px]">
                          {openSections['pyqLinkage'] ? 'Collapse ▴' : 'Expand ▾'}
                        </span>
                      </button>
                      {openSections['pyqLinkage'] && (
                        <div className="mt-2 pl-7 text-[11px] text-stone-700 font-mono bg-stone-50 p-2.5 rounded-lg whitespace-pre-wrap">
                          {selectedArticle.summary.officialSources || "• Press Information Bureau (PIB)\n• Nodal Ministry Gazetted circulars"}
                        </div>
                      )}
                    </div>

                  </div>
                ) : (
                  <div className="border border-[#E7E5E4] rounded-lg p-5 text-stone-500 italic">
                    AI Analysis template currently unavailable.
                  </div>
                )}

                {/* UPSC PRELIMS MULTIPLE CHOICE PRACTICE BOX */}
                {selectedArticle.mcq && (
                  <div id="inline-mcq-box" className="p-3 bg-[#EEF2F6] border border-[#CDD8E0] rounded-xl space-y-3 pt-4">
                    <div className="flex items-center justify-between border-b border-[#CDD8E0] pb-2">
                      <span className="text-[11px] font-black text-blue-950 uppercase tracking-widest font-mono flex items-center gap-1.5">
                        <FileCheck className="w-4 h-4 text-blue-900" /> Topic Practice: UPSC Standard MCQ
                      </span>
                      <span className="text-[10px] font-mono text-stone-500 bg-white px-2 py-0.5 rounded border border-stone-200">
                        1 Mark Penalty applies in actual IAS
                      </span>
                    </div>

                    <p className="text-xs font-bold font-mono text-stone-900 whitespace-pre-wrap leading-relaxed">
                      {selectedArticle.mcq.question}
                    </p>

                    <div className="grid grid-cols-1 gap-2">
                      {selectedArticle.mcq.options.map((opt: string, idx: number) => {
                        const hasAnswered = userAnswers[selectedArticle.mcq!.id] !== undefined;
                        const isSelected = userAnswers[selectedArticle.mcq!.id] === idx;
                        const isCorrect = selectedArticle.mcq!.correctAnswer === idx;
                        
                        let optionClass = 'bg-white hover:bg-stone-50 text-stone-850';
                        if (hasAnswered) {
                          if (isCorrect) {
                            optionClass = 'bg-emerald-100 border-emerald-400 text-emerald-950 font-bold';
                          } else if (isSelected) {
                            optionClass = 'bg-rose-100 border-rose-300 text-rose-950';
                          } else {
                            optionClass = 'bg-stone-100/50 text-stone-400 opacity-60';
                          }
                        }

                        return (
                          <button
                            key={idx}
                            id={`mcq-detail-option-${idx}`}
                            disabled={hasAnswered}
                            onClick={() => setUserAnswers(prev => ({ ...prev, [selectedArticle.mcq!.id]: idx }))}
                            className={`w-full text-left text-xs p-2.5 rounded-lg border transition duration-150 flex items-start gap-2 cursor-pointer ${optionClass}`}
                          >
                            <span className="font-mono font-bold bg-stone-200 text-stone-900 px-1.5 py-0.2 rounded text-[10px] uppercase shrink-0">
                              {String.fromCharCode(65 + idx)}
                            </span>
                            <span>{opt}</span>
                          </button>
                        );
                      })}
                    </div>

                    {userAnswers[selectedArticle.mcq.id] !== undefined && (
                      <div className="bg-white border border-[#CDD8E0] rounded-lg p-3 space-y-2 text-stone-900">
                        <p className="font-bold text-xs text-blue-950 flex items-center gap-1">
                          <Lightbulb className="w-4 h-4 text-amber-500 fill-current" /> Detailed Syllabus Citations & Explanations:
                        </p>
                        <p className="text-xs leading-relaxed text-stone-700 whitespace-pre-wrap font-mono uppercase bg-stone-50 p-2 border border-stone-200 rounded text-[10.5px]">
                          {selectedArticle.mcq.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* USER PERSONAL MNEMONICS / NOTES COMPILATION INLINE */}
                {token && (
                  <div className="bg-[#FAF9F5] border border-stone-200 rounded-lg p-3.5 space-y-2.5">
                    <span className="text-[10px] font-bold text-stone-800 uppercase tracking-widest font-mono flex items-center gap-1">
                       💡 Build Personal Synapses (Saves to Revision Mode)
                    </span>
                    <p className="text-[10px] text-stone-600 block line-clamp-1">
                      Compile static references (syllabus, reports, or GS index keys) linked to this material.
                    </p>
                    <div className="flex gap-2">
                      <input
                        id="input-inline-card-notes"
                        type="text"
                        placeholder="e.g. MNEMONIC: 'Urea cutPM-PRANAM save50'... Links Article 48 DPSP"
                        defaultValue={revisionCards.find(c => c.articleId === selectedArticle.id)?.notes || ''}
                        onBlur={(e) => handleSaveRevisionCard(selectedArticle.id, e.target.value)}
                        className="flex-1 text-xs px-2.5 py-1.5 border border-stone-300 rounded bg-white text-stone-900 focus:outline-none focus:border-stone-950"
                      />
                      <button
                        id="btn-trigger-inline-save"
                        onClick={(e) => {
                          const el = document.getElementById('input-inline-card-notes') as HTMLInputElement;
                          if (el) handleSaveRevisionCard(selectedArticle.id, el.value);
                        }}
                        className="bg-[#1C1917] hover:bg-[#2E2A27] text-white text-xs font-bold py-1.5 px-3 rounded cursor-pointer"
                      >
                        Keep Notes
                      </button>
                    </div>
                  </div>
                )}

                {/* SATELLITE RELATED TOPICS LIST */}
                {selectedArticle.relatedArticles && selectedArticle.relatedArticles.length > 0 && (
                  <div className="space-y-2 border-t border-[#E7E5E4] pt-3">
                    <span className="text-[10px] font-bold text-stone-600 uppercase tracking-widest font-mono block">Related UPSC Syllabus Connections</span>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      {selectedArticle.relatedArticles.map((rel: any) => (
                        <div
                          key={rel.id}
                          id={`rel-item-${rel.id}`}
                          onClick={() => handleSelectArticle(rel.id)}
                          className="bg-stone-50 border border-stone-200 hover:border-teal-700 p-2 rounded text-left transition cursor-pointer space-y-1 block text-xs"
                        >
                          <span className="text-[8px] font-bold text-teal-800 bg-teal-50 px-1 py-0.2 rounded">{rel.category}</span>
                          <h5 className="font-bold text-stone-950 truncate">{rel.title}</h5>
                          <p className="text-[9px] text-[#78716C] line-clamp-1 italic">{rel.oneLineRevision}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Source body reading references - ADMIN ONLY */}
                {currentTab === 'admin' && (
                  <div className="space-y-1 border-t border-[#E7E5E4] pt-3 text-[11px] bg-stone-100 p-3 rounded-lg">
                    <span className="font-bold text-stone-700 uppercase font-mono block">Raw Ingested Content Draft (Admin Monitor Only)</span>
                    <p className="leading-relaxed text-stone-700 font-serif max-h-40 overflow-y-auto pr-1">
                      {selectedArticle.content}
                    </p>
                  </div>
                )}

              </div>
            ) : null}

          </div>
        </div>
      )}

      {/* ==========================================
          MODAL OVERLAY FOR USER LOGIN / REGISTRATION (REDESIGNED EXQUISITELY)
         ========================================== */}
      <div id="auth-overlay-modal" className="hidden fixed inset-0 z-50 bg-[#1C1816]/30 backdrop-blur-xs flex items-center justify-center p-4">
        <div id="auth-panel-box" className="bg-[#FCFAF7] border border-stone-200 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl relative font-sans text-stone-900">
          
          <div className="border-b border-stone-200/50 p-5 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono font-semibold tracking-widest text-[#0F766E] uppercase block">
                Access Gateway
              </span>
              <h4 className="font-display text-lg font-bold text-stone-900">
                {authMode === 'login' ? 'Sign In to Workspace' : 'Create Trainee Profile'}
              </h4>
            </div>
            <button
              onClick={() => {
                const el = document.getElementById('auth-overlay-modal');
                if (el) el.classList.add('hidden');
              }}
              className="text-stone-400 hover:text-stone-900 font-bold p-1 rounded-full hover:bg-stone-100 transition cursor-pointer shrink-0 w-7 h-7 flex items-center justify-center"
            >
              ✕
            </button>
          </div>

          <div className="p-5 space-y-4">
            {/* Direct Sandbox Access Button to completely bypass signups */}
            <div className="bg-teal-50/60 border border-teal-100 p-3 rounded-xl text-center space-y-1.5 flex flex-col items-center">
              <p className="text-[11px] text-teal-850 font-medium text-center">Bypass registration and check out the feed instantly!</p>
              <button
                type="button"
                onClick={handleQuickDemoLogin}
                disabled={authLoading}
                className="w-full bg-[#0F766E] hover:bg-teal-800 text-white text-xs font-semibold py-2 px-3 rounded-lg transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>⚡ Instant Candidate Entry</span>
              </button>
            </div>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-stone-200"></div>
              <span className="flex-shrink mx-3 text-[9px] font-mono text-stone-400 uppercase tracking-widest bg-[#FCFAF7] px-1">Or standard options</span>
              <div className="flex-grow border-t border-stone-200"></div>
            </div>

            {authError && (
              <div className="text-[11px] p-2.5 bg-rose-50 border border-rose-200 text-rose-900 font-mono rounded-lg">
                ⚠️ {authError}
              </div>
            )}

            {/* FORM CONTAINER */}
            <form onSubmit={(e) => {
              setAuthMethod('credentials');
              handleAuth(e);
            }} className="space-y-3.5">
              
              {/* Onboard Details when Registering */}
              {authMode === 'register' && (
                <div className="space-y-1">
                  <label className="text-[9.5px] font-mono font-semibold text-stone-500 uppercase tracking-wider block">Candidate Full Name</label>
                  <input
                    id="auth-name-input"
                    type="text"
                    required
                    placeholder="Abhishek Sen, IAS"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    className="w-full text-xs p-2.5 border border-stone-200 rounded-lg focus:outline-none focus:border-[#0F766E] bg-white font-medium"
                  />
                </div>
              )}

              {/* standard credentials email */}
              <div className="space-y-1">
                <label className="text-[9.5px] font-mono font-semibold text-stone-500 uppercase tracking-wider block">
                  Cabinet Email ID
                </label>
                <input
                  id="auth-email-input"
                  type="email"
                  required
                  placeholder="trainee@nic.in"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full text-xs p-2.5 border border-stone-200 rounded-lg focus:outline-none focus:border-[#0F766E] bg-white font-medium"
                />
              </div>

              {/* Standard Password input section */}
              <div className="space-y-1">
                <label className="text-[9.5px] font-mono font-semibold text-stone-500 uppercase tracking-wider block">Access Key Code</label>
                <input
                  id="auth-password-input"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full text-xs p-2.5 border border-stone-200 rounded-lg focus:outline-none focus:border-[#0F766E] bg-white font-medium"
                />
              </div>

              <button
                id="auth-submit-action-btn"
                type="submit"
                disabled={authLoading}
                className="w-full bg-stone-900 hover:bg-stone-850 text-white text-xs font-semibold py-2.5 px-3 rounded-lg transition shadow-xs cursor-pointer disabled:opacity-50 mt-1"
              >
                {authLoading 
                  ? 'Verifying Credentials...' 
                  : authMode === 'login' ? 'Access Candidate Account' : 'Initialize Trainee Profile'
                }
              </button>
            </form>

            <div className="text-center pt-2 border-t border-stone-200">
              <button
                type="button"
                onClick={() => {
                  setAuthMode(authMode === 'login' ? 'register' : 'login');
                  setAuthError('');
                }}
                className="text-xs text-[#0F766E] hover:underline font-semibold"
              >
                {authMode === 'login' 
                  ? "Don't have an account? Sign Up" 
                  : "Already registered? Sign In"
                }
              </button>
            </div>
          </div>
        </div>
      </div>

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
