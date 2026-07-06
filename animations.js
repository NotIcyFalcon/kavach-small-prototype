const dummyData = [
    { logo: "STEP 01", title: "IMAGE CAPTURE", desc: "Meta Smart Glasses capture a 1-fps POV frame of the construction site from the worker's perspective." },
    { logo: "STEP 02", title: "EDGE PROCESSING", desc: "Local YOLOv8 model runs on the paired smartphone, detecting bounding boxes around tools and machinery." },
    { logo: "STEP 03", title: "HASH FILTERING", desc: "Edge AI compares frame hashes, filtering out 98% of static frames to preserve bandwidth and battery." },
    { logo: "STEP 04", title: "CLOUD VLM", desc: "When anomalous activity is detected, the frame is sent to the Cloud Vision-Language Model for deep reasoning." },
    { logo: "STEP 05", title: "KNOWLEDGE GRAPH", desc: "The VLM grounds its findings in a SPARQL Knowledge Graph, mapping hazards to specific OSHA regulations." },
    { logo: "STEP 06", title: "AUDIO ALERT", desc: "A generated text-to-speech warning is sent back to the glasses and played via spatial audio." },
    { logo: "FEATURE", title: "SPATIAL TRACKING", desc: "The system logs tool and inventory positions in real-time, allowing workers to ask 'Where is my drill?'." },
    { logo: "FEATURE", title: "OFFLINE FALLBACK", desc: "If Wi-Fi drops, the edge device falls back to simple geometric heuristics to ensure safety never goes offline." },
];

function createCardHTML(data) {
    return `
        <div class="helix-card">
            <div class="card-content">
                <div class="card-logo">${data.logo}</div>
                <div class="card-title">${data.title}</div>
                <div class="card-desc">${data.desc}</div>
            </div>
        </div>
    `;
}

// Global scroll state
let targetScrollP = 0;
let currentScrollP = 0;

window.addEventListener('scroll', () => {
    targetScrollP = getScrollProgress();
}, { passive: true });

function getScrollProgress() {
    const section = document.getElementById('helix');
    if (!section) return 0;
    
    // We calculate scroll progress based on how far we've scrolled past the TOP of the document,
    // up to the height of the helix-spacer.
    const scrollY = window.scrollY;
    const scrollableDistance = section.offsetHeight - window.innerHeight;
    
    if (scrollY <= 0) return 0;
    if (scrollY >= scrollableDistance) return 1;
    
    return scrollY / scrollableDistance;
}

// Dynamic radius based on screen size (Mobile Support)
function getRadius(desktopRadius) {
    if (window.innerWidth < 768) {
        return desktopRadius * 0.55; 
    }
    return desktopRadius;
}

/* ───────────────────────────────────────────────
   1. 3D HELICAL PATH
─────────────────────────────────────────────── */
const helixContainer = document.getElementById('helixScene');
const helixWrappers = [];
const HELIX_COUNT = 8;

if (helixContainer) {
    for (let i = 0; i < HELIX_COUNT; i++) {
        const el = document.createElement('div');
        el.className = 'helix-card-wrapper';
        el.innerHTML = createCardHTML(dummyData[i % dummyData.length]);
        helixContainer.appendChild(el);
        helixWrappers.push(el);
    }
}

let mouseX = 0;
let mouseY = 0;
window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2; 
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
});

function updateHelix(p) {
    const cardRadius = getRadius(450);
    helixWrappers.forEach((wrapper, index) => {
        const targetP = index / (HELIX_COUNT - 1);
        const diff = p - targetP; 
        
        const y = -diff * 3500; 
        const angle = diff * Math.PI * 5; 
        
        const x = Math.sin(angle) * cardRadius;
        const z = Math.cos(angle) * cardRadius;
        
        const depth = Math.cos(angle); 
        
        const rotateY = (angle * 180 / Math.PI) + (mouseX * 15);
        const rotateX = -mouseY * 15;
        
        const scale = (depth + 1.5) / 2.5 * 0.7 + 0.3; 
        const opacity = (depth + 1) / 2 * 0.8 + 0.2; 
        const blur = (1 - ((depth + 1) / 2)) * 15; 
        
        wrapper.style.transform = `translate3d(${x}px, ${y}px, ${z}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale})`;
        wrapper.style.opacity = opacity;
        wrapper.style.filter = `blur(${blur}px)`;
        wrapper.style.zIndex = Math.floor(depth * 1000);
    });
}

