/**
 * Updater Modal Component
 * Modal dialog for handling application updates
 */

import React, { useState, useEffect } from 'react';
import { useAutoUpdater, useNotifications } from '../hooks';

export const UpdaterModal = ({ isOpen, onClose }) => {
  const { updateInfo, checkUpdates, downloadAndInstall } = useAutoUpdater();
  const { showSuccess, showError } = useNotifications();
  const [isChecking, setIsChecking] = useState(false);

  // Check for updates when modal opens
  useEffect(() => {
    if (isOpen && !updateInfo.available && !updateInfo.downloaded) {
      handleCheckUpdates();
    }
  }, [isOpen]);

  const handleCheckUpdates = async () => {
    setIsChecking(true);
    try {
      const available = await checkUpdates();
      if (!available) {
        showSuccess('You are running the latest version');
      }
    } catch (error) {
      showError(`Failed to check for updates: ${error.message}`);
    } finally {
      setIsChecking(false);
    }
  };

  const handleDownloadUpdate = async () => {
    try {
      await downloadAndInstall();
      showSuccess('Update downloaded successfully');
    } catch (error) {
      showError(`Failed to download update: ${error.message}`);
    }
  };

  const handleInstallUpdate = () => {
    if (window.confirm('The application will restart to install the update. Continue?')) {
      downloadAndInstall();
    }
  };

  const handleSkipVersion = () => {
    // Store skipped version in localStorage
    if (updateInfo.version) {
      localStorage.setItem('skippedVersion', updateInfo.version);
      showSuccess('This version will be skipped');
      onClose();
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal updater-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Software Update</h2>
          <button className="modal-close" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4 4L12 12M4 12L12 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="modal-body">
          {/* Checking for updates */}
          {isChecking && (
            <div className="update-state checking">
              <div className="update-icon">
                <div className="loading-spinner" />
              </div>
              <h3>Checking for updates...</h3>
              <p>Please wait while we check for the latest version.</p>
            </div>
          )}

          {/* No updates available */}
          {!isChecking && !updateInfo.available && !updateInfo.error && (
            <div className="update-state up-to-date">
              <div className="update-icon">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="var(--success-color)">
                  <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2" fill="none" />
                  <path d="M16 24L20 28L32 16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3>You're up to date!</h3>
              <p>You have the latest version of the application.</p>
              <button className="btn btn-outline" onClick={handleCheckUpdates}>
                Check Again
              </button>
            </div>
          )}

          {/* Update available */}
          {updateInfo.available && !updateInfo.downloaded && !updateInfo.downloading && (
            <div className="update-state available">
              <div className="update-icon">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="var(--accent-color)">
                  <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2" fill="none" />
                  <path d="M24 16V32M16 24L24 32L32 24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3>Update Available</h3>
              <p>A new version of the application is available.</p>
              
              {updateInfo.version && (
                <div className="update-details">
                  <div className="update-version">
                    <strong>Version {updateInfo.version}</strong>
                  </div>
                  {updateInfo.releaseDate && (
                    <div className="update-date">
                      Released {formatDate(updateInfo.releaseDate)}
                    </div>
                  )}
                  {updateInfo.size && (
                    <div className="update-size">
                      Download size: {formatBytes(updateInfo.size)}
                    </div>
                  )}
                </div>
              )}

              {updateInfo.releaseNotes && (
                <div className="update-notes">
                  <h4>What's New:</h4>
                  <div className="release-notes" dangerouslySetInnerHTML={{ __html: updateInfo.releaseNotes }} />
                </div>
              )}
            </div>
          )}

          {/* Downloading update */}
          {updateInfo.downloading && (
            <div className="update-state downloading">
              <div className="update-icon">
                <div className="download-progress">
                  <svg width="48" height="48" viewBox="0 0 48 48">
                    <circle 
                      cx="24" cy="24" r="20" 
                      stroke="var(--border-color)" 
                      strokeWidth="2" 
                      fill="none" 
                    />
                    <circle 
                      cx="24" cy="24" r="20" 
                      stroke="var(--accent-color)" 
                      strokeWidth="2" 
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 20}`}
                      strokeDashoffset={`${2 * Math.PI * 20 * (1 - updateInfo.progress / 100)}`}
                      transform="rotate(-90 24 24)"
                    />
                  </svg>
                  <span className="progress-text">{Math.round(updateInfo.progress)}%</span>
                </div>
              </div>
              <h3>Downloading Update</h3>
              <p>Please wait while the update is being downloaded.</p>
              <div className="progress">
                <div 
                  className="progress-bar" 
                  style={{ width: `${updateInfo.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Update downloaded */}
          {updateInfo.downloaded && (
            <div className="update-state downloaded">
              <div className="update-icon">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="var(--success-color)">
                  <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2" fill="none" />
                  <path d="M16 24L20 28L32 16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3>Update Ready to Install</h3>
              <p>The update has been downloaded and is ready to install. The application will restart during installation.</p>
              
              {updateInfo.version && (
                <div className="update-version">
                  <strong>Version {updateInfo.version}</strong>
                </div>
              )}
            </div>
          )}

          {/* Update error */}
          {updateInfo.error && (
            <div className="update-state error">
              <div className="update-icon">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="var(--error-color)">
                  <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2" fill="none" />
                  <path d="M16 16L32 32M16 32L32 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3>Update Failed</h3>
              <p>There was an error checking for or downloading the update.</p>
              <div className="error-details">
                <code>{updateInfo.error}</code>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          {/* Update available actions */}
          {updateInfo.available && !updateInfo.downloaded && !updateInfo.downloading && (
            <div className="update-actions">
              <button className="btn btn-outline" onClick={handleSkipVersion}>
                Skip This Version
              </button>
              <button className="btn btn-secondary" onClick={onClose}>
                Remind Me Later
              </button>
              <button className="btn btn-primary" onClick={handleDownloadUpdate}>
                Download Update
              </button>
            </div>
          )}

          {/* Update downloaded actions */}
          {updateInfo.downloaded && (
            <div className="update-actions">
              <button className="btn btn-secondary" onClick={onClose}>
                Install Later
              </button>
              <button className="btn btn-primary" onClick={handleInstallUpdate}>
                Restart and Install
              </button>
            </div>
          )}

          {/* Default actions */}
          {(!updateInfo.available || updateInfo.error) && !isChecking && (
            <div className="update-actions">
              {updateInfo.error && (
                <button className="btn btn-outline" onClick={handleCheckUpdates}>
                  Try Again
                </button>
              )}
              <button className="btn btn-secondary" onClick={onClose}>
                Close
              </button>
            </div>
          )}

          {/* Downloading actions */}
          {updateInfo.downloading && (
            <div className="update-actions">
              <button className="btn btn-secondary" onClick={onClose}>
                Hide
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};