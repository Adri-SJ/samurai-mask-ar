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

  const dist2D = (a, b) => {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.hypot(dx, dy);
  };

  function animateMouth(active) {
    if (gestureState.mouth === active) return;
    gestureState.mouth = active;

    const jaw = $("jaw");
    const fangLeft = $("fang-left");
    const fangRight = $("fang-right");

    if (jaw) {
      jaw.setAttribute("animation__jaw", active
        ? "property: position; to: 0 -.39 .05; dur: 150; easing: easeOutQuad"
        : "property: position; to: 0 -.30 .07; dur: 180; easing: easeOutQuad");
      jaw.setAttribute("animation__tilt", active
        ? "property: rotation; to: 10 0 0; dur: 150; easing: easeOutQuad"
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

    const crest = $("crest");
    const crestGlow = $("crest-glow");

    if (crest) {
      crest.setAttribute("animation__rise", active
        ? "property: position; to: 0 .47 .02; dur: 180; easing: easeOutBack"
        : "property: position; to: 0 .38 .02; dur: 220; easing: easeOutQuad");
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

          <a-entity id="crest" position="0 .38 .02">
            <a-circle
              id="crest-glow"
              radius=".105"
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
            position="-.22 .30 .00"
            rotation="0 0 -16"
            width=".34"
            height=".105"
            depth=".025"
            color="#171717"
            material="metalness:.8; roughness:.25">
          </a-box>

          <a-box
            position=".22 .30 .00"
            rotation="0 0 16"
            width=".34"
            height=".105"
            depth=".025"
            color="#171717"
            material="metalness:.8; roughness:.25">
          </a-box>

          <a-ring
            id="eye-left-frame"
            position="-.205 .13 .035"
            rotation="0 0 -7"
            radius-inner=".083"
            radius-outer=".11"
            scale="1.35 .72 1"
            color="#711d1a"
            material="emissive:#b22a23; emissiveIntensity:.45; metalness:.75; roughness:.22">
          </a-ring>

          <a-ring
            id="eye-right-frame"
            position=".205 .13 .035"
            rotation="0 0 7"
            radius-inner=".083"
            radius-outer=".11"
            scale="1.35 .72 1"
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
            position="-.285 -.075 .035"
            rotation="0 0 -18"
            width=".31"
            height=".23"
            depth=".035"
            color="#321313"
            material="metalness:.76; roughness:.28">
          </a-box>

          <a-box
            position=".285 -.075 .035"
            rotation="0 0 18"
            width=".31"
            height=".23"
            depth=".035"
            color="#321313"
            material="metalness:.76; roughness:.28">
          </a-box>

          <a-box
            position="-.43 -.04 .055"
            rotation="0 0 -25"
            width=".035"
            height=".26"
            depth=".018"
            color="#c8a35b"
            material="metalness:.9; roughness:.17">
          </a-box>

          <a-box
            position=".43 -.04 .055"
            rotation="0 0 25"
            width=".035"
            height=".26"
            depth=".018"
            color="#c8a35b"
            material="metalness:.9; roughness:.17">
          </a-box>

          <a-entity id="jaw" position="0 -.30 .07">
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
              position="-.17 -.095 .035"
              rotation="180 0 0"
              radius-bottom=".025"
              radius-top="0"
              height=".105"
              color="#d7c8a8">
            </a-cone>

            <a-cone
              id="fang-right"
              position=".17 -.095 .035"
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
    $("intro").classList.add("hidden");
    $("ar-shell").classList.remove("hidden");
    buildScene();
  }

  $("start-camera").addEventListener("click", start);
})();