/* ───────────────────────────────────────────────
   2. CANVAS ENGINE (Particles + Double Helix Tubes)
─────────────────────────────────────────────── */
const canvas = document.getElementById('spineCanvas');
const ctx = canvas.getContext('2d');
let particles = [];
const PARTICLE_COUNT = 800; 

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

class SpineParticle {
    constructor() {
        this.reset();
        this.y = Math.random() * canvas.height;
    }
    reset() {
        this.angle = Math.random() * Math.PI * 2;
        this.radius = Math.random() * getRadius(80) + 20; 
        this.y = canvas.height + Math.random() * 200; 
        this.speedY = -(Math.random() * 1.5 + 0.5); 
        this.speedAngle = (Math.random() - 0.5) * 0.02;
        this.colorType = Math.random() > 0.5 ? 'cyan' : 'purple';
        this.size = Math.random() * 2.5 + 0.5;
    }
    update(scrollDelta) {
        this.angle += this.speedAngle + (scrollDelta * 0.005);
        this.y += this.speedY - (scrollDelta * 0.5);
        
        if (this.y < -100) this.reset();
        if (this.y > canvas.height + 200) this.y = -50; 
    }
    draw() {
        const x = canvas.width / 2 + Math.sin(this.angle) * this.radius;
        const depth = Math.cos(this.angle); 
        const scale = (depth + 1.5) / 2; 
        const opacity = (depth + 1) / 2 * 0.6 + 0.1;
        
        ctx.beginPath();
        ctx.arc(x, this.y, this.size * scale, 0, Math.PI * 2);
        ctx.fillStyle = this.colorType === 'cyan' ? `rgba(34, 211, 238, ${opacity})` : `rgba(167, 139, 250, ${opacity})`;
        ctx.fill();
    }
}

for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(new SpineParticle());

function drawSegment(d) {
    const x1 = canvas.width / 2 + Math.sin(d.a1) * d.radius;
    const x2 = canvas.width / 2 + Math.sin(d.a2) * d.radius;
    const depth = d.z / d.radius; 
    const scale = (depth + 2.5) / 3.5; 
    const alpha = (depth + 1) / 2 * 0.7 + 0.1;
    
    ctx.beginPath();
    ctx.moveTo(x1, d.y1);
    ctx.lineTo(x2, d.y2);
    ctx.lineCap = 'round';
    
    ctx.lineWidth = 14 * scale;
    ctx.strokeStyle = `rgba(5, 8, 15, ${alpha + 0.2})`;
    ctx.stroke();
    
    ctx.lineWidth = 3 * scale;
    if (d.color === 'cyan') {
        ctx.strokeStyle = `rgba(150, 240, 255, ${alpha})`;
        ctx.shadowColor = `rgba(34, 211, 238, ${alpha})`;
    } else {
        ctx.strokeStyle = `rgba(220, 200, 255, ${alpha})`;
        ctx.shadowColor = `rgba(167, 139, 250, ${alpha})`;
    }
    ctx.shadowBlur = 20 * scale;
    ctx.stroke();
    ctx.shadowBlur = 0;
}

let lastScrollP = 0;

