import * as THREE from "three";
import { MindARThree } from "mindar-face-three";

const $ = (id) => document.getElementById(id);

let mindarThree = null;
let faceMeshAR = null;
let faceMeshDetector = null;
let gestureLoopStarted = false;
let processingFace = false;
let lastFaceProcess = 0;
let audioCtx = null;

const gestureState = {
  mouth: false,
  blink: false,
  brow: false,
  tracking: false
};

function ensureAudio() {
  if (!audioCtx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    audioCtx = new AudioCtx();
  }

  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }

  return audioCtx;
}

function tone(freq, duration = 0.08, type = "sine", volume = 0.03, endFreq = null) {
  const ctx = ensureAudio();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);

  if (endFreq) {
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(1, endFreq),
      ctx.currentTime + duration
    );
  }

  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + duration);
}

function playMouthSound() {
  tone(170, 0.13, "square", 0.04, 105);
  setTimeout(() => tone(95, 0.08, "triangle", 0.02), 60);
}

function playBlinkSound() {
  tone(920, 0.055, "sine", 0.024, 1240);
}

function playBrowSound() {
  tone(390, 0.12, "triangle", 0.03, 760);
}

function dist2D(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

function buildMaskTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;

  const ctx = canvas.getContext("2d");

  // Base roja oscura semitransparente: cubre todo el FaceMesh.
  const base = ctx.createRadialGradient(512, 470, 120, 512, 520, 560);
  base.addColorStop(0, "rgba(112,20,18,0.48)");
  base.addColorStop(0.62, "rgba(58,8,10,0.62)");
  base.addColorStop(1, "rgba(12,8,8,0.78)");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 1024, 1024);

  // Frente / placas superiores.
  ctx.fillStyle = "rgba(12,12,12,0.78)";
  ctx.beginPath();
  ctx.moveTo(205, 250);
  ctx.lineTo(470, 335);
  ctx.lineTo(405, 405);
  ctx.lineTo(170, 335);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(819, 250);
  ctx.lineTo(554, 335);
  ctx.lineTo(619, 405);
  ctx.lineTo(854, 335);
  ctx.closePath();
  ctx.fill();

  // Marco de ojos, dejando visible la cámara debajo.
  ctx.strokeStyle = "rgba(189,43,34,0.92)";
  ctx.lineWidth = 34;
  ctx.beginPath();
  ctx.ellipse(350, 445, 115, 70, -0.12, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(674, 445, 115, 70, 0.12, 0, Math.PI * 2);
  ctx.stroke();

  // Puente central.
  ctx.fillStyle = "rgba(24,24,24,0.82)";
  ctx.beginPath();
  ctx.moveTo(512, 430);
  ctx.lineTo(570, 545);
  ctx.lineTo(512, 605);
  ctx.lineTo(454, 545);
  ctx.closePath();
  ctx.fill();

  // Pómulos.
  ctx.fillStyle = "rgba(47,13,14,0.88)";
  ctx.beginPath();
  ctx.moveTo(188, 520);
  ctx.lineTo(435, 560);
  ctx.lineTo(385, 745);
  ctx.lineTo(165, 690);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(836, 520);
  ctx.lineTo(589, 560);
  ctx.lineTo(639, 745);
  ctx.lineTo(859, 690);
  ctx.closePath();
  ctx.fill();

  // Mandíbula.
  ctx.fillStyle = "rgba(15,15,15,0.88)";
  ctx.beginPath();
  ctx.moveTo(305, 720);
  ctx.lineTo(719, 720);
  ctx.lineTo(660, 875);
  ctx.lineTo(512, 930);
  ctx.lineTo(364, 875);
  ctx.closePath();
  ctx.fill();

  // Detalles dorados.
  ctx.strokeStyle = "rgba(205,166,88,0.96)";
  ctx.lineWidth = 18;

  ctx.beginPath();
  ctx.moveTo(200, 520);
  ctx.lineTo(175, 690);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(824, 520);
  ctx.lineTo(849, 690);
  ctx.stroke();

  // Emblema central.
  ctx.strokeStyle = "rgba(205,166,88,0.98)";
  ctx.lineWidth = 22;
  ctx.beginPath();
  ctx.arc(512, 270, 72, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "rgba(205,166,88,0.95)";
  ctx.beginPath();
  ctx.moveTo(512, 155);
  ctx.lineTo(450, 270);
  ctx.lineTo(574, 270);
  ctx.closePath();
  ctx.fill();

  // Líneas de "circuito" discretas.
  ctx.strokeStyle = "rgba(205,166,88,0.48)";
  ctx.lineWidth = 8;

  [
    [260, 325, 330, 365],
    [764, 325, 694, 365],
    [255, 780, 350, 820],
    [769, 780, 674, 820]
  ].forEach(([x1, y1, x2, y2]) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function setTracking(active) {
  if (gestureState.tracking === active) return;
  gestureState.tracking = active;

  document.body.classList.toggle("tracking", active);
  $("tracking-state").textContent = active ? "Rostro detectado" : "Buscando rostro…";
}

function animateMouth(active) {
  if (gestureState.mouth === active) return;
  gestureState.mouth = active;

  if (active) {
    playMouthSound();
    $("mouth-state").textContent = "Boca abierta";
  } else {
    $("mouth-state").textContent = "Boca";
  }
}

function animateBlink(active) {
  if (gestureState.blink === active) return;
  gestureState.blink = active;

  if (active) {
    playBlinkSound();
    $("blink-state").textContent = "Parpadeo";
  } else {
    $("blink-state").textContent = "Ojos";
  }
}

function animateBrow(active) {
  if (gestureState.brow === active) return;
  gestureState.brow = active;

  if (active) {
    playBrowSound();
    $("brow-state").textContent = "Cejas arriba";
  } else {
    $("brow-state").textContent = "Cejas";
  }
}

function evaluateGestures(landmarks) {
  if (!landmarks || landmarks.length < 468) {
    setTracking(false);
    return;
  }

  setTracking(true);

  const mouthOpen = dist2D(landmarks[13], landmarks[14]);
  const mouthWidth = dist2D(landmarks[78], landmarks[308]);
  const mouthRatio = mouthWidth > 0 ? mouthOpen / mouthWidth : 0;

  const leftEyeOpen = dist2D(landmarks[159], landmarks[145]);
  const leftEyeWidth = dist2D(landmarks[33], landmarks[133]);
  const rightEyeOpen = dist2D(landmarks[386], landmarks[374]);
  const rightEyeWidth = dist2D(landmarks[362], landmarks[263]);

  const leftEyeRatio = leftEyeWidth > 0 ? leftEyeOpen / leftEyeWidth : 1;
  const rightEyeRatio = rightEyeWidth > 0 ? rightEyeOpen / rightEyeWidth : 1;

  const leftBrowGap = dist2D(landmarks[105], landmarks[159]);
  const rightBrowGap = dist2D(landmarks[334], landmarks[386]);

  const leftBrowRatio = leftEyeWidth > 0 ? leftBrowGap / leftEyeWidth : 0;
  const rightBrowRatio = rightEyeWidth > 0 ? rightBrowGap / rightEyeWidth : 0;
  const browRatio = (leftBrowRatio + rightBrowRatio) / 2;

  animateMouth(mouthRatio > 0.18);
  animateBlink(leftEyeRatio < 0.17 && rightEyeRatio < 0.17);
  animateBrow(browRatio > 0.72);
}

function initGestureDetection() {
  if (!window.FaceMesh || faceMeshDetector) return;

  faceMeshDetector = new FaceMesh({
    locateFile: (file) =>
      `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
  });

  faceMeshDetector.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.55,
    minTrackingConfidence: 0.55
  });

  faceMeshDetector.onResults((results) => {
    evaluateGestures(results.multiFaceLandmarks?.[0]);
  });
}

function startGestureLoop() {
  if (gestureLoopStarted) return;
  gestureLoopStarted = true;

  initGestureDetection();

  const tick = async (time) => {
    const video = document.querySelector("video");

    if (
      faceMeshDetector &&
      video &&
      video.readyState >= 2 &&
      !processingFace &&
      time - lastFaceProcess > 95
    ) {
      processingFace = true;
      lastFaceProcess = time;

      try {
        await faceMeshDetector.send({ image: video });
      } catch (err) {
        console.warn("No se pudo procesar gesto facial:", err);
      } finally {
        processingFace = false;
      }
    }

    requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
}

async function startAR() {
  if (mindarThree) return;

  ensureAudio();

  $("intro").classList.add("hidden");
  $("ar-shell").classList.remove("hidden");

  mindarThree = new MindARThree({
    container: $("scene-root")
  });

  const { renderer, scene, camera } = mindarThree;

  scene.add(new THREE.HemisphereLight(0xffffff, 0x3a2020, 1.35));

  const key = new THREE.DirectionalLight(0xffffff, 1.0);
  key.position.set(0.5, 1, 1.5);
  scene.add(key);

  // FaceMesh real: esta geometría se deforma con toda la cara.
  faceMeshAR = mindarThree.addFaceMesh();

  faceMeshAR.material = new THREE.MeshStandardMaterial({
    map: buildMaskTexture(),
    transparent: true,
    opacity: 0.88,
    roughness: 0.42,
    metalness: 0.3,
    side: THREE.DoubleSide,
    emissive: new THREE.Color(0x170606),
    emissiveIntensity: 0.18,
    depthWrite: false
  });

  scene.add(faceMeshAR);

  // Detalle ligero en la frente, también pegado a la cara.
  const foreheadAnchor = mindarThree.addAnchor(10);
  const crestGeometry = new THREE.RingGeometry(0.045, 0.062, 32);
  const crestMaterial = new THREE.MeshStandardMaterial({
    color: 0xc8a35b,
    metalness: 0.9,
    roughness: 0.18,
    emissive: 0x3a2608,
    emissiveIntensity: 0.35,
    side: THREE.DoubleSide
  });

  const crest = new THREE.Mesh(crestGeometry, crestMaterial);
  crest.position.set(0, 0.15, 0.12);
  foreheadAnchor.group.add(crest);

  await mindarThree.start();

  renderer.setAnimationLoop((time) => {
    if (faceMeshAR) {
      const mat = faceMeshAR.material;

      if (gestureState.mouth) {
        mat.emissive.setHex(0x381006);
        mat.emissiveIntensity = 0.58;
      } else if (gestureState.blink) {
        mat.emissive.setHex(0x5a0505);
        mat.emissiveIntensity = 0.85;
      } else if (gestureState.brow) {
        mat.emissive.setHex(0x3a2608);
        mat.emissiveIntensity = 0.7;
      } else {
        mat.emissive.setHex(0x170606);
        mat.emissiveIntensity = 0.18;
      }
    }

    crest.rotation.z += 0.006;

    if (gestureState.brow) {
      crest.scale.lerp(new THREE.Vector3(1.28, 1.28, 1.28), 0.18);
    } else {
      crest.scale.lerp(new THREE.Vector3(1, 1, 1), 0.18);
    }

    renderer.render(scene, camera);
  });

  startGestureLoop();
}

$("start-camera").addEventListener("click", startAR);
