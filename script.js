// script.js

// --- State Variables ---
let hoverCount = 0;
const MAX_EVADES = 5;
let audioEnabled = true;
let audioCtx = null;
let animationFrameId = null;

// --- DOM Elements ---
const yesBtn = document.getElementById('yesBtn');
const noBtn = document.getElementById('noBtn');
const lobbyCard = document.getElementById('lobbyCard');
const errorOverlay = document.getElementById('errorOverlay');
const dismissErrorBtn = document.getElementById('dismissErrorBtn');
const victoryScreen = document.getElementById('victoryScreen');

const confettiCanvas = document.getElementById('confettiCanvas');
const audioToggle = document.getElementById('audioToggle');
const audioStatus = document.getElementById('audioStatus');

// --- Audio Synthesizer (Web Audio API) ---
function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function playSound(type) {
  if (!audioEnabled) return;
  initAudio();
  const now = audioCtx.currentTime;

  switch(type) {
    case 'evade': {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(350, now);
      osc.frequency.exponentialRampToValueAtTime(1000, now + 0.12);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.13);
      break;
    }
    case 'lock': {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(440.00, now + 0.05); // A4
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.setValueAtTime(0.1, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.16);
      break;
    }
    case 'error': {
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc1.type = 'sawtooth';
      osc2.type = 'sawtooth';
      osc1.frequency.setValueAtTime(120, now);
      osc2.frequency.setValueAtTime(122, now);
      
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.setValueAtTime(0.15, now + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.4);
      osc2.stop(now + 0.4);
      break;
    }
    case 'click': {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(750, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
      break;
    }
    case 'victory': {
      const playNote = (freq, time, duration, shape='triangle', vol=0.08) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = shape;
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(vol, time);
        gain.gain.exponentialRampToValueAtTime(0.002, time + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(time);
        osc.stop(time + duration);
      };
      // Valorant Victory-style futuristic major chord hook
      playNote(220.00, now, 1.5, 'sine', 0.15);       // A3
      playNote(277.18, now + 0.15, 1.2, 'triangle', 0.08); // C#4
      playNote(329.63, now + 0.3, 1.2, 'triangle', 0.08);  // E4
      playNote(440.00, now + 0.45, 1.5, 'sine', 0.12);     // A4
      playNote(554.37, now + 0.6, 2.0, 'sawtooth', 0.04);  // C#5 (Bright sheen)
      playNote(659.25, now + 0.75, 2.5, 'sine', 0.08);     // E5
      break;
    }
  }
}

// --- Yes Button Evasion Logic ---
const buttonGroup = document.querySelector('.button-group');

function moveYesButton() {
  if (hoverCount >= MAX_EVADES) {
    return;
  }

  hoverCount++;
  playSound('evade');

  // If it's the first evasion, append the button to document.body
  // This removes it from the parent card which has clip-paths/filters,
  // making position: fixed behave perfectly relative to the viewport.
  if (!yesBtn.classList.contains('evading')) {
    document.body.appendChild(yesBtn);
    yesBtn.classList.add('evading');
  }

  // Use a safer padding from screen edges (e.g. 10% of screen width)
  const safePaddingX = Math.max(80, window.innerWidth * 0.1);
  const safePaddingY = Math.max(80, window.innerHeight * 0.1);
  
  const btnWidth = yesBtn.offsetWidth || 160;
  const btnHeight = yesBtn.offsetHeight || 50;

  // Calculate range of valid positions keeping the button strictly visible on page
  const minX = safePaddingX;
  const maxX = window.innerWidth - btnWidth - safePaddingX;
  const minY = safePaddingY;
  const maxY = window.innerHeight - btnHeight - safePaddingY;

  // Fallback to simpler bounds if screen is too small
  const finalMinX = maxX > minX ? minX : 20;
  const finalMaxX = maxX > minX ? maxX : window.innerWidth - btnWidth - 20;
  const finalMinY = maxY > minY ? minY : 20;
  const finalMaxY = maxY > minY ? maxY : window.innerHeight - btnHeight - 20;

  // Generate coordinates in the safe window range
  const randomX = Math.random() * (finalMaxX - finalMinX) + finalMinX;
  const randomY = Math.random() * (finalMaxY - finalMinY) + finalMinY;

  // Update button positioning to evading state
  yesBtn.style.left = `${randomX}px`;
  yesBtn.style.top = `${randomY}px`;

  // Update visual hints on screen if they are paying attention
  console.log(`Lobby evasive maneuvers: ${hoverCount}/${MAX_EVADES}`);

  // Lock in place after 5 evasions (keep final coordinate)
  if (hoverCount === MAX_EVADES) {
    setTimeout(() => {
      // Keep it fixed on screen at this final coordinate.
      // Style update to indicate the button is now locked in place
      yesBtn.style.boxShadow = '0 0 25px var(--cyan)';
      yesBtn.style.borderColor = 'var(--cyan)';
      yesBtn.style.background = 'var(--cyan)';
      yesBtn.style.color = '#000';
      yesBtn.innerText = "Aim practice done, Let's roll";
      playSound('lock');
    }, 100);
  }
}

// Hover Event triggers evasion
yesBtn.addEventListener('mouseenter', () => {
  if (hoverCount < MAX_EVADES) {
    moveYesButton();
  }
});

// Touch event support for mobile
yesBtn.addEventListener('touchstart', (e) => {
  if (hoverCount < MAX_EVADES) {
    e.preventDefault();
    moveYesButton();
  }
});