/* ───────────────────────────────────────────────
   3. MAIN RENDER LOOP 
─────────────────────────────────────────────── */
function renderLoop() {
    currentScrollP += (targetScrollP - currentScrollP) * 0.06;
    
    // We only need to compute heavy 3D math if we are within the helix scroll zone
    // Once we scroll completely past the helix (p >= 1), we don't need to re-render the cards 
    // unless they are still animating to a stop.
    updateHelix(currentScrollP);
    
    // Pass the lerped scroll value to CSS for the fluid background
    document.body.style.setProperty('--scroll', currentScrollP);
    
    const scrollDelta = (currentScrollP - lastScrollP) * 1000;
    lastScrollP = currentScrollP;
    
    if (!window.currentScrollDelta) window.currentScrollDelta = 0;
    window.currentScrollDelta += (scrollDelta - window.currentScrollDelta) * 0.1;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const drawables = [];
    
    particles.forEach(p => {
        p.update(window.currentScrollDelta);
        drawables.push({ type: 'particle', z: Math.cos(p.angle) * p.radius, obj: p });
    });
    
    const step = 15;
    const helixRadius = getRadius(140); 
    const yStart = -200;
    const yEnd = canvas.height + 200;
    
    const worldAngle = currentScrollP * Math.PI * 5; 
    const yOffset = currentScrollP * 2500; 
    const frequency = 0.003; 
    
    for (let y = yStart; y < yEnd; y += step) {
        const a1_1 = (y - yOffset) * frequency - worldAngle; 
        const a1_2 = (y + step - yOffset) * frequency - worldAngle;
        
        const z1 = Math.cos(a1_1) * helixRadius;
        const z2 = Math.cos(a1_2) * helixRadius;
        drawables.push({ type: 'segment', z: (z1 + z2) / 2, y1: y, y2: y + step, a1: a1_1, a2: a1_2, radius: helixRadius, color: 'cyan' });
        
        const z3 = Math.cos(a1_1 + Math.PI) * helixRadius;
        const z4 = Math.cos(a1_2 + Math.PI) * helixRadius;
        drawables.push({ type: 'segment', z: (z3 + z4) / 2, y1: y, y2: y + step, a1: a1_1 + Math.PI, a2: a1_2 + Math.PI, radius: helixRadius, color: 'purple' });
    }
    
    drawables.sort((a, b) => a.z - b.z);
    drawables.forEach(d => d.type === 'particle' ? d.obj.draw() : drawSegment(d));
    
    requestAnimationFrame(renderLoop);
}

// Start
renderLoop();


/* ═══════════════════════════════════════════════════════════════
   DEMO FUNCTIONALITY (Merged from KAVACH_Demo.html)
═══════════════════════════════════════════════════════════════ */

// ─── Scroll animations ───
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible') });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal,.reveal-scale,.reveal-left,.reveal-right').forEach(el => observer.observe(el));

// ─── Navbar scroll ───
window.addEventListener('scroll', () => {
  document.getElementById('nav').classList.toggle('scrolled', window.scrollY > 60);
});

// ─── Image Upload ───
const imageArea = document.getElementById('imageArea');
const fileInput = document.getElementById('fileInput');
const previewContainer = document.getElementById('previewContainer');
const previewImg = document.getElementById('previewImg');
const uploadPrompt = document.getElementById('uploadPrompt');
const analyzeBtn = document.getElementById('analyzeBtn');
let currentBase64 = null;

if (fileInput) {
    fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));
}
if (imageArea) {
    imageArea.addEventListener('dragover', (e) => { e.preventDefault(); imageArea.classList.add('dragover'); });
    imageArea.addEventListener('dragleave', () => imageArea.classList.remove('dragover'));
    imageArea.addEventListener('drop', (e) => { e.preventDefault(); imageArea.classList.remove('dragover'); handleFile(e.dataTransfer.files[0]); });
}

function handleFile(file) {
  if (!file || !file.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    previewImg.src = e.target.result;
    currentBase64 = e.target.result.split(',')[1];
    uploadPrompt.style.display = 'none';
    previewContainer.classList.add('active');
    imageArea.classList.add('has-image');
    analyzeBtn.classList.add('visible');
    resetResults();
  };
  reader.readAsDataURL(file);
}

function resetResults() {
  document.getElementById('hudOverlay').classList.remove('active');
  document.getElementById('riskMeter').style.display = 'none';
  document.getElementById('audioBar').classList.remove('active');
  document.getElementById('hazardList').innerHTML = '<div class="empty-state" id="emptyState"><div class="icon">🔍</div><p>Upload an image and click<br>"Analyze" to detect hazards</p></div>';
  document.getElementById('resultStatus').textContent = 'Ready to analyze';
  document.getElementById('analyzingState').classList.remove('active');
}

