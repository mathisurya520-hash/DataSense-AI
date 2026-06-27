/* ==========================================================================
   DataSense AI - Settings Module Client Controller
   ========================================================================== */

document.addEventListener('DOMContentLoaded', async () => {
  if (!DataSenseState.isAuthenticated()) return;

  const profUsername = document.getElementById('prof-username');
  const profEmail = document.getElementById('prof-email');

  const prefAnims = document.getElementById('pref-anims');
  const prefApiKey = document.getElementById('pref-apikey');

  const chkAnalysis = document.getElementById('chk-notif-analysis');
  const chkReport = document.getElementById('chk-notif-report');
  const chkPrediction = document.getElementById('chk-notif-prediction');

  // Load User details
  async function loadUser() {
    try {
      const user = await DataSenseState.apiFetch('/auth/user');
      if (user) {
        profUsername.value = user.username;
        profEmail.value = user.email;
      }
    } catch (err) {
      console.error(err);
    }
  }

  // Load Preferences
  async function loadPreferences() {
    try {
      const settings = await DataSenseState.apiFetch('/settings');
      if (settings) {
        prefAnims.value = settings.animationSpeed || 'normal';
        prefApiKey.value = settings.activeApiKey || '';
        
        chkAnalysis.checked = settings.notifyAnalysis !== false;
        chkReport.checked = settings.notifyReport !== false;
        chkPrediction.checked = settings.notifyPrediction !== false;
        
        applyAnimationSpeed(settings.animationSpeed);
      }
    } catch (err) {
      console.error(err);
    }
  }

  // Submit Preferences
  window.savePreferences = async function (e) {
    e.preventDefault();
    DataSenseState.showToast('Saving executive preferences...');

    const payload = {
      animationSpeed: prefAnims.value,
      activeApiKey: prefApiKey.value,
      notifyAnalysis: chkAnalysis.checked,
      notifyReport: chkReport.checked,
      notifyPrediction: chkPrediction.checked
    };

    try {
      const updated = await DataSenseState.apiFetch('/settings', {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      if (updated) {
        DataSenseState.showToast('Portal preferences updated successfully.');
        applyAnimationSpeed(updated.animationSpeed);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Adjust canvas animation velocities locally based on speed preference
  function applyAnimationSpeed(speed) {
    const canvasContainer = document.getElementById('background-canvas-container');
    if (!canvasContainer) return;

    if (speed === 'disabled') {
      canvasContainer.style.display = 'none';
      return;
    } else {
      canvasContainer.style.display = 'block';
    }

    const engine = window.backgroundEngine;
    if (!engine || !engine.nodes) return;

    let velocityMultiplier = 1.0;
    if (speed === 'slow') velocityMultiplier = 0.4;
    if (speed === 'fast') velocityMultiplier = 2.2;

    // Recalculate original vx/vy speeds
    engine.nodes.forEach(node => {
      // Re-seed low range and multiply
      node.vx = (Math.random() - 0.5) * 0.15 * velocityMultiplier;
      node.vy = (Math.random() - 0.5) * 0.15 * velocityMultiplier;
    });

    engine.particles.forEach(p => {
      p.vx = (Math.random() - 0.5) * 0.25 * velocityMultiplier;
      p.vy = ((Math.random() - 0.5) * 0.15 - 0.1) * velocityMultiplier;
    });
  }

  // Run
  await loadUser();
  await loadPreferences();
});