// Click Event for YES (Victory Trigger)
yesBtn.addEventListener('click', () => {
  // Prevent early clicking (e.g. keyboard navigation or ultra-fast clicks)
  if (hoverCount < MAX_EVADES) {
    moveYesButton();
    return;
  }

  playSound('victory');
  victoryScreen.classList.add('active');
  startConfetti();
  
  // Hide the YES button so it doesn't float over the Victory screen
  yesBtn.style.display = 'none';
});

// --- No Button Logic ---
noBtn.addEventListener('click', () => {
  playSound('error');
  errorOverlay.classList.add('active');
  
  // Permanent removal of NO choice
  noBtn.style.display = 'none';
});

// Dismiss Error Overlay
dismissErrorBtn.addEventListener('click', () => {
  playSound('click');
  errorOverlay.classList.remove('active');
});

// --- Audio Control Toggle ---
audioToggle.addEventListener('click', () => {
  audioEnabled = !audioEnabled;
  if (audioEnabled) {
    audioStatus.innerText = 'SFX: ON';
    audioToggle.style.opacity = '1';
    playSound('click');
  } else {
    audioStatus.innerText = 'SFX: MUTED';
    audioToggle.style.opacity = '0.5';
  }
});

// Activate sound on first user gesture (overcomes autoplay blockers)
window.addEventListener('click', initAudio, { once: true });
window.addEventListener('touchstart', initAudio, { once: true });

// --- VC Option Logic ---
const vcBtn = document.getElementById('vcBtn');
let vcState = 0;
let fragileClicks = 0;

if (vcBtn) {
  vcBtn.addEventListener('click', () => {
    if (vcState === 0) {
      playSound('click');
      vcState = 1;
      vcBtn.innerText = 'Are you sure?';
      vcBtn.style.backgroundColor = 'var(--valorant-red)';
      vcBtn.style.color = '#fff';
    } else if (vcState === 1) {
      playSound('lock');
      vcState = 2;
      vcBtn.innerText = 'Okay, Navya You got my attention. VC is on';
      vcBtn.style.backgroundColor = 'var(--cyan)';
      vcBtn.style.color = '#000';
    } else if (vcState === 2) {
      playSound('error');
      vcState = 3;
      vcBtn.innerText = "Oye, don't press me again. I am fragile";
      vcBtn.style.backgroundColor = '#8b2e37'; // warned red-ish tone
      vcBtn.style.color = '#fff';
      vcBtn.style.borderColor = 'rgba(255, 70, 85, 0.4)';
    } else if (vcState === 3) {
      fragileClicks++;
      if (fragileClicks === 1) {
        playSound('evade'); // play high pitch hurt tone
        vcBtn.innerText = 'ouch';
      } else if (fragileClicks <= 5) {
        playSound('evade');
        vcBtn.innerText = `ouch x${fragileClicks}`;
      }

      if (fragileClicks <= 5) {
        // Progressively shift styling to look more "damaged" (darker red overlay)
        const intensity = 1 - (fragileClicks * 0.15);
        vcBtn.style.backgroundColor = `rgba(139, 0, 0, ${intensity})`;
        vcBtn.style.borderColor = `rgba(255, 70, 85, ${intensity * 0.5})`;
      } else if (fragileClicks === 6) {
        playSound('error'); // Buzz error shutdown tone
        vcBtn.innerText = 'okay, you hurt me. No more button press for you';
        vcBtn.style.backgroundColor = '#1f2933';
        vcBtn.style.color = 'var(--text-muted)';
        vcBtn.style.borderColor = 'rgba(236, 232, 225, 0.05)';
        vcBtn.style.cursor = 'not-allowed';
        vcBtn.disabled = true; // Permanently lock
      }
    }
  });
}

// --- Confetti celebration canvas system ---
const particles = [];
const confettiColors = ['#ff4655', '#ffb800', '#00f0ff', '#ece8e1', '#ffffff'];

function resizeCanvas() {
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeCanvas);

class ConfettiParticle {
  constructor() {
    this.x = Math.random() * confettiCanvas.width;
    this.y = Math.random() * -confettiCanvas.height - 20;
    this.size = Math.random() * 8 + 4;
    this.color = confettiColors[Math.floor(Math.random() * confettiColors.length)];
    this.speedY = Math.random() * 3 + 2;
    this.speedX = Math.random() * 2 - 1;
    this.rotation = Math.random() * 360;
    this.rotationSpeed = Math.random() * 2 - 1;
  }

  update() {
    this.y += this.speedY;
    this.x += this.speedX;
    this.rotation += this.rotationSpeed;

    if (this.y > confettiCanvas.height) {
      this.y = -20;
      this.x = Math.random() * confettiCanvas.width;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate((this.rotation * Math.PI) / 180);
    ctx.fillStyle = this.color;
    
    // Draw skewed square/rhombus
    ctx.beginPath();
    ctx.moveTo(-this.size, -this.size / 2);
    ctx.lineTo(this.size, -this.size);
    ctx.lineTo(this.size / 2, this.size);
    ctx.lineTo(-this.size, this.size / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

function startConfetti() {
  resizeCanvas();
  particles.length = 0;
  for (let i = 0; i < 100; i++) {
    particles.push(new ConfettiParticle());
  }
  
  const ctx = confettiCanvas.getContext('2d');
  
  function animate() {
    ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    
    particles.forEach(p => {
      p.update();
      p.draw(ctx);
    });
    
    animationFrameId = requestAnimationFrame(animate);
  }
  
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
  animate();
}
