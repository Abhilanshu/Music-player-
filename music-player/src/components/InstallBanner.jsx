import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import './InstallBanner.css';

const InstallBanner = () => {
  const [prompt, setPrompt] = useState(null);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Don't show if already dismissed in this session
    if (sessionStorage.getItem('install-dismissed')) return;

    const handler = (e) => {
      e.preventDefault();
      setPrompt(e);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') {
      setVisible(false);
      setPrompt(null);
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    setDismissed(true);
    sessionStorage.setItem('install-dismissed', '1');
  };

  if (!visible || dismissed) return null;

  return (
    <div className="install-banner animate-slide-from-bottom">
      <img src="/icon-192.png" alt="Muse" className="install-icon" />
      <div className="install-text">
        <strong>Install Muse App</strong>
        <span>Add to Home Screen for offline use</span>
      </div>
      <button className="install-btn" onClick={handleInstall}>
        <Download size={16} />
        Install
      </button>
      <button className="install-dismiss" onClick={handleDismiss} aria-label="Dismiss">
        <X size={18} />
      </button>
    </div>
  );
};

export default InstallBanner;
