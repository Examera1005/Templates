/**
 * Desktop App UI Components
 * React components for the Electron desktop application
 */

import React, { useState, useRef } from 'react';

// TitleBar Component (Windows/Linux)
export const TitleBar = ({ title = 'Desktop App', onMinimize, onMaximize, onClose }) => {
  const [isMaximized, setIsMaximized] = useState(false);

  const handleMaximize = () => {
    setIsMaximized(!isMaximized);
    onMaximize?.();
  };

  return (
    <div className="title-bar">
      <div className="title-bar-title">{title}</div>
      <div className="title-bar-controls">
        <button 
          className="title-bar-button" 
          onClick={onMinimize}
          title="Minimize"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <rect x="0" y="5" width="12" height="2" />
          </svg>
        </button>
        <button 
          className="title-bar-button" 
          onClick={handleMaximize}
          title={isMaximized ? "Restore" : "Maximize"}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            {isMaximized ? (
              <g>
                <rect x="2" y="0" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1" />
                <rect x="0" y="2" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1" />
              </g>
            ) : (
              <rect x="0" y="0" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1" />
            )}
          </svg>
        </button>
        <button 
          className="title-bar-button close" 
          onClick={onClose}
          title="Close"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <path d="M1 1L11 11M1 11L11 1" stroke="currentColor" strokeWidth="1" />
          </svg>
        </button>
      </div>
    </div>
  );
};

// Sidebar Component
export const Sidebar = ({ collapsed, onToggle, activeSection, onSectionChange }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'files', label: 'Files', icon: '📁' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
    { id: 'help', label: 'Help', icon: '❓' },
    { id: 'about', label: 'About', icon: 'ℹ️' }
  ];

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">D</div>
          <span className="sidebar-logo-text">Desktop App</span>
        </div>
        <button className="sidebar-toggle" onClick={onToggle}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d={collapsed 
              ? "M2 4h12M2 8h12M2 12h12" 
              : "M3 4h10M3 8h6M3 12h8"
            } stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      
      <nav className="sidebar-nav">
        {navItems.map(item => (
          <a
            key={item.id}
            className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
            onClick={() => onSectionChange(item.id)}
          >
            <span className="nav-item-icon">{item.icon}</span>
            <span className="nav-item-text">{item.label}</span>
          </a>
        ))}
      </nav>
    </div>
  );
};

// Main Content Component
export const MainContent = ({ activeSection, children }) => {
  const getSectionContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardContent />;
      case 'files':
        return <FilesContent />;
      case 'settings':
        return <SettingsContent />;
      case 'help':
        return <HelpContent />;
      case 'about':
        return <AboutContent />;
      default:
        return <DashboardContent />;
    }
  };

  return (
    <div className="main-content">
      {children || getSectionContent()}
    </div>
  );
};

