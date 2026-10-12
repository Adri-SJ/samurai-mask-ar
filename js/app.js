(() => {
  const $ = (id) => document.getElementById(id);

  let sceneBuilt = false;
  let faceMesh = null;
  let gestureLoopStarted = false;
  let processingFace = false;
  let lastFaceProcess = 0;

  const gestureState = {
    mouth: false,
    blink: false,
    brow: false
  };

  let audioCtx = null;

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

  function tone(freq, duration = 0.08, type = "sine", volume = 0.035, endFreq = null) {
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
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      ctx.currentTime + duration
    );

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  }

  function playMouthSound() {
    tone(190, 0.11, "square", 0.045, 120);
    setTimeout(() => tone(105, 0.08, "triangle", 0.025), 55);
  }

  function playBlinkSound() {
    tone(880, 0.055, "sine", 0.026, 1180);
  }

  function playBrowSound() {
    tone(420, 0.12, "triangle", 0.032, 760);
  }

  const dist2D = (a, b) => {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.hypot(dx, dy);
  };

  function animateMouth(active) {
    if (gestureState.mouth === active) return;
    gestureState.mouth = active;

    if (active) playMouthSound();

    const jaw = $("jaw");
    const fangLeft = $("fang-left");
    const fangRight = $("fang-right");

    if (jaw) {
      jaw.setAttribute("animation__jaw", active
        ? "property: position; to: 0 -.33 .055; dur: 150; easing: easeOutQuad"
        : "property: position; to: 0 -.235 .06; dur: 180; easing: easeOutQuad");
      jaw.setAttribute("animation__tilt", active
        ? "property: rotation; to: 8 0 0; dur: 150; easing: easeOutQuad"
        : "property: rotation; to: 0 0 0; dur: 180; easing: easeOutQuad");
    }

    [fangLeft, fangRight].forEach((fang) => {
      if (!fang) return;
      fang.setAttribute("animation__fang", active
        ? "property: scale; to: 1 1.35 1; dur: 140; easing: easeOutQuad"
        : "property: scale; to: 1 1 1; dur: 160; easing: easeOutQuad");
    });

    $("mouth-state").textContent = active ? "Boca abierta" : "Boca";
  }

  function animateBlink(active) {
    if (gestureState.blink === active) return;
    gestureState.blink = active;

    if (active) playBlinkSound();

    ["eye-left-frame", "eye-right-frame"].forEach((id) => {
      const eye = $(id);
      if (!eye) return;

      eye.setAttribute("animation__flash", active
        ? "property: material.emissiveIntensity; to: 2.6; dur: 80; easing: linear"
        : "property: material.emissiveIntensity; to: .45; dur: 220; easing: easeOutQuad");

      eye.setAttribute("animation__scale", active
        ? "property: scale; to: 1.12 .72 1; dur: 80; easing: easeOutQuad"
        : "property: scale; to: 1 1 1; dur: 180; easing: easeOutQuad");
    });

    $("blink-state").textContent = active ? "Parpadeo" : "Ojos";
  }

  function animateBrow(active) {
    if (gestureState.brow === active) return;
    gestureState.brow = active;

    if (active) playBrowSound();

    const crest = $("crest");
    const crestGlow = $("crest-glow");

    if (crest) {
      crest.setAttribute("animation__rise", active
        ? "property: position; to: 0 .42 .02; dur: 180; easing: easeOutBack"
        : "property: position; to: 0 .35 .02; dur: 220; easing: easeOutQuad");
      crest.setAttribute("animation__scale", active
        ? "property: scale; to: 1.18 1.18 1.18; dur: 180; easing: easeOutBack"
        : "property: scale; to: 1 1 1; dur: 220; easing: easeOutQuad");
    }

    if (crestGlow) {
      crestGlow.setAttribute("animation__glow", active
        ? "property: material.emissiveIntensity; to: 2.2; dur: 160"
        : "property: material.emissiveIntensity; to: .45; dur: 220");
    }

    $("brow-state").textContent = active ? "Cejas arriba" : "Cejas";
  }

  function evaluateGestures(landmarks) {
    if (!landmarks || landmarks.length < 468) return;

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
    if (!window.FaceMesh || faceMesh) return;

    faceMesh = new FaceMesh({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
    });

    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.55,
      minTrackingConfidence: 0.55
    });

    faceMesh.onResults((results) => {
      const landmarks = results.multiFaceLandmarks?.[0];
      if (landmarks) evaluateGestures(landmarks);
    });
  }

  function startGestureLoop() {
    if (gestureLoopStarted) return;
    gestureLoopStarted = true;

    initGestureDetection();

    const tick = async (time) => {
      const video = document.querySelector("video");

      if (
        faceMesh &&
        video &&
        video.readyState >= 2 &&
        !processingFace &&
        time - lastFaceProcess > 85
      ) {
        processingFace = true;
        lastFaceProcess = time;

        try {
          await faceMesh.send({ image: video });
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

  function buildScene() {
    if (sceneBuilt) return;
    sceneBuilt = true;

    const root = $("scene-root");

    root.innerHTML = `
      <a-scene
        mindar-face
        embedded
        color-space="sRGB"
        renderer="colorManagement:true; physicallyCorrectLights:true; antialias:true"
        vr-mode-ui="enabled:false"
        device-orientation-permission-ui="enabled:false">

        <a-camera active="false" position="0 0 0"></a-camera>

        <a-light type="ambient" intensity="1.8"></a-light>
        <a-light type="directional" position="1 2 2" intensity="1.2"></a-light>
        <a-light type="directional" position="-1 1 1" intensity=".65"></a-light>

        <a-entity
          id="mask-root"
          mindar-face-target="anchorIndex: 1"
          position="0 -.06 .20"
          scale="1.13 1.13 1.13">

          <a-entity id="crest" position="0 .35 .02">
            <a-circle
              id="crest-glow"
              radius=".085"
              color="#111111"
              material="emissive:#9d1d18; emissiveIntensity:.45; metalness:.8; roughness:.24">
            </a-circle>

            <a-ring
              radius-inner=".055"
              radius-outer=".078"
              position="0 0 .012"
              color="#c8a35b"
              material="metalness:.9; roughness:.18">
            </a-ring>

            <a-triangle
              vertex-a="0 .13 0"
              vertex-b="-.07 -.015 0"
              vertex-c=".07 -.015 0"
              position="0 .055 .014"
              color="#c8a35b"
              material="metalness:.85; roughness:.2">
            </a-triangle>
          </a-entity>

          <a-box
            position="-.19 .285 .00"
            rotation="0 0 -16"
            width=".34"
            height=".105"
            depth=".025"
            color="#171717"
            material="metalness:.8; roughness:.25">
          </a-box>

          <a-box
            position=".19 .285 .00"
            rotation="0 0 16"
            width=".34"
            height=".105"
            depth=".025"
            color="#171717"
            material="metalness:.8; roughness:.25">
          </a-box>

          <a-ring
            id="eye-left-frame"
            position="-.19 .105 .035"
            rotation="0 0 -7"
            radius-inner=".068"
            radius-outer=".092"
            scale="1.32 .66 1"
            color="#711d1a"
            material="emissive:#b22a23; emissiveIntensity:.45; metalness:.75; roughness:.22">
          </a-ring>

          <a-ring
            id="eye-right-frame"
            position=".19 .105 .035"
            rotation="0 0 7"
            radius-inner=".068"
            radius-outer=".092"
            scale="1.32 .66 1"
            color="#711d1a"
            material="emissive:#b22a23; emissiveIntensity:.45; metalness:.75; roughness:.22">
          </a-ring>

          <a-box
            position="0 .015 .055"
            rotation="0 0 45"
            width=".115"
            height=".115"
            depth=".035"
            color="#151515"
            material="metalness:.8; roughness:.24">
          </a-box>

          <a-box
            position="0 -.015 .074"
            width=".055"
            height=".20"
            depth=".03"
            color="#8a221c"
            material="metalness:.7; roughness:.25">
          </a-box>

          <a-box
            position="-.265 -.035 .035"
            rotation="0 0 -12"
            width=".31"
            height=".23"
            depth=".035"
            color="#321313"
            material="metalness:.76; roughness:.28">
          </a-box>

          <a-box
            position=".265 -.035 .035"
            rotation="0 0 12"
            width=".31"
            height=".23"
            depth=".035"
            color="#321313"
            material="metalness:.76; roughness:.28">
          </a-box>

          <a-box
            position="-.39 -.025 .055"
            rotation="0 0 -25"
            width=".035"
            height=".22"
            depth=".018"
            color="#c8a35b"
            material="metalness:.9; roughness:.17">
          </a-box>

          <a-box
            position=".39 -.025 .055"
            rotation="0 0 25"
            width=".035"
            height=".26"
            depth=".018"
            color="#c8a35b"
            material="metalness:.9; roughness:.17">
          </a-box>

          <a-entity id="jaw" position="0 -.235 .06">
            <a-box
              width=".56"
              height=".16"
              depth=".04"
              color="#171717"
              material="metalness:.8; roughness:.25">
            </a-box>

            <a-box
              position="0 .055 .025"
              width=".34"
              height=".035"
              depth=".018"
              color="#7f1f1b"
              material="emissive:#8f231d; emissiveIntensity:.35; metalness:.6">
            </a-box>

            <a-cone
              id="fang-left"
              position="-.145 -.078 .035"
              rotation="180 0 0"
              radius-bottom=".025"
              radius-top="0"
              height=".105"
              color="#d7c8a8">
            </a-cone>

            <a-cone
              id="fang-right"
              position=".145 -.078 .035"
              rotation="180 0 0"
              radius-bottom=".025"
              radius-top="0"
              height=".105"
              color="#d7c8a8">
            </a-cone>
          </a-entity>
        </a-entity>
      </a-scene>`;

    const scene = root.querySelector("a-scene");

    scene.addEventListener("targetFound", () => {
      document.body.classList.add("tracking");
      $("tracking-state").textContent = "Rostro detectado";
      startGestureLoop();
    });

    scene.addEventListener("targetLost", () => {
      document.body.classList.remove("tracking");
      $("tracking-state").textContent = "Buscando rostro…";
      animateMouth(false);
      animateBlink(false);
      animateBrow(false);
    });
  }

  function start() {
    ensureAudio();
    $("intro").classList.add("hidden");
    $("ar-shell").classList.remove("hidden");
    buildScene();
  }

  $("start-camera").addEventListener("click", start);
})();
