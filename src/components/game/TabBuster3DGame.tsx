import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Play, Pause, RotateCcw, Volume2, VolumeX, X, Trophy, Shield, Sparkles, Zap, Flame } from 'lucide-react';
import { playChime } from '../../utils/sound';

interface TabBuster3DGameProps {
  onExitGame: () => void;
  onDopamineEarned?: (amount: number) => void;
}

type GameState = 'title' | 'playing' | 'paused' | 'gameover' | 'victory';

interface LaserShot {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
}

interface DistractionTab {
  group: THREE.Group;
  velocity: THREE.Vector3;
  rotSpeed: THREE.Vector3;
  hp: number;
  maxHp: number;
  label: string;
}

interface DopamineGem {
  mesh: THREE.Mesh;
  rotSpeed: number;
}

interface Particle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
}

export const TabBuster3DGame: React.FC<TabBuster3DGameProps> = ({ onExitGame, onDopamineEarned }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // React UI state (kept minimal and separated from 60fps render loop)
  const [gameState, setGameState] = useState<GameState>('title');
  const [score, setScore] = useState(0);
  const [dopamineShield, setDopamineShield] = useState(100);
  const [tabsCleared, setTabsCleared] = useState(0);
  const [comboStreak, setComboStreak] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [dockCollapsed, setDockCollapsed] = useState(false);

  // References for mutable game loop state
  const stateRef = useRef({
    gameState: 'title' as GameState,
    score: 0,
    dopamineShield: 100,
    tabsCleared: 0,
    comboStreak: 1,
    isMuted: false,
    keys: {
      left: false,
      right: false,
      up: false,
      down: false,
      fire: false,
      pause: false,
    },
    lastFireTime: 0,
    cameraShake: 0,
  });

  // Sound Synth for Game Actions
  const playLaserSound = () => {
    if (stateRef.current.isMuted) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.16);
    } catch {}
  };

  const playExplodeSound = () => {
    if (stateRef.current.isMuted) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(160, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.36);
    } catch {}
  };

  useEffect(() => {
    stateRef.current.isMuted = isMuted;
  }, [isMuted]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Detect Software WebGL
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 2. Setup Three.js Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0c0a09); // Stone 950
    scene.fog = new THREE.FogExp2(0x0c0a09, 0.015);

    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      200
    );
    camera.position.set(0, 14, 18);
    camera.lookAt(0, 0, -4);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // 3. Studio Environment Reflections (RoomEnvironment)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 4. Lighting Rig (Warm Key Light + Cool Hemisphere Fill)
    const hemiLight = new THREE.HemisphereLight(0xffedd5, 0x1c1917, 1.2);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xf59e0b, 2.5); // Warm Amber
    dirLight.position.set(12, 20, 10);
    dirLight.castShadow = !isSoftwareGl;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.bias = -0.0005;
    scene.add(dirLight);

    // Ground Grid (Cyber Focus Arena)
    const gridHelper = new THREE.GridHelper(80, 40, 0xd97706, 0x292524);
    gridHelper.position.y = -0.5;
    scene.add(gridHelper);

    // 5. Procedural 3-12 Part Hero Subject: "Focus Drone" (Composite THREE.Group)
    const playerGroup = new THREE.Group();
    playerGroup.position.set(0, 0, 8);

    // Part 1: Main Hull (Cockpit wedge)
    const hullGeo = new THREE.ConeGeometry(0.9, 2.4, 4);
    hullGeo.rotateX(Math.PI / 2);
    const hullMat = new THREE.MeshStandardMaterial({
      color: 0x1c1917,
      metalness: 0.85,
      roughness: 0.2,
    });
    const hullMesh = new THREE.Mesh(hullGeo, hullMat);
    hullMesh.castShadow = true;
    playerGroup.add(hullMesh);

    // Part 2: Wings / Stabilizers
    const wingGeo = new THREE.BoxGeometry(3.2, 0.08, 0.9);
    const wingMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b, // Amber
      metalness: 0.9,
      roughness: 0.15,
    });
    const wingMesh = new THREE.Mesh(wingGeo, wingMat);
    wingMesh.position.set(0, 0, 0.4);
    playerGroup.add(wingMesh);

    // Part 3 & 4: Dual Jet Thrusters (Left & Right)
    const thrusterGeo = new THREE.CylinderGeometry(0.2, 0.25, 0.7, 8);
    thrusterGeo.rotateX(Math.PI / 2);
    const thrusterMat = new THREE.MeshStandardMaterial({
      color: 0x44403c,
      metalness: 0.95,
      roughness: 0.1,
    });
    const leftThruster = new THREE.Mesh(thrusterGeo, thrusterMat);
    leftThruster.position.set(-0.8, 0, 0.9);
    const rightThruster = leftThruster.clone();
    rightThruster.position.set(0.8, 0, 0.9);
    playerGroup.add(leftThruster);
    playerGroup.add(rightThruster);

    // Part 5: Glowing Engine Nozzle Rings (Cyan/Amber emissive)
    const glowGeo = new THREE.TorusGeometry(0.18, 0.06, 8, 16);
    const glowMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const leftGlow = new THREE.Mesh(glowGeo, glowMat);
    leftGlow.position.set(-0.8, 0, 1.25);
    const rightGlow = leftGlow.clone();
    rightGlow.position.set(0.8, 0, 1.25);
    playerGroup.add(leftGlow);
    playerGroup.add(rightGlow);

    // Part 6: Front Laser Cannon
    const cannonGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.8, 8);
    cannonGeo.rotateX(Math.PI / 2);
    const cannonMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      metalness: 0.9,
      roughness: 0.1,
    });
    const cannon = new THREE.Mesh(cannonGeo, cannonMat);
    cannon.position.set(0, 0, -1.2);
    playerGroup.add(cannon);

    // Soft Radial Contact Shadow beneath the drone
    const shadowGeo = new THREE.PlaneGeometry(2.5, 2.5);
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const shadowCtx = shadowCanvas.getContext('2d')!;
    const grad = shadowCtx.createRadialGradient(64, 64, 0, 64, 64, 60);
    grad.addColorStop(0, 'rgba(0,0,0,0.6)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    shadowCtx.fillStyle = grad;
    shadowCtx.fillRect(0, 0, 128, 128);
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
    });
    const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.y = -0.45;
    playerGroup.add(contactShadow);

    scene.add(playerGroup);

    // 6. Dynamic Game Entities Arrays
    const lasers: LaserShot[] = [];
    const distractions: DistractionTab[] = [];
    const gems: DopamineGem[] = [];
    const particles: Particle[] = [];

    // Helper: Generate procedural 3D Tab Card with Canvas Texture
    const distractionTitles = [
      '100 TABS OPEN',
      'YOUTUBE RABBIT HOLE',
      'NEW SHINY SAAS IDEA',
      'REFACTOR WHOLE DB NOW',
      'ENDLESS SOCIAL SCROLL',
      'REDDIT THREAD #542',
      'UNFINISHED FEATURE BRANCH',
    ];

    const createTabTexture = (label: string) => {
      const c = document.createElement('canvas');
      c.width = 256;
      c.height = 128;
      const ctx = c.getContext('2d')!;
      // Dark slate background with cyber border
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(0, 0, 256, 128);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 6;
      ctx.strokeRect(4, 4, 248, 120);

      // Top Tab bar
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(4, 4, 248, 28);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('✖ DISTRACTION TAB', 14, 24);

      // Body text
      ctx.fillStyle = '#f87171';
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, 128, 76);

      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      return tex;
    };

    const spawnDistractionTab = () => {
      const label = distractionTitles[Math.floor(Math.random() * distractionTitles.length)];
      const tabGroup = new THREE.Group();

      // Card Geometry (Composite 3 parts: Card Body + Red Frame + Glowing Wire)
      const cardGeo = new THREE.BoxGeometry(2.4, 1.3, 0.1);
      const cardMat = new THREE.MeshStandardMaterial({
        map: createTabTexture(label),
        metalness: 0.3,
        roughness: 0.4,
      });
      const cardMesh = new THREE.Mesh(cardGeo, cardMat);
      cardMesh.castShadow = true;
      tabGroup.add(cardMesh);

      // Wireframe glow accent
      const wireGeo = new THREE.WireframeGeometry(cardGeo);
      const wireMat = new THREE.LineBasicMaterial({ color: 0xef4444, linewidth: 2 });
      const wire = new THREE.LineSegments(wireGeo, wireMat);
      tabGroup.add(wire);

      // Random position along upper perimeter
      const spawnX = (Math.random() - 0.5) * 22;
      const spawnZ = -22 - Math.random() * 8;
      tabGroup.position.set(spawnX, 0.8, spawnZ);

      scene.add(tabGroup);

      distractions.push({
        group: tabGroup,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 1.5,
          0,
          2.5 + Math.random() * 2.0
        ),
        rotSpeed: new THREE.Vector3(
          (Math.random() - 0.5) * 0.5,
          (Math.random() - 0.5) * 0.8,
          (Math.random() - 0.5) * 0.3
        ),
        hp: 2,
        maxHp: 2,
        label,
      });
    };

    // Helper: Spawn Dopamine Gem
    const spawnDopamineGem = (pos: THREE.Vector3) => {
      const gemGeo = new THREE.IcosahedronGeometry(0.4, 0);
      const gemMat = new THREE.MeshPhysicalMaterial({
        color: 0x10b981, // Emerald
        emissive: 0x059669,
        emissiveIntensity: 0.6,
        metalness: 0.2,
        roughness: 0.1,
      });
      const gemMesh = new THREE.Mesh(gemGeo, gemMat);
      gemMesh.position.copy(pos);
      gemMesh.position.y = 0.5;
      scene.add(gemMesh);

      gems.push({
        mesh: gemMesh,
        rotSpeed: 2.5,
      });
    };

    // Helper: Particle Burst
    const spawnExplosionParticles = (pos: THREE.Vector3, color = 0xf59e0b) => {
      const pGeo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
      const pMat = new THREE.MeshBasicMaterial({ color });

      for (let i = 0; i < 14; i++) {
        const mesh = new THREE.Mesh(pGeo, pMat);
        mesh.position.copy(pos);
        scene.add(mesh);
        particles.push({
          mesh,
          velocity: new THREE.Vector3(
            (Math.random() - 0.5) * 8,
            Math.random() * 5 + 1,
            (Math.random() - 0.5) * 8
          ),
          life: 0.6 + Math.random() * 0.3,
          maxLife: 0.9,
        });
      }
    };

    // 7. Keyboard Input Listeners (WASD + Arrows + Space + Escape)
    const onKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'KeyW'].includes(e.code)) stateRef.current.keys.up = true;
      if (['ArrowDown', 'KeyS'].includes(e.code)) stateRef.current.keys.down = true;
      if (['ArrowLeft', 'KeyA'].includes(e.code)) stateRef.current.keys.left = true;
      if (['ArrowRight', 'KeyD'].includes(e.code)) stateRef.current.keys.right = true;
      if (['Space', 'Enter'].includes(e.code)) {
        if (stateRef.current.gameState === 'title') {
          stateRef.current.gameState = 'playing';
          setGameState('playing');
          playChime('success');
        } else if (stateRef.current.gameState === 'playing') {
          stateRef.current.keys.fire = true;
        }
      }
      if (e.code === 'Escape') {
        if (stateRef.current.gameState === 'playing') {
          stateRef.current.gameState = 'paused';
          setGameState('paused');
        } else if (stateRef.current.gameState === 'paused') {
          stateRef.current.gameState = 'playing';
          setGameState('playing');
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (['ArrowUp', 'KeyW'].includes(e.code)) stateRef.current.keys.up = false;
      if (['ArrowDown', 'KeyS'].includes(e.code)) stateRef.current.keys.down = false;
      if (['ArrowLeft', 'KeyA'].includes(e.code)) stateRef.current.keys.left = false;
      if (['ArrowRight', 'KeyD'].includes(e.code)) stateRef.current.keys.right = false;
      if (['Space', 'Enter'].includes(e.code)) stateRef.current.keys.fire = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // 8. 60fps Clamped Game Loop with MathUtils damping
    let frameId = 0;
    let lastTime = performance.now();
    let spawnTimer = 0;

    const gameTick = (now: number) => {
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(rawDt, 0.05); // Clamp dt to prevent physics tunnel

      const currentState = stateRef.current.gameState;

      if (currentState === 'title') {
        // Atmospheric title pan
        camera.position.x = Math.sin(now * 0.0006) * 6;
        camera.position.z = 18 + Math.cos(now * 0.0006) * 2;
        camera.lookAt(0, 0, 0);
        playerGroup.rotation.y = Math.sin(now * 0.001) * 0.2;
      } else if (currentState === 'playing') {
        // Player Movement
        const speed = 12;
        if (stateRef.current.keys.left) playerGroup.position.x -= speed * dt;
        if (stateRef.current.keys.right) playerGroup.position.x += speed * dt;
        if (stateRef.current.keys.up) playerGroup.position.z -= speed * dt;
        if (stateRef.current.keys.down) playerGroup.position.z += speed * dt;

        // Clamp arena boundaries
        playerGroup.position.x = THREE.MathUtils.clamp(playerGroup.position.x, -11, 11);
        playerGroup.position.z = THREE.MathUtils.clamp(playerGroup.position.z, -8, 11);

        // Smooth Bank / Tilt
        const targetRoll = (stateRef.current.keys.left ? 0.35 : 0) - (stateRef.current.keys.right ? 0.35 : 0);
        playerGroup.rotation.z = THREE.MathUtils.damp(playerGroup.rotation.z, targetRoll, 8, dt);
        playerGroup.rotation.y = THREE.MathUtils.damp(playerGroup.rotation.y, targetRoll * 0.4, 6, dt);

        // Fire Lasers (Rate limit: 200ms)
        if (stateRef.current.keys.fire && now - stateRef.current.lastFireTime > 190) {
          stateRef.current.lastFireTime = now;
          playLaserSound();

          const laserGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.2, 8);
          laserGeo.rotateX(Math.PI / 2);
          const laserMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
          const laserMesh = new THREE.Mesh(laserGeo, laserMat);
          laserMesh.position.copy(playerGroup.position);
          laserMesh.position.z -= 1.2;
          scene.add(laserMesh);

          lasers.push({
            mesh: laserMesh,
            velocity: new THREE.Vector3(0, 0, -32),
            life: 1.5,
          });
        }

        // Spawn Distractions
        spawnTimer += dt;
        if (spawnTimer > 1.2) {
          spawnTimer = 0;
          if (distractions.length < 9) {
            spawnDistractionTab();
          }
        }

        // Update Lasers
        for (let i = lasers.length - 1; i >= 0; i--) {
          const l = lasers[i];
          l.mesh.position.addScaledVector(l.velocity, dt);
          l.life -= dt;

          if (l.life <= 0 || l.mesh.position.z < -30) {
            scene.remove(l.mesh);
            lasers.splice(i, 1);
          }
        }

        // Update Distractions & Collisions with Lasers
        for (let i = distractions.length - 1; i >= 0; i--) {
          const tab = distractions[i];
          tab.group.position.addScaledVector(tab.velocity, dt);
          tab.group.rotation.x += tab.rotSpeed.x * dt;
          tab.group.rotation.y += tab.rotSpeed.y * dt;

          // Check laser collisions
          for (let j = lasers.length - 1; j >= 0; j--) {
            const l = lasers[j];
            const dist = tab.group.position.distanceTo(l.mesh.position);
            if (dist < 1.4) {
              // Hit!
              tab.hp -= 1;
              scene.remove(l.mesh);
              lasers.splice(j, 1);

              spawnExplosionParticles(tab.group.position, 0xef4444);
              playExplodeSound();

              if (tab.hp <= 0) {
                // Tab cleared!
                scene.remove(tab.group);
                distractions.splice(i, 1);

                // Score & Dopamine Gem drop
                stateRef.current.score += 100 * stateRef.current.comboStreak;
                stateRef.current.tabsCleared += 1;
                stateRef.current.comboStreak = Math.min(10, stateRef.current.comboStreak + 1);

                setScore(stateRef.current.score);
                setTabsCleared(stateRef.current.tabsCleared);
                setComboStreak(stateRef.current.comboStreak);

                spawnDopamineGem(tab.group.position);
                stateRef.current.cameraShake = 0.25;

                // Victory condition: 15 tabs cleared
                if (stateRef.current.tabsCleared >= 15) {
                  stateRef.current.gameState = 'victory';
                  setGameState('victory');
                  playChime('success');
                  onDopamineEarned?.(15);
                }
                break;
              }
            }
          }

          // Check if tab bypassed player or collided with player
          const playerDist = tab.group.position.distanceTo(playerGroup.position);
          if (playerDist < 1.6) {
            // Player collision damage
            stateRef.current.dopamineShield = Math.max(0, stateRef.current.dopamineShield - 20);
            stateRef.current.comboStreak = 1;
            setDopamineShield(stateRef.current.dopamineShield);
            setComboStreak(1);
            stateRef.current.cameraShake = 0.5;

            spawnExplosionParticles(tab.group.position, 0xf87171);
            scene.remove(tab.group);
            distractions.splice(i, 1);

            if (stateRef.current.dopamineShield <= 0) {
              stateRef.current.gameState = 'gameover';
              setGameState('gameover');
              playChime('alarm');
            }
          } else if (tab.group.position.z > 14) {
            // Passed screen
            scene.remove(tab.group);
            distractions.splice(i, 1);
          }
        }

        // Update Dopamine Gems collection
        for (let i = gems.length - 1; i >= 0; i--) {
          const g = gems[i];
          g.mesh.rotation.y += g.rotSpeed * dt;
          const dist = g.mesh.position.distanceTo(playerGroup.position);
          if (dist < 1.8) {
            // Collected!
            playChime('step');
            scene.remove(g.mesh);
            gems.splice(i, 1);

            stateRef.current.dopamineShield = Math.min(100, stateRef.current.dopamineShield + 15);
            stateRef.current.score += 50;
            setDopamineShield(stateRef.current.dopamineShield);
            setScore(stateRef.current.score);
          }
        }

        // Camera follow with Decaying Shake
        camera.position.x = THREE.MathUtils.damp(camera.position.x, playerGroup.position.x * 0.4, 5, dt);
        camera.position.z = 18;
        camera.position.y = 14;

        if (stateRef.current.cameraShake > 0) {
          camera.position.x += (Math.random() - 0.5) * stateRef.current.cameraShake;
          camera.position.y += (Math.random() - 0.5) * stateRef.current.cameraShake;
          stateRef.current.cameraShake = Math.max(0, stateRef.current.cameraShake - dt * 1.5);
        }
        camera.lookAt(playerGroup.position.x * 0.3, 0, -4);
      }

      // Update Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.mesh.position.addScaledVector(p.velocity, dt);
        p.life -= dt;
        const scale = Math.max(0.01, p.life / p.maxLife);
        p.mesh.scale.set(scale, scale, scale);

        if (p.life <= 0) {
          scene.remove(p.mesh);
          particles.splice(i, 1);
        }
      }

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(gameTick);
    };

    frameId = requestAnimationFrame(gameTick);

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  const restartGame = () => {
    stateRef.current.score = 0;
    stateRef.current.dopamineShield = 100;
    stateRef.current.tabsCleared = 0;
    stateRef.current.comboStreak = 1;
    stateRef.current.gameState = 'playing';

    setScore(0);
    setDopamineShield(100);
    setTabsCleared(0);
    setComboStreak(1);
    setGameState('playing');
    playChime('success');
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950 overflow-hidden flex flex-col font-sans select-none">
      {/* 3D WebGL Canvas Container */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-crosshair" />

      {/* World-Matched, Low-Occlusion UI Overlays (Pointer-events: none on wrapper) */}
      <div className="absolute inset-0 pointer-events-none p-4 sm:p-6 flex flex-col justify-between z-10">
        {/* Perimeter Status Clusters */}
        <div className="flex items-start justify-between gap-4">
          {/* Top Left: Score & Dopamine Shield */}
          <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-3 px-4 shadow-xl flex items-center gap-4 text-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] text-stone-400 font-bold block uppercase tracking-wider">
                نقاط التركيز
              </span>
              <span className="text-lg font-mono font-black text-amber-400 tabular-nums">{score}</span>
            </div>

            <div className="h-8 w-px bg-stone-800" />

            <div className="space-y-1">
              <div className="flex items-center justify-between gap-3 text-[10px] font-bold">
                <span className="text-emerald-400 flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  درع الدوبامين
                </span>
                <span className="text-stone-300 font-mono tabular-nums">{dopamineShield}%</span>
              </div>
              <div className="w-24 h-1.5 bg-stone-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-200"
                  style={{ width: `${dopamineShield}%` }}
                />
              </div>
            </div>

            <div className="h-8 w-px bg-stone-800" />

            <div className="space-y-0.5">
              <span className="text-[10px] text-stone-400 font-bold block uppercase tracking-wider">
                تبويبات مغلقة
              </span>
              <span className="text-lg font-mono font-black text-stone-100 tabular-nums">
                {tabsCleared} <span className="text-xs text-stone-500 font-normal">/ 15</span>
              </span>
            </div>

            {comboStreak > 1 && (
              <div className="bg-amber-500/20 text-amber-400 px-2 py-1 rounded-lg font-mono font-bold text-xs flex items-center gap-1 border border-amber-500/40">
                <Flame className="w-3.5 h-3.5" />
                <span>x{comboStreak}</span>
              </div>
            )}
          </div>

          {/* Top Right: Sound & Exit controls (Pointer events enabled for buttons) */}
          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-2.5 rounded-xl bg-stone-900/90 hover:bg-stone-800 border border-stone-800 text-stone-300 transition-colors shadow-lg cursor-pointer"
              title={isMuted ? 'تشغيل الصوت' : 'كتم الصوت'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>

            <button
              onClick={onExitGame}
              className="p-2.5 rounded-xl bg-stone-900/90 hover:bg-stone-800 border border-stone-800 text-stone-300 transition-colors shadow-lg cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">العودة للتركيز</span>
            </button>
          </div>
        </div>

        {/* Flat control-hint line along bottom */}
        <div className="text-center text-[11px] text-stone-400 font-mono tracking-wider">
          WASD / الأسهم للحركة • Space / المسافة للإطلاق بالليزر • Esc إيقاف مؤقت
        </div>
      </div>

      {/* TITLE SCREEN MODAL */}
      {gameState === 'title' && (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="max-w-md w-full bg-stone-900 border border-stone-800 rounded-3xl p-8 text-center shadow-2xl space-y-6">
            {/* Bespoke inline SVG Title Lockup */}
            <div className="flex justify-center">
              <svg width="240" height="60" viewBox="0 0 240 60" fill="none">
                <rect x="5" y="5" width="230" height="50" rx="12" fill="#1c1917" stroke="#f59e0b" strokeWidth="2" />
                <path d="M25 30 L45 20 L45 40 Z" fill="#f59e0b" />
                <text x="130" y="36" fill="#fafaf9" fontSize="16" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
                  كاسر التشتت 3D
                </text>
              </svg>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-extrabold text-stone-100">TAB BUSTER 3D</h2>
              <p className="text-xs text-stone-400 leading-relaxed">
                لعبة مصممة لإعادة شحن الدوبامين لمرضى الـ ADHD! انطلق بطائرتك الفضائية واكسر التبويبات والمشتتات المتراكمة التي تسرق تركيزك واستعد صفاء ذهنك.
              </p>
            </div>

            <button
              onClick={() => {
                stateRef.current.gameState = 'playing';
                setGameState('playing');
                playChime('success');
              }}
              className="w-full py-3.5 px-6 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-base flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>ابدأ التحدي (Space / Enter)</span>
            </button>
          </div>
        </div>
      )}

      {/* PAUSE MODAL */}
      {gameState === 'paused' && (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
          <div className="max-w-xs w-full bg-stone-900 border border-stone-800 rounded-3xl p-6 text-center space-y-4">
            <h3 className="text-base font-extrabold text-stone-100">اللعبة متوقفة مؤقتاً</h3>
            <p className="text-xs text-stone-400">تنفس بهدوء واستعد للانطلاق من جديد.</p>
            <div className="space-y-2">
              <button
                onClick={() => {
                  stateRef.current.gameState = 'playing';
                  setGameState('playing');
                }}
                className="w-full py-2.5 rounded-xl bg-amber-500 text-white font-bold text-xs"
              >
                متابعة اللعب (Esc)
              </button>
              <button
                onClick={restartGame}
                className="w-full py-2.5 rounded-xl bg-stone-800 text-stone-300 font-bold text-xs hover:bg-stone-700"
              >
                إعادة المحاولة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VICTORY MODAL */}
      {gameState === 'victory' && (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-xs animate-in zoom-in-95">
          <div className="max-w-sm w-full bg-stone-900 border-2 border-emerald-500 rounded-3xl p-8 text-center space-y-5 shadow-2xl">
            <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
              <Trophy className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-extrabold text-emerald-400">عاش يا بطل! انتصار التركيز!</h3>
              <p className="text-xs text-stone-300">
                أغلقت 15 تبويباً ومشتتاً متراكماً بنجاح وحققت {score} نقطة. عقلك جاهز الآن للعودة لإنهاء كودك الحقيقي!
              </p>
            </div>
            <div className="space-y-2">
              <button
                onClick={onExitGame}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md"
              >
                العودة للمهمة البرمجية الآن 🚀
              </button>
              <button
                onClick={restartGame}
                className="w-full py-2.5 rounded-xl bg-stone-800 text-stone-300 font-bold text-xs"
              >
                جولة إضافية
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GAME OVER MODAL */}
      {gameState === 'gameover' && (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-xs animate-in zoom-in-95">
          <div className="max-w-sm w-full bg-stone-900 border border-red-500/50 rounded-3xl p-8 text-center space-y-5 shadow-2xl">
            <div className="w-14 h-14 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto">
              <X className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-extrabold text-stone-100">استنفد درع الدوبامين!</h3>
              <p className="text-xs text-stone-400">
                لا بأس، الـ ADHD يواجه الكثير من المشتتات كل يوم. خذ نفساً عميقاً وجرب مجدداً!
              </p>
            </div>
            <button
              onClick={restartGame}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>إعادة المحاولة فوراً</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