// ─── Analyze ───
async function analyzeImage() {
  // Use env.js variable if provided, otherwise use the hardcoded fallback secret
  const key = window.ENV_GEMINI_API_KEY;
  if (!key) throw new Error('API key not found. Make sure the image is valid and the model is accessible.')
  
  if (!currentBase64) { alert('Please upload an image first.'); return; }

  const analyzeBtn = document.getElementById('analyzeBtn');
  analyzeBtn.disabled = true;
  analyzeBtn.textContent = 'Analyzing…';
  const emptyState = document.getElementById('emptyState');
  if (emptyState) emptyState.remove();
  
  document.getElementById('hazardList').innerHTML = '';
  document.getElementById('analyzingState').classList.add('active');
  document.getElementById('resultStatus').textContent = 'Processing…';
  document.getElementById('hudOverlay').classList.add('active');

  const prompt = `You are KAVACH, an AI construction safety inspector analyzing a first-person image from a worker's smart glasses.

IMPORTANT RULES FOR "SAFE BY DEFAULT" & ALERT FATIGUE:
1. SAFE BY DEFAULT: If the site looks generally safe and workers are following standard protocols, DO NOT force finding a hazard. It is perfectly fine (and encouraged) to return an empty "hazards": [] array and a low risk_score (1-3).
2. DO NOT NITPICK: Ignore minor issues, questionable angles, or distant bystander PPE violations. Only flag undeniable, blatant safety violations.
3. WEARER PRIORITY: Assume the camera holder (Worker_Self) is a worker standing at the camera's origin. 
4. TWO LEVELS OF WARNING:
   - "CAUTION" (Severity: LOW/MEDIUM): For general situational awareness (e.g., "Slippery floor ahead", "Active crane in the area").
   - "ALERT" (Severity: HIGH/CRITICAL): ONLY for immediate danger to the wearer, or extreme life-threatening danger to a bystander (e.g., about to fall, standing under a suspended load).
5. ILL-MANAGED SITES & RISKS: If the place is ill-managed and has hazards and is risky, then generate a CAUTION also to remind the worker to be safe and take notice of those things. Do this mainly for Worker_Self; for other workers only do it if it is very risky.

Respond ONLY with valid JSON in this exact format:
{
  "is_construction_site": true,
  "risk_score": 2,
  "risk_level": "LOW",
  "summary": "Site appears safe and compliant.",
  "hazards": [
    {
      "type": "General Awareness",
      "severity": "CAUTION",
      "description": "Active machinery operating in the distant left.",
      "regulation": "General Safety",
      "recommended_action": "Maintain safe distance."
    }
  ],
  "wearer_risks": "None",
  "audio_alert": "" 
}`;

  let rawText = '';
  try {
    const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inline_data: { mime_type: 'image/jpeg', data: currentBase64 } }
          ]
        }],
        generationConfig: { 
          temperature: 0.2, 
          maxOutputTokens: 8192,
          responseMimeType: "application/json" 
        }
      })
    });

    const data = await resp.json();
    if (data.error) throw new Error(data.error.message);

    rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    let text = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      text = text.substring(firstBrace, lastBrace + 1);
    }
    
    if (!text) throw new Error('API returned an empty response. Make sure the image is valid and the model is accessible.');
    
    const result = JSON.parse(text);
    displayResults(result);
  } catch (err) {
    document.getElementById('analyzingState').classList.remove('active');
    
    // STOP SCANNING ANIMATION ON ERROR
    const hudOverlay = document.getElementById('hudOverlay');
    if (hudOverlay) hudOverlay.classList.remove('active');
    
    let errorHTML = `<div class="empty-state" style="align-items:flex-start; text-align:left;">
      <div class="icon" style="margin: 0 auto 12px;">⚠️</div>
      <p style="text-align:center; width:100%;">Error: ${err.message}</p>`;
      
    if (rawText) {
      errorHTML += `
      <div style="width:100%; margin-top:20px; text-align:left;">
        <p style="font-size:11px; color:var(--orange); font-weight:bold; margin-bottom:6px; letter-spacing:1px; text-transform:uppercase;">Raw Output from AI:</p>
        <pre style="background:rgba(0,0,0,0.3); padding:14px; border-radius:8px; border:1px solid rgba(255,107,43,0.2); font-size:11px; overflow-x:auto; white-space:pre-wrap; font-family:'JetBrains Mono',monospace; color:var(--muted);">${rawText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
      </div>`;
    }
    errorHTML += `</div>`;
    
    document.getElementById('hazardList').innerHTML = errorHTML;
    document.getElementById('resultStatus').textContent = 'Error';
  }

  analyzeBtn.disabled = false;
  analyzeBtn.textContent = '🛡️ Analyze for Safety Hazards';
}

