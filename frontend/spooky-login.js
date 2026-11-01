/**
 * Spooky Login Transition & Spectral Ghost Orchestrator
 * Grim-More Potion Pantry Hack-o-Lantern 2026
 *
 * Provides the cinematic post-signin ghost flight transition and
 * seamless dashboard arrival handshake.
 */

(function () {
  'use strict';

  // SVG Markup for the high-detail ethereal apothecary ghost
  const GHOST_SVG_MARKUP = `
    <svg class="spooky-ghost-svg" viewBox="0 0 140 170" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="spookyGhostGrad" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stop-color="#A7F3D0" stop-opacity="0.95"/>
          <stop offset="35%" stop-color="#48BB78" stop-opacity="0.9"/>
          <stop offset="65%" stop-color="#1B4332" stop-opacity="0.75"/>
          <stop offset="90%" stop-color="#0B1A12" stop-opacity="0.3"/>
          <stop offset="100%" stop-color="#020805" stop-opacity="0"/>
        </radialGradient>
        <filter id="spectralGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur"/>
          <feComposite in="SourceGraphic" in2="blur" operator="over"/>
        </filter>
      </defs>
      
      <!-- Ghost Mantle & Flowing Spectral Waves -->
      <g class="spooky-ghost-body" filter="url(#spectralGlow)">
        <path d="M 38 52 C 38 18, 102 18, 102 52 C 102 68, 126 74, 136 82 C 126 90, 114 86, 106 90 C 104 116, 114 138, 104 158 C 92 142, 82 162, 70 148 C 58 162, 48 144, 38 158 C 26 138, 34 114, 30 90 C 22 86, 10 90, 4 82 C 14 74, 38 68, 38 52 Z" 
              fill="url(#spookyGhostGrad)"/>
        
        <!-- Ghostly Arms / Wisps Reaching Forward -->
        <path d="M 34 84 C 20 86, 12 94, 2 92 C 6 84, 22 78, 32 80 Z" fill="#68D391" opacity="0.6"/>
        <path d="M 106 84 C 120 86, 128 94, 138 92 C 134 84, 118 78, 108 80 Z" fill="#68D391" opacity="0.6"/>

        <!-- Haunted Eye Sockets -->
        <ellipse cx="62" cy="48" rx="6.5" ry="9" fill="#010804"/>
        <ellipse cx="86" cy="48" rx="6.5" ry="9" fill="#010804"/>

        <!-- Piercing Spectral Irises with Ectoplasmic Core -->
        <ellipse class="spooky-ghost-eye-core" cx="62" cy="49" rx="3.2" ry="4.5" fill="#00FFA3"/>
        <ellipse class="spooky-ghost-eye-core" cx="86" cy="49" rx="3.2" ry="4.5" fill="#00FFA3"/>

        <!-- Pupil Glints -->
        <circle cx="63.5" cy="47.5" r="1.3" fill="#FFFFFF"/>
        <circle cx="87.5" cy="47.5" r="1.3" fill="#FFFFFF"/>

        <!-- Open Mischievous Spirit Mouth -->
        <ellipse cx="74" cy="67" rx="5.5" ry="8.5" fill="#010804"/>
        <path d="M 71 65 Q 74 69 77 65" stroke="#38A169" stroke-width="1.2" fill="none" opacity="0.8"/>
      </g>
    </svg>
  `;

  // SVG Markup for Arcane Runic Seal
  const SEAL_SVG_MARKUP = `
    <svg class="spooky-seal-svg" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="sealAura" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#3D7D54" stop-opacity="0.25"/>
          <stop offset="70%" stop-color="#1B4332" stop-opacity="0.1"/>
          <stop offset="100%" stop-color="#020805" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <circle cx="200" cy="200" r="190" fill="url(#sealAura)"/>
      
      <!-- Outer Runic Ring -->
      <g class="spooky-seal-ring">
        <circle cx="200" cy="200" r="175" fill="none" stroke="#68D391" stroke-width="1.8" stroke-dasharray="8 6" opacity="0.6"/>
        <circle cx="200" cy="200" r="160" fill="none" stroke="#3D7D54" stroke-width="1" opacity="0.4"/>
        <!-- Arcane Glyphs on Perimeter -->
        <text font-family="'Marcellus', serif" font-size="14" fill="#A7F3D0" opacity="0.8">
          <textPath href="#sealPath" startOffset="0%">✦ ⚗️ ☽ ✶ ⚡ ☾ ✦ ⚗️ ☽ ✶ ⚡ ☾ ✦ ⚗️ ☽ ✶ ⚡ ☾ ✦ ⚗️ ☽ ✶</textPath>
        </text>
      </g>
      <path id="sealPath" d="M 200, 32 A 168,168 0 1,1 199.9, 32" fill="none"/>

      <!-- Inner Sacred Hexagram Star & Alchemical Compass -->
      <g class="spooky-seal-inner">
        <polygon points="200,55 325,270 75,270" fill="none" stroke="#68D391" stroke-width="1.4" opacity="0.45"/>
        <polygon points="200,345 325,130 75,130" fill="none" stroke="#48BB78" stroke-width="1.4" opacity="0.45"/>
        <circle cx="200" cy="200" r="65" fill="none" stroke="#A7F3D0" stroke-width="1.5" stroke-dasharray="4 4" opacity="0.7"/>
        <circle cx="200" cy="200" r="15" fill="#0B1A12" stroke="#68D391" stroke-width="1.8" opacity="0.9"/>
      </g>
    </svg>
  `;

  /**
   * Synthesizes an eerie, atmospheric chime using Web Audio API
   * Zero external MP3 downloads, instantaneous, completely offline-safe.
   */
  function playSpookySound() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const now = ctx.currentTime;

      // 1. Ethereal Sub-Resonance Drone (The Spirit Awakening)
      const oscDrone = ctx.createOscillator();
      const gainDrone = ctx.createGain();
      oscDrone.type = 'sine';
      oscDrone.frequency.setValueAtTime(62, now);
      oscDrone.frequency.exponentialRampToValueAtTime(115, now + 1.2);
      gainDrone.gain.setValueAtTime(0.001, now);
      gainDrone.gain.linearRampToValueAtTime(0.18, now + 0.35);
      gainDrone.gain.exponentialRampToValueAtTime(0.001, now + 1.75);
      oscDrone.connect(gainDrone);
      gainDrone.connect(ctx.destination);
      oscDrone.start(now);
      oscDrone.stop(now + 1.8);

      // 2. High Ethereal Harmony (Haunted Chime at 528Hz & 792Hz)
      const oscChime = ctx.createOscillator();
      const gainChime = ctx.createGain();
      oscChime.type = 'triangle';
      oscChime.frequency.setValueAtTime(528, now);
      oscChime.frequency.exponentialRampToValueAtTime(792, now + 0.9);
      gainChime.gain.setValueAtTime(0.001, now);
      gainChime.gain.linearRampToValueAtTime(0.1, now + 0.4);
      gainChime.gain.exponentialRampToValueAtTime(0.001, now + 1.6);
      oscChime.connect(gainChime);
      gainChime.connect(ctx.destination);
      oscChime.start(now + 0.05);
      oscChime.stop(now + 1.65);
    } catch (e) {
      // Audio is an enhancement; fails silently if audio context is blocked
    }
  }

  /**
   * Spawns floating spectral particles trailing behind the flying ghost
   */
  function spawnGhostParticleTrail(stageEl) {
    if (!stageEl) return;
    const count = 18;
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        if (!stageEl.isConnected) return;
        const particle = document.createElement('div');
        particle.className = 'spooky-trail-particle';
        
        // Randomize dimensions and drift coordinates around center
        const size = Math.floor(Math.random() * 9) + 5;
        const startX = (window.innerWidth / 2) + (Math.random() * 160 - 80);
        const startY = (window.innerHeight / 2) + (Math.random() * 140 - 70);
        const driftX = (Math.random() * 140 - 70) + 'px';
        const driftY = (Math.random() * 120 - 40) + 'px';

        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${startX}px`;
        particle.style.top = `${startY}px`;
        particle.style.setProperty('--drift-x', driftX);
        particle.style.setProperty('--drift-y', driftY);

        stageEl.appendChild(particle);
        setTimeout(() => particle.remove(), 850);
      }, i * 75);
    }
  }

  /**
   * Triggers the full post-signin flying ghost transition
   *
   * @param {Object} user - User object with name and email
   * @param {string} redirectUrl - URL to navigate to once the portal opens
   */
  function playTransition(user, redirectUrl) {
    const rawName = (user && user.name) ? user.name : 'Alchemist';
    const firstName = rawName.split(' ')[0];

    // Store arrival token in sessionStorage for continuous handshake on destination page
    try {
      sessionStorage.setItem('grim_ghost_arrival', JSON.stringify({
        name: firstName,
        timestamp: Date.now()
      }));
    } catch (err) {
      console.warn('Could not store ghost arrival flag:', err);
    }

    // Prepare or reuse overlay
    let overlay = document.getElementById('spookyAuthOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'spookyAuthOverlay';
      document.body.appendChild(overlay);
    }

    overlay.innerHTML = `
      <!-- Mist & Fog -->
      <div class="spooky-fog-container">
        <div class="spooky-fog-layer"></div>
        <div class="spooky-fog-layer secondary"></div>
      </div>

      <!-- Arcane Seal -->
      <div class="spooky-arcane-seal">
        ${SEAL_SVG_MARKUP}
      </div>

      <!-- Ghost Stage & Entity -->
      <div class="spooky-ghost-stage" id="spookyGhostStage">
        <div class="spooky-flying-ghost">
          ${GHOST_SVG_MARKUP}
        </div>
      </div>

      <!-- Sanctum Opening Greeting -->
      <div class="spooky-sanctum-greeting">
        <span class="spooky-greeting-eyebrow">✦ THE SANCTUM GATES UNSEAL ✦</span>
        <h2 class="spooky-greeting-title">Welcome, Master ${firstName}</h2>
        <p class="spooky-greeting-caption">The spirits awaken to guide your potions...</p>
      </div>

      <!-- Full-screen Portal Flash -->
      <div class="spooky-portal-flash" id="spookyPortalFlash"></div>
    `;

    // Start audio & activate overlay
    playSpookySound();
    
    // Force layout reflow before activating transition class
    void overlay.offsetWidth;
    overlay.classList.add('active');

    // Spawn spectral particle trail
    const stageEl = document.getElementById('spookyGhostStage');
    spawnGhostParticleTrail(stageEl);

    // Flash portal at the crescendo of the flight
    const flashEl = document.getElementById('spookyPortalFlash');
    setTimeout(() => {
      if (flashEl) flashEl.classList.add('flash-active');
    }, 1450);

    // Redirect smoothly into destination
    const destination = redirectUrl || 'dashboard.html';
    const redirectTimeout = setTimeout(() => {
      window.location.href = destination;
    }, 1750);

    // Failsafe timeout in case anything is held up
    setTimeout(() => {
      window.location.href = destination;
    }, 2400);
  }

  /**
   * Checks if user just arrived from the spooky login portal and
   * renders the arrival ghost swoop and welcome banner.
   */
  function checkArrival() {
    try {
      const raw = sessionStorage.getItem('grim_ghost_arrival');
      if (!raw) return;

      const data = JSON.parse(raw);
      // Only trigger if within the last 20 seconds
      if (!data || !data.timestamp || (Date.now() - data.timestamp > 20000)) {
        sessionStorage.removeItem('grim_ghost_arrival');
        return;
      }

      // Remove so it doesn't replay on page reloads
      sessionStorage.removeItem('grim_ghost_arrival');

      // Create Arrival Ghost Swoop element
      const ghostSwoop = document.createElement('div');
      ghostSwoop.className = 'spooky-arrival-swoop';
      ghostSwoop.innerHTML = GHOST_SVG_MARKUP;
      document.body.appendChild(ghostSwoop);

      // Create Arrival Welcome Banner
      const banner = document.createElement('div');
      banner.className = 'spooky-arrival-ghost-banner';
      banner.innerHTML = `
        <svg class="spooky-banner-icon" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="#68D391" stroke-width="2"/>
          <path d="M12 7v5l3 3" stroke="#A7F3D0" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <span class="spooky-banner-text">
          <span>✦ Sanctum Unlocked • Welcome,</span>
          <span class="spooky-banner-name">Master ${data.name || 'Alchemist'}</span>
          <span>✦</span>
        </span>
      `;
      document.body.appendChild(banner);

      // Animate banner in
      setTimeout(() => banner.classList.add('show'), 200);

      // Clean up after animations complete
      setTimeout(() => {
        banner.classList.remove('show');
        setTimeout(() => {
          banner.remove();
          ghostSwoop.remove();
        }, 600);
      }, 3500);

    } catch (err) {
      console.warn('Failed executing ghost arrival check:', err);
    }
  }

  // Export to window
  window.SpookyLogin = {
    playTransition,
    checkArrival,
  };

  // Automatically check arrival on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkArrival);
  } else {
    checkArrival();
  }
})();