// Dashboard Content
const DashboardContent = () => {
  const [stats] = useState({
    totalFiles: 1234,
    diskUsage: '45.2 GB',
    cpuUsage: 12,
    memoryUsage: 68
  });

  return (
    <div>
      <div className="content-header">
        <h1 className="content-title">Dashboard</h1>
        <p className="content-subtitle">Overview of your desktop application</p>
      </div>
      
      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">System Stats</h3>
            <p className="card-description">Current system performance</p>
          </div>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">CPU Usage</span>
              <span className="stat-value">{stats.cpuUsage}%</span>
              <div className="progress">
                <div className="progress-bar" style={{ width: `${stats.cpuUsage}%` }} />
              </div>
            </div>
            <div className="stat-item">
              <span className="stat-label">Memory Usage</span>
              <span className="stat-value">{stats.memoryUsage}%</span>
              <div className="progress">
                <div className="progress-bar" style={{ width: `${stats.memoryUsage}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Quick Actions</h3>
            <p className="card-description">Common tasks and shortcuts</p>
          </div>
          <div className="actions-grid">
            <button className="btn btn-primary">New File</button>
            <button className="btn btn-secondary">Open Folder</button>
            <button className="btn btn-outline">Import Data</button>
            <button className="btn btn-outline">Export Data</button>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Activity</h3>
            <p className="card-description">Latest actions and events</p>
          </div>
          <div className="activity-list">
            <div className="activity-item">
              <span className="activity-icon">📄</span>
              <span className="activity-text">Created new document</span>
              <span className="activity-time">2 minutes ago</span>
            </div>
            <div className="activity-item">
              <span className="activity-icon">📁</span>
              <span className="activity-text">Opened project folder</span>
              <span className="activity-time">5 minutes ago</span>
            </div>
            <div className="activity-item">
              <span className="activity-icon">⚙️</span>
              <span className="activity-text">Updated preferences</span>
              <span className="activity-time">1 hour ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Files Content
const FilesContent = () => {
  const [files] = useState([
    { name: 'document.pdf', size: '2.3 MB', modified: '2024-01-15' },
    { name: 'image.png', size: '845 KB', modified: '2024-01-14' },
    { name: 'data.json', size: '124 KB', modified: '2024-01-13' },
    { name: 'config.xml', size: '3.2 KB', modified: '2024-01-12' }
  ]);

  return (
    <div>
      <div className="content-header">
        <h1 className="content-title">Files</h1>
        <p className="content-subtitle">Manage your files and documents</p>
      </div>
      
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">File Manager</h3>
          <div className="card-actions">
            <button className="btn btn-primary">Upload File</button>
            <button className="btn btn-secondary">New Folder</button>
          </div>
        </div>
        
        <div className="file-list">
          <div className="file-list-header">
            <span>Name</span>
            <span>Size</span>
            <span>Modified</span>
            <span>Actions</span>
          </div>
          {files.map((file, index) => (
            <div key={index} className="file-list-item">
              <span className="file-name">
                <span className="file-icon">📄</span>
                {file.name}
              </span>
              <span className="file-size">{file.size}</span>
              <span className="file-modified">{file.modified}</span>
              <div className="file-actions">
                <button className="btn-icon" title="Open">📂</button>
                <button className="btn-icon" title="Delete">🗑️</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Settings Content
const SettingsContent = () => {
  const [settings, setSettings] = useState({
    theme: 'light',
    notifications: true,
    autoUpdate: true,
    startWithSystem: false,
    language: 'en'
  });

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div>
      <div className="content-header">
        <h1 className="content-title">Settings</h1>
        <p className="content-subtitle">Customize your application preferences</p>
      </div>
      
      <div className="settings-grid">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Appearance</h3>
            <p className="card-description">Customize the look and feel</p>
          </div>
          <div className="form-group">
            <label className="form-label">Theme</label>
            <select 
              className="form-select"
              value={settings.theme}
              onChange={(e) => handleSettingChange('theme', e.target.value)}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">Auto</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Language</label>
            <select 
              className="form-select"
              value={settings.language}
              onChange={(e) => handleSettingChange('language', e.target.value)}
            >
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
            </select>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Notifications</h3>
            <p className="card-description">Control notification behavior</p>
          </div>
          <label className="form-checkbox">
            <input
              type="checkbox"
              checked={settings.notifications}
              onChange={(e) => handleSettingChange('notifications', e.target.checked)}
            />
            <span>Enable notifications</span>
          </label>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">System</h3>
            <p className="card-description">System integration settings</p>
          </div>
          <label className="form-checkbox">
            <input
              type="checkbox"
              checked={settings.autoUpdate}
              onChange={(e) => handleSettingChange('autoUpdate', e.target.checked)}
            />
            <span>Automatic updates</span>
          </label>
          <label className="form-checkbox">
            <input
              type="checkbox"
              checked={settings.startWithSystem}
              onChange={(e) => handleSettingChange('startWithSystem', e.target.checked)}
            />
            <span>Start with system</span>
          </label>
        </div>
      </div>
      
      <div className="settings-actions">
        <button className="btn btn-primary">Save Changes</button>
        <button className="btn btn-secondary">Reset to Defaults</button>
      </div>
    </div>
  );
};

// Help Content
const HelpContent = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const helpTopics = [
    { title: 'Getting Started', description: 'Learn the basics of using the application', category: 'Basics' },
    { title: 'File Management', description: 'How to organize and manage your files', category: 'Features' },
    { title: 'Keyboard Shortcuts', description: 'Speed up your workflow with shortcuts', category: 'Tips' },
    { title: 'Troubleshooting', description: 'Common issues and solutions', category: 'Support' },
    { title: 'Privacy & Security', description: 'Understanding data protection', category: 'Security' }
  ];

  const filteredTopics = helpTopics.filter(topic =>
    topic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    topic.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="content-header">
        <h1 className="content-title">Help & Support</h1>
        <p className="content-subtitle">Find answers and get assistance</p>
      </div>
      
      <div className="help-search">
        <input
          type="text"
          className="form-input"
          placeholder="Search help topics..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <div className="help-topics">
        {filteredTopics.map((topic, index) => (
          <div key={index} className="card help-topic">
            <div className="help-topic-header">
              <h4 className="help-topic-title">{topic.title}</h4>
              <span className="help-topic-category">{topic.category}</span>
            </div>
            <p className="help-topic-description">{topic.description}</p>
            <button className="btn btn-outline btn-sm">Read More</button>
          </div>
        ))}
      </div>
      
      <div className="help-contact">
        <div className="card">
          <h3 className="card-title">Need More Help?</h3>
          <p className="card-description">Can't find what you're looking for? Contact our support team.</p>
          <div className="contact-options">
            <button className="btn btn-primary">Contact Support</button>
            <button className="btn btn-secondary">Community Forum</button>
            <button className="btn btn-outline">Send Feedback</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// About Content
const AboutContent = () => {
  const appInfo = {
    name: 'Desktop App',
    version: '1.0.0',
    build: '2024.01.15',
    electron: '28.1.0',
    node: '18.17.1',
    chrome: '120.0.6099.56'
  };

  return (
    <div>
      <div className="content-header">
        <h1 className="content-title">About</h1>
        <p className="content-subtitle">Application information and credits</p>
      </div>
      
      <div className="about-grid">
        <div className="card about-app">
          <div className="about-logo">
            <div className="about-icon">D</div>
            <h2>{appInfo.name}</h2>
            <p>Version {appInfo.version}</p>
          </div>
          <p className="about-description">
            A modern desktop application built with Electron and React.
            Designed for productivity and ease of use.
          </p>
        </div>

        <div className="card">
          <h3 className="card-title">System Information</h3>
          <div className="system-info">
            <div className="info-item">
              <span className="info-label">App Version:</span>
              <span className="info-value">{appInfo.version}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Build Date:</span>
              <span className="info-value">{appInfo.build}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Electron:</span>
              <span className="info-value">{appInfo.electron}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Node.js:</span>
              <span className="info-value">{appInfo.node}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Chrome:</span>
              <span className="info-value">{appInfo.chrome}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">Links</h3>
          <div className="links-list">
            <a href="#" className="link-item">
              <span>🌐</span>
              <span>Official Website</span>
            </a>
            <a href="#" className="link-item">
              <span>📚</span>
              <span>Documentation</span>
            </a>
            <a href="#" className="link-item">
              <span>🐛</span>
              <span>Report Issues</span>
            </a>
            <a href="#" className="link-item">
              <span>💬</span>
              <span>Community</span>
            </a>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">License</h3>
          <p>This software is released under the MIT License.</p>
          <button className="btn btn-outline">View License</button>
        </div>
      </div>
    </div>
  );
};

// Status Bar Component
export const StatusBar = ({ status, updateAvailable, onUpdateClick }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="status-bar">
      <div className="status-left">
        <div className="status-item">
          <div className={`status-indicator ${status.toLowerCase()}`} />
          <span>{status}</span>
        </div>
        {updateAvailable && (
          <div className="status-item" onClick={onUpdateClick}>
            <span>🔄</span>
            <span>Update Available</span>
          </div>
        )}
      </div>
      
      <div className="status-right">
        <div className="status-item">
          <span>🕒</span>
          <span>{currentTime.toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
};