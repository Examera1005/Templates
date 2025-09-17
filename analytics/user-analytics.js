// User Analytics and Behavior Tracking
class UserAnalytics {
    constructor(options = {}) {
        this.options = {
            trackUserJourney: true,
            trackEngagement: true,
            trackFeatureUsage: true,
            sessionTimeout: 1800000, // 30 minutes
            ...options
        };
        
        this.sessions = new Map();
        this.userJourney = [];
        this.featureUsage = new Map();
        this.engagementMetrics = {
            totalTimeOnSite: 0,
            pageViews: 0,
            interactions: 0,
            lastActivity: Date.now()
        };
        
        this.init();
    }

    init() {
        this.startSession();
        this.setupEngagementTracking();
        this.setupJourneyTracking();
    }

    // Session management
    startSession(userId = null) {
        const sessionId = this.generateSessionId();
        const session = {
            id: sessionId,
            userId: userId,
            startTime: Date.now(),
            lastActivity: Date.now(),
            pageViews: [],
            events: [],
            duration: 0
        };
        
        this.sessions.set(sessionId, session);
        this.currentSessionId = sessionId;
        
        return session;
    }

    updateSession(sessionId = this.currentSessionId) {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.lastActivity = Date.now();
            session.duration = Date.now() - session.startTime;
        }
    }

    endSession(sessionId = this.currentSessionId) {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.endTime = Date.now();
            session.duration = session.endTime - session.startTime;
            
            // Analyze session
            const analysis = this.analyzeSession(session);
            session.analysis = analysis;
            
            return session;
        }
    }

    // User journey tracking
    trackJourneyStep(step, properties = {}) {
        if (!this.options.trackUserJourney) return;

        const journeyStep = {
            step: step,
            timestamp: Date.now(),
            properties: properties,
            sessionId: this.currentSessionId
        };

        this.userJourney.push(journeyStep);
        this.updateSession();
        
        // Keep journey history manageable
        if (this.userJourney.length > 100) {
            this.userJourney.shift();
        }
    }

    // Feature usage tracking
    trackFeatureUsage(featureName, properties = {}) {
        if (!this.options.trackFeatureUsage) return;

        const usage = this.featureUsage.get(featureName) || {
            name: featureName,
            count: 0,
            firstUsed: Date.now(),
            lastUsed: Date.now(),
            sessions: new Set()
        };

        usage.count++;
        usage.lastUsed = Date.now();
        usage.sessions.add(this.currentSessionId);

        this.featureUsage.set(featureName, usage);
        this.updateSession();
    }

    // Engagement tracking
    setupEngagementTracking() {
        if (!this.options.trackEngagement) return;

        // Mouse movement tracking
        let lastMouseMove = Date.now();
        document.addEventListener('mousemove', () => {
            lastMouseMove = Date.now();
            this.updateLastActivity();
        });

        // Keyboard activity tracking
        document.addEventListener('keydown', () => {
            this.updateLastActivity();
            this.engagementMetrics.interactions++;
        });

        // Click tracking
        document.addEventListener('click', () => {
            this.updateLastActivity();
            this.engagementMetrics.interactions++;
        });

        // Scroll tracking
        document.addEventListener('scroll', this.debounce(() => {
            this.updateLastActivity();
        }, 100));

        // Focus/blur tracking
        window.addEventListener('focus', () => {
            this.trackJourneyStep('window_focus');
        });

        window.addEventListener('blur', () => {
            this.trackJourneyStep('window_blur');
        });

        // Visibility change tracking
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.trackJourneyStep('tab_hidden');
            } else {
                this.trackJourneyStep('tab_visible');
            }
        });

        // Idle detection
        this.setupIdleDetection();
    }

    updateLastActivity() {
        this.engagementMetrics.lastActivity = Date.now();
        this.updateSession();
    }

    setupIdleDetection() {
        setInterval(() => {
            const idleTime = Date.now() - this.engagementMetrics.lastActivity;
            
            if (idleTime > 300000) { // 5 minutes idle
                this.trackJourneyStep('user_idle', { idleTime });
            }
            
            if (idleTime > this.options.sessionTimeout) {
                this.endSession();
                this.startSession();
            }
        }, 60000); // Check every minute
    }

    // Journey analysis
    setupJourneyTracking() {
        // Track page navigation
        window.addEventListener('beforeunload', () => {
            this.trackJourneyStep('page_exit', {
                url: window.location.href,
                timeOnPage: Date.now() - this.pageStartTime
            });
        });

        // Track page load
        window.addEventListener('load', () => {
            this.pageStartTime = Date.now();
            this.trackJourneyStep('page_load', {
                url: window.location.href,
                referrer: document.referrer
            });
            this.engagementMetrics.pageViews++;
        });

        // Track form interactions
        document.addEventListener('focus', (event) => {
            if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
                this.trackJourneyStep('form_field_focus', {
                    fieldName: event.target.name,
                    fieldType: event.target.type
                });
            }
        });

        // Track button clicks
        document.addEventListener('click', (event) => {
            if (event.target.tagName === 'BUTTON' || event.target.type === 'submit') {
                this.trackJourneyStep('button_click', {
                    buttonText: event.target.textContent,
                    buttonId: event.target.id,
                    buttonClass: event.target.className
                });
            }
        });
    }

    // Analytics and insights
    analyzeSession(session) {
        const analysis = {
            duration: session.duration,
            pageViews: session.pageViews.length,
            eventCount: session.events.length,
            avgTimePerPage: session.pageViews.length > 0 ? 
                session.duration / session.pageViews.length : 0,
            bounceRate: session.pageViews.length <= 1 ? 1 : 0,
            engagementScore: this.calculateEngagementScore(session)
        };

        return analysis;
    }

    calculateEngagementScore(session) {
        let score = 0;
        
        // Time-based score (up to 40 points)
        const minutes = session.duration / 60000;
        score += Math.min(40, minutes * 2);
        
        // Interaction-based score (up to 30 points)
        score += Math.min(30, session.events.length * 0.5);
        
        // Page view score (up to 20 points)
        score += Math.min(20, session.pageViews.length * 5);
        
        // Feature usage score (up to 10 points)
        const featuresUsed = new Set(session.events
            .filter(e => e.type === 'feature_usage')
            .map(e => e.feature)).size;
        score += Math.min(10, featuresUsed * 2);
        
        return Math.round(score);
    }

    getUserInsights(userId) {
        const userSessions = Array.from(this.sessions.values())
            .filter(session => session.userId === userId);
        
        if (userSessions.length === 0) return null;

        const insights = {
            totalSessions: userSessions.length,
            totalTime: userSessions.reduce((sum, s) => sum + s.duration, 0),
            totalPageViews: userSessions.reduce((sum, s) => sum + s.pageViews.length, 0),
            avgSessionDuration: 0,
            avgEngagementScore: 0,
            favoriteFeatures: this.getFavoriteFeatures(userId),
            commonJourneyPaths: this.getCommonJourneyPaths(userId),
            lastVisit: Math.max(...userSessions.map(s => s.lastActivity))
        };

        insights.avgSessionDuration = insights.totalTime / insights.totalSessions;
        insights.avgEngagementScore = userSessions
            .reduce((sum, s) => sum + (s.analysis?.engagementScore || 0), 0) / userSessions.length;

        return insights;
    }

    getFavoriteFeatures(userId) {
        const userFeatures = new Map();
        
        Array.from(this.featureUsage.entries())
            .filter(([name, data]) => data.sessions.has(userId))
            .forEach(([name, data]) => {
                userFeatures.set(name, data.count);
            });

        return Array.from(userFeatures.entries())
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }));
    }

    getCommonJourneyPaths(userId) {
        const userJourney = this.userJourney
            .filter(step => {
                const session = this.sessions.get(step.sessionId);
                return session && session.userId === userId;
            });

        // Analyze common 3-step patterns
        const patterns = new Map();
        for (let i = 0; i < userJourney.length - 2; i++) {
            const pattern = [
                userJourney[i].step,
                userJourney[i + 1].step,
                userJourney[i + 2].step
            ].join(' → ');
            
            patterns.set(pattern, (patterns.get(pattern) || 0) + 1);
        }

        return Array.from(patterns.entries())
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([pattern, count]) => ({ pattern, count }));
    }

    // Funnel analysis
    createFunnel(steps) {
        const funnel = {
            steps: steps,
            results: [],
            conversionRates: []
        };

        let currentUsers = new Set();
        
        // Get all users who started the funnel
        this.userJourney
            .filter(step => step.step === steps[0])
            .forEach(step => {
                const session = this.sessions.get(step.sessionId);
                if (session && session.userId) {
                    currentUsers.add(session.userId);
                }
            });

        funnel.results.push(currentUsers.size);

        // Track users through each step
        for (let i = 1; i < steps.length; i++) {
            const nextUsers = new Set();
            
            this.userJourney
                .filter(step => step.step === steps[i])
                .forEach(step => {
                    const session = this.sessions.get(step.sessionId);
                    if (session && session.userId && currentUsers.has(session.userId)) {
                        nextUsers.add(session.userId);
                    }
                });

            const conversionRate = currentUsers.size > 0 ? 
                (nextUsers.size / currentUsers.size) * 100 : 0;
            
            funnel.conversionRates.push(conversionRate);
            funnel.results.push(nextUsers.size);
            currentUsers = nextUsers;
        }

        return funnel;
    }

    // Cohort analysis
    generateCohortData(period = 'weekly') {
        const cohorts = new Map();
        const periodMs = period === 'weekly' ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

        // Group users by first visit
        Array.from(this.sessions.values()).forEach(session => {
            if (!session.userId) return;

            const cohortKey = Math.floor(session.startTime / periodMs) * periodMs;
            
            if (!cohorts.has(cohortKey)) {
                cohorts.set(cohortKey, {
                    startDate: new Date(cohortKey),
                    users: new Set(),
                    retentionData: new Map()
                });
            }

            cohorts.get(cohortKey).users.add(session.userId);
        });

        // Calculate retention for each cohort
        cohorts.forEach((cohort, cohortKey) => {
            for (let i = 0; i < 12; i++) { // Track 12 periods
                const periodStart = cohortKey + (i * periodMs);
                const periodEnd = periodStart + periodMs;
                
                const activeUsers = Array.from(this.sessions.values())
                    .filter(session => 
                        session.userId &&
                        cohort.users.has(session.userId) &&
                        session.startTime >= periodStart &&
                        session.startTime < periodEnd
                    )
                    .map(session => session.userId);

                const uniqueActiveUsers = new Set(activeUsers).size;
                const retentionRate = (uniqueActiveUsers / cohort.users.size) * 100;
                
                cohort.retentionData.set(i, {
                    period: i,
                    activeUsers: uniqueActiveUsers,
                    retentionRate: retentionRate
                });
            }
        });

        return Array.from(cohorts.values());
    }

    // Utility methods
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Export data
    exportUserData(userId) {
        return {
            sessions: Array.from(this.sessions.values())
                .filter(session => session.userId === userId),
            journey: this.userJourney
                .filter(step => {
                    const session = this.sessions.get(step.sessionId);
                    return session && session.userId === userId;
                }),
            featureUsage: Array.from(this.featureUsage.entries())
                .filter(([name, data]) => data.sessions.has(userId))
                .map(([name, data]) => ({ name, ...data })),
            insights: this.getUserInsights(userId)
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UserAnalytics };
}