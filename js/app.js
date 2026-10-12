(() => {
  const $ = (id) => document.getElementById(id);
  let sceneBuilt = false;

  AFRAME.registerComponent("pulse-material", {
    schema: {
      min: { type: "number", default: 0.35 },
      max: { type: "number", default: 1.3 },
      speed: { type: "number", default: 0.002 }
    },
    tick(time) {
      const mesh = this.el.getObject3D("mesh");
      if (!mesh) return;
      const v = this.data.min + (Math.sin(time * this.data.speed) + 1) * 0.5 * (this.data.max - this.data.min);
      mesh.traverse((node) => {
        if (node.material && "emissiveIntensity" in node.material) {
          node.material.emissiveIntensity = v;
        }
      });
    }
  });

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

        <a-light type="ambient" intensity="1.9"></a-light>
        <a-light type="directional" position="1 2 2" intensity="1.5"></a-light>
        <a-light type="directional" position="-1 1 1" intensity=".8"></a-light>

        <!-- Máscara completa construida con geometría ligera -->
        <a-entity id="samurai-mask" mindar-face-target="anchorIndex: 1" position="0 -.04 .16" scale="1.08 1.08 1.08">

          <!-- Casco principal -->
          <a-sphere
            id="helmet-shell"
            position="0 .58 -.18"
            scale=".72 .42 .42"
            theta-start="0"
            theta-length="95"
            color="#161616"
            metalness=".8"
            roughness=".28">
          </a-sphere>

          <!-- Banda frontal -->
          <a-box
            position="0 .32 .05"
            width="1.03"
            height=".12"
            depth=".09"
            color="#7f1d1d"
            metalness=".65"
            roughness=".3">
          </a-box>

          <!-- Placas laterales -->
          <a-box
            position="-.58 .12 .02"
            rotation="0 0 12"
            width=".23"
            height=".72"
            depth=".12"
            color="#5b1717"
            metalness=".65"
            roughness=".32">
          </a-box>
          <a-box
            position=".58 .12 .02"
            rotation="0 0 -12"
            width=".23"
            height=".72"
            depth=".12"
            color="#5b1717"
            metalness=".65"
            roughness=".32">
          </a-box>

          <!-- Maedate / cuernos -->
          <a-cone
            id="horn-left"
            position="-.28 .88 .02"
            rotation="0 0 28"
            radius-bottom=".055"
            radius-top=".018"
            height=".72"
            color="#b58a42"
            metalness=".9"
            roughness=".18"
            animation="property: rotation; from: 0 0 24; to: 0 0 32; dir: alternate; dur: 1300; loop: true; easing: easeInOutSine">
          </a-cone>

          <a-cone
            id="horn-right"
            position=".28 .88 .02"
            rotation="0 0 -28"
            radius-bottom=".055"
            radius-top=".018"
            height=".72"
            color="#b58a42"
            metalness=".9"
            roughness=".18"
            animation="property: rotation; from: 0 0 -24; to: 0 0 -32; dir: alternate; dur: 1300; loop: true; easing: easeInOutSine">
          </a-cone>

          <!-- Emblema central -->
          <a-torus
            position="0 .62 .10"
            radius=".12"
            radius-tubular=".018"
            color="#c7a55d"
            metalness=".95"
            roughness=".15"
            animation="property: rotation; to: 0 0 360; dur: 6500; loop: true; easing: linear">
          </a-torus>

          <!-- Visor -->
          <a-box
            id="visor"
            position="0 .07 .22"
            width=".92"
            height=".13"
            depth=".055"
            color="#251111"
            material="emissive:#d63a2f; emissiveIntensity:.65; opacity:.9; transparent:true"
            pulse-material="min:.35; max:1.6; speed:.004">
          </a-box>

          <!-- Pómulos -->
          <a-box
            position="-.34 -.15 .18"
            rotation="0 0 -12"
            width=".34"
            height=".33"
            depth=".09"
            color="#4a1515"
            metalness=".7"
            roughness=".3">
          </a-box>
          <a-box
            position=".34 -.15 .18"
            rotation="0 0 12"
            width=".34"
            height=".33"
            depth=".09"
            color="#4a1515"
            metalness=".7"
            roughness=".3">
          </a-box>

          <!-- Nariz / puente -->
          <a-cone
            position="0 -.12 .29"
            rotation="90 0 0"
            radius-bottom=".09"
            radius-top=".025"
            height=".25"
            color="#222"
            metalness=".75"
            roughness=".25">
          </a-cone>

          <!-- Mandíbula animada -->
          <a-entity
            id="jaw"
            position="0 -.46 .18"
            animation="property: rotation; from: 0 0 0; to: 13 0 0; dir: alternate; dur: 900; loop: true; easing: easeInOutSine">
            <a-box
              width=".72"
              height=".24"
              depth=".11"
              color="#4c1414"
              metalness=".72"
              roughness=".3">
            </a-box>

            <a-box
              position="0 .08 .07"
              width=".45"
              height=".055"
              depth=".035"
              color="#d9c9a5">
            </a-box>

            <a-cone
              position="-.23 -.09 .06"
              rotation="180 0 0"
              radius-bottom=".035"
              radius-top="0"
              height=".13"
              color="#d7c8a8">
            </a-cone>
            <a-cone
              position=".23 -.09 .06"
              rotation="180 0 0"
              radius-bottom=".035"
              radius-top="0"
              height=".13"
              color="#d7c8a8">
            </a-cone>
          </a-entity>

          <!-- Brillos de ojos -->
          <a-sphere
            id="eye-left"
            position="-.22 .07 .29"
            radius=".045"
            color="#ff3b30"
            material="emissive:#ff241c; emissiveIntensity:1.4"
            animation="property: scale; from: .8 .8 .8; to: 1.25 1.25 1.25; dir: alternate; dur: 700; loop: true">
          </a-sphere>

          <a-sphere
            id="eye-right"
            position=".22 .07 .29"
            radius=".045"
            color="#ff3b30"
            material="emissive:#ff241c; emissiveIntensity:1.4"
            animation="property: scale; from: .8 .8 .8; to: 1.25 1.25 1.25; dir: alternate; dur: 700; loop: true">
          </a-sphere>
        </a-entity>
      </a-scene>`;

    const scene = root.querySelector("a-scene");

    scene.addEventListener("targetFound", () => {
      document.body.classList.add("tracking");
      $("tracking-state").textContent = "Rostro detectado";
      $("mouth-state").textContent = "Mandíbula activa";
      $("blink-state").textContent = "Visor activo";
      $("brow-state").textContent = "Kabuto activo";
    });

    scene.addEventListener("targetLost", () => {
      document.body.classList.remove("tracking");
      $("tracking-state").textContent = "Buscando rostro…";
      $("mouth-state").textContent = "Boca";
      $("blink-state").textContent = "Ojos";
      $("brow-state").textContent = "Cejas";
    });
  }

  function start() {
    $("intro").classList.add("hidden");
    $("ar-shell").classList.remove("hidden");
    buildScene();
  }

  $("start-camera").addEventListener("click", start);
})();