// ─── Display Results ───
function displayResults(result) {
  document.getElementById('analyzingState').classList.remove('active');
  
  // STOP SCANNING ANIMATION ON SUCCESS
  const hudOverlay = document.getElementById('hudOverlay');
  if (hudOverlay) hudOverlay.classList.remove('active');

  const riskMeter = document.getElementById('riskMeter');
  const riskFill = document.getElementById('riskFill');
  const riskLabel = document.getElementById('riskLabel');
  riskMeter.style.display = 'block';
  const score = result.risk_score || 0;
  riskFill.style.width = (score * 10) + '%';
  riskFill.className = 'risk-meter-fill ' + (score <= 3 ? 'risk-low' : score <= 5 ? 'risk-medium' : score <= 7 ? 'risk-high' : 'risk-critical');
  riskLabel.textContent = `${result.risk_level || 'UNKNOWN'} (${score}/10)`;
  riskLabel.style.color = score <= 3 ? '#10b981' : score <= 5 ? '#fbbf24' : score <= 7 ? '#ff6b2b' : '#ef4444';

  document.getElementById('resultStatus').textContent = result.summary || 'Analysis complete';

  const list = document.getElementById('hazardList');
  list.innerHTML = '';

  if (!result.is_construction_site) {
    list.innerHTML = '<div class="empty-state"><div class="icon">🏠</div><p>This doesn\'t appear to be a construction site.<br>Try uploading an image of a construction zone.</p></div>';
    return;
  }

  if (result.wearer_risks && result.wearer_risks.toLowerCase() !== 'none') {
    const selfCard = document.createElement('div');
    selfCard.className = 'hazard-item';
    selfCard.style.borderColor = 'rgba(239,68,68,.3)';
    selfCard.style.animationDelay = '0s';
    selfCard.innerHTML = `
      <div class="hazard-top"><span class="severity severity-critical">👤 WEARER</span><span class="hazard-title">Worker_Self Risk</span></div>
      <div class="hazard-desc">${result.wearer_risks}</div>
    `;
    list.appendChild(selfCard);
  }

  (result.hazards || []).forEach((h, i) => {
    const card = document.createElement('div');
    card.className = 'hazard-item';
    card.style.animationDelay = (i * 0.1) + 's';
    const sevClass = h.severity === 'CRITICAL' ? 'severity-critical' : h.severity === 'HIGH' ? 'severity-high' : h.severity === 'MEDIUM' ? 'severity-medium' : 'severity-low';
    card.innerHTML = `
      <div class="hazard-top"><span class="severity ${sevClass}">${h.severity}</span><span class="hazard-title">${h.type}</span></div>
      <div class="hazard-desc">${h.description}</div>
      ${h.regulation ? `<div class="hazard-code">📜 ${h.regulation}</div>` : ''}
      ${h.recommended_action ? `<div class="hazard-desc" style="margin-top:6px;color:#22d3ee">→ ${h.recommended_action}</div>` : ''}
    `;
    list.appendChild(card);
  });

  if (result.audio_alert) {
    const audioBar = document.getElementById('audioBar');
    audioBar.classList.add('active');
    document.getElementById('audioText').textContent = result.audio_alert;
    window._kavachAlert = result.audio_alert;
    setTimeout(() => speakAlert(), 600);
  }
}

// ─── Text-to-Speech ───
function speakAlert() {
  if (!window._kavachAlert) return;
  const utter = new SpeechSynthesisUtterance(window._kavachAlert);
  utter.rate = 0.95;
  utter.pitch = 0.9;
  utter.volume = 1;
  speechSynthesis.cancel();
  speechSynthesis.speak(utter);
}
