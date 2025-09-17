/**
 * Settings Modal Component
 * Modal dialog for application settings
 */

import React, { useState, useEffect } from 'react';
import { useAppSettings, useTheme } from '../hooks';

export const SettingsModal = ({ isOpen, onClose }) => {
  const { settings, updateSetting, resetSettings, isLoading } = useAppSettings({
    theme: 'auto',
    notifications: true,
    autoUpdate: true,
    startWithSystem: false,
    language: 'en',
    autoSave: true,
    fontSize: 14,
    windowBehavior: 'minimize'
  });

  const { changeTheme } = useTheme();
  const [localSettings, setLocalSettings] = useState(settings);
  const [hasChanges, setHasChanges] = useState(false);

  // Sync local settings with global settings
  useEffect(() => {
    setLocalSettings(settings);
    setHasChanges(false);
  }, [settings]);

  // Handle setting change
  const handleSettingChange = (key, value) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  // Save settings
  const handleSave = async () => {
    for (const [key, value] of Object.entries(localSettings)) {
      await updateSetting(key, value);
    }
    
    // Apply theme change immediately
    if (localSettings.theme !== settings.theme) {
      changeTheme(localSettings.theme);
    }
    
    setHasChanges(false);
    onClose();
  };

  // Reset settings
  const handleReset = async () => {
    if (window.confirm('Are you sure you want to reset all settings to defaults?')) {
      await resetSettings();
      setHasChanges(false);
    }
  };

  // Cancel changes
  const handleCancel = () => {
    if (hasChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        setLocalSettings(settings);
        setHasChanges(false);
        onClose();
      }
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Settings</h2>
          <button className="modal-close" onClick={handleCancel}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4 4L12 12M4 12L12 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="modal-body">
          {isLoading ? (
            <div className="loading-container">
              <div className="loading-spinner" />
              <span>Loading settings...</span>
            </div>
          ) : (
            <div className="settings-sections">
              {/* Appearance Section */}
              <div className="settings-section">
                <h3 className="settings-section-title">Appearance</h3>
                
                <div className="form-group">
                  <label className="form-label">Theme</label>
                  <select 
                    className="form-select"
                    value={localSettings.theme}
                    onChange={(e) => handleSettingChange('theme', e.target.value)}
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="auto">Auto (System)</option>
                  </select>
                  <small className="form-help">Choose your preferred color theme</small>
                </div>

                <div className="form-group">
                  <label className="form-label">Font Size</label>
                  <select 
                    className="form-select"
                    value={localSettings.fontSize}
                    onChange={(e) => handleSettingChange('fontSize', parseInt(e.target.value))}
                  >
                    <option value={12}>Small (12px)</option>
                    <option value={14}>Medium (14px)</option>
                    <option value={16}>Large (16px)</option>
                    <option value={18}>Extra Large (18px)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Language</label>
                  <select 
                    className="form-select"
                    value={localSettings.language}
                    onChange={(e) => handleSettingChange('language', e.target.value)}
                  >
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                    <option value="it">Italiano</option>
                    <option value="pt">Português</option>
                    <option value="ja">日本語</option>
                    <option value="ko">한국어</option>
                    <option value="zh">中文</option>
                  </select>
                </div>
              </div>

              {/* Behavior Section */}
              <div className="settings-section">
                <h3 className="settings-section-title">Behavior</h3>
                
                <label className="form-checkbox">
                  <input
                    type="checkbox"
                    checked={localSettings.notifications}
                    onChange={(e) => handleSettingChange('notifications', e.target.checked)}
                  />
                  <span>Enable notifications</span>
                </label>
                <small className="form-help">Show desktop notifications for important events</small>

                <label className="form-checkbox">
                  <input
                    type="checkbox"
                    checked={localSettings.autoSave}
                    onChange={(e) => handleSettingChange('autoSave', e.target.checked)}
                  />
                  <span>Auto-save changes</span>
                </label>
                <small className="form-help">Automatically save changes without prompting</small>

                <div className="form-group">
                  <label className="form-label">Window Close Behavior</label>
                  <select 
                    className="form-select"
                    value={localSettings.windowBehavior}
                    onChange={(e) => handleSettingChange('windowBehavior', e.target.value)}
                  >
                    <option value="close">Close application</option>
                    <option value="minimize">Minimize to system tray</option>
                    <option value="ask">Ask me each time</option>
                  </select>
                </div>
              </div>

              {/* System Section */}
              <div className="settings-section">
                <h3 className="settings-section-title">System</h3>
                
                <label className="form-checkbox">
                  <input
                    type="checkbox"
                    checked={localSettings.autoUpdate}
                    onChange={(e) => handleSettingChange('autoUpdate', e.target.checked)}
                  />
                  <span>Automatic updates</span>
                </label>
                <small className="form-help">Automatically download and install updates</small>

                <label className="form-checkbox">
                  <input
                    type="checkbox"
                    checked={localSettings.startWithSystem}
                    onChange={(e) => handleSettingChange('startWithSystem', e.target.checked)}
                  />
                  <span>Start with system</span>
                </label>
                <small className="form-help">Launch the application when your computer starts</small>
              </div>

              {/* Privacy Section */}
              <div className="settings-section">
                <h3 className="settings-section-title">Privacy</h3>
                
                <label className="form-checkbox">
                  <input
                    type="checkbox"
                    checked={localSettings.telemetry || false}
                    onChange={(e) => handleSettingChange('telemetry', e.target.checked)}
                  />
                  <span>Send usage data</span>
                </label>
                <small className="form-help">Help improve the app by sending anonymous usage statistics</small>

                <label className="form-checkbox">
                  <input
                    type="checkbox"
                    checked={localSettings.crashReports || false}
                    onChange={(e) => handleSettingChange('crashReports', e.target.checked)}
                  />
                  <span>Send crash reports</span>
                </label>
                <small className="form-help">Automatically send crash reports to help fix bugs</small>
              </div>

              {/* Storage Section */}
              <div className="settings-section">
                <h3 className="settings-section-title">Storage</h3>
                
                <div className="storage-info">
                  <div className="storage-item">
                    <span className="storage-label">Cache Size:</span>
                    <span className="storage-value">45.2 MB</span>
                  </div>
                  <div className="storage-item">
                    <span className="storage-label">Log Files:</span>
                    <span className="storage-value">12.8 MB</span>
                  </div>
                  <div className="storage-item">
                    <span className="storage-label">User Data:</span>
                    <span className="storage-value">3.4 MB</span>
                  </div>
                </div>
                
                <div className="storage-actions">
                  <button className="btn btn-outline btn-sm">Clear Cache</button>
                  <button className="btn btn-outline btn-sm">Clear Logs</button>
                  <button className="btn btn-outline btn-sm">Export Data</button>
                </div>
              </div>

              {/* Advanced Section */}
              <div className="settings-section">
                <h3 className="settings-section-title">Advanced</h3>
                
                <label className="form-checkbox">
                  <input
                    type="checkbox"
                    checked={localSettings.developerMode || false}
                    onChange={(e) => handleSettingChange('developerMode', e.target.checked)}
                  />
                  <span>Developer mode</span>
                </label>
                <small className="form-help">Enable developer tools and advanced features</small>

                <label className="form-checkbox">
                  <input
                    type="checkbox"
                    checked={localSettings.hardwareAcceleration !== false}
                    onChange={(e) => handleSettingChange('hardwareAcceleration', e.target.checked)}
                  />
                  <span>Hardware acceleration</span>
                </label>
                <small className="form-help">Use GPU acceleration for better performance (requires restart)</small>

                <div className="form-group">
                  <label className="form-label">Log Level</label>
                  <select 
                    className="form-select"
                    value={localSettings.logLevel || 'info'}
                    onChange={(e) => handleSettingChange('logLevel', e.target.value)}
                  >
                    <option value="error">Error</option>
                    <option value="warn">Warning</option>
                    <option value="info">Info</option>
                    <option value="debug">Debug</option>
                    <option value="verbose">Verbose</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button 
            className="btn btn-outline" 
            onClick={handleReset}
            disabled={isLoading}
          >
            Reset to Defaults
          </button>
          <div className="modal-actions">
            <button 
              className="btn btn-secondary" 
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button 
              className="btn btn-primary" 
              onClick={handleSave}
              disabled={isLoading || !hasChanges}
            >
              {isLoading ? (
                <>
                  <div className="loading-spinner" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};