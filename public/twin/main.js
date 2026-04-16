let scene, camera, renderer, controls;
let holographicMaterial;
let modelRoot = null;
const spin = { active: false, speed: 0.01 };
let modelContainer = null;

// Organ focusing system
let raycaster = new THREE.Raycaster();
let pointer = new THREE.Vector2();
let organMeshes = [];
const ORGAN_NAMES = [
    'lung', // Lung part 1
    'heart', // Heart
    'brain', // Brain (most likely candidate)
    'stomach', // Stomach
    'intestinesLarge', // Large intestines
    'intestinesSmall', // Small intestines
    'liver', // Liver
    'kidneys', // Kidneys
    'bladder' // Bladder
];

// Organ information database
const ORGAN_INFO = {
    'heart': {
        name: 'Heart',
        status: 'Normal'
    },
    'lung': {
        name: 'Lungs',
        status: 'Breathing'
    },
    'brain': {
        name: 'Brain',
        status: 'Active'
    },
    'stomach': {
        name: 'Stomach',
        status: 'Digesting'
    },
    'intestinesLarge': {
        name: 'Large Intestine',
        status: 'Processing'
    },
    'intestinesSmall': {
        name: 'Small Intestine',
        status: 'Absorbing'
    },
    'liver': {
        name: 'Liver',
        status: 'Filtering'
    },
    'kidneys': {
        name: 'Kidneys',
        status: 'Purifying'
    },
    'bladder': {
        name: 'Bladder',
        status: 'Storing'
    }
};
let isAnimating = false;
let originalCameraPosition = null;
let originalControlsTarget = null;
let isFocusedOnOrgan = false;

// Hover tooltip system
let hoverTooltip = null;
let hoverTimeout = null;
let currentHoveredOrgan = null;

// Heart pulsing animation
let heartMesh = null;
let heartOriginalScale = null;
const HEARTBEAT_SPEED = 1.2; // beats per second
const HEARTBEAT_SCALE = 0.15; // how much to scale (15% larger)

// Lung breathing animation
let lungMeshes = [];
let lungOriginalScales = [];
const BREATHING_SPEED = 0.25; // breaths per second (15 breaths per minute)
const BREATHING_SCALE = 0.08; // how much to scale (8% expansion)



// Motion flags

const ENABLE_CHART_UPDATES = false;  // keep charts static
const ENABLE_SHADER_TIME = false;    // keep model scanlines static

const HOLOGRAPHIC_SHADER = {
    vertexShader: `
        #include <morphtarget_pars_vertex>
        
        varying vec3 vWorldNormal;
        varying vec3 vViewDirection;
        varying vec2 vUv;
        
        void main() {
            #include <beginnormal_vertex>
            #include <morphnormal_vertex>
            #include <begin_vertex>
            #include <morphtarget_vertex>
            
            vec4 worldPos = modelMatrix * vec4(transformed, 1.0);
            vWorldNormal = normalize(mat3(modelMatrix) * objectNormal);
            vViewDirection = normalize(cameraPosition - worldPos.xyz);
            vUv = uv;
            
            gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
        }
    `,
    fragmentShader: `
        uniform float time;
        uniform float uWeight;
        varying vec3 vWorldNormal;
        varying vec3 vViewDirection;
        varying vec2 vUv;
        
        void main() {
            // تأثير الـ Fresnel: بيخلي الحواف منورة والمنتصف شفاف
            // زودنا القوة لـ 2.5 عشان نحدد الجسم كويس
            float fresnel = pow(1.0 - abs(dot(vWorldNormal, vViewDirection)), 2.5);
            
            // ألوان الجسم الصحي (Cyan / Blue)
            vec3 healthyEdge = vec3(0.0, 0.7, 1.0);  
            vec3 healthyDeep = vec3(0.05, 0.1, 0.4); 
            
            // ألوان الخطر للوزن الزائد (ريد / برتقالي محمر)
            vec3 fatEdge = vec3(1.0, 0.2, 0.15);  
            vec3 fatDeep = vec3(0.4, 0.05, 0.05);

            // حساب التغير بناء على الوزن (أعلى من 0.4 يبدأ لونه يتغير تدريجيا للأحمر)
            float dangerFactor = smoothstep(0.3, 0.8, uWeight);

            vec3 edgeColor = mix(healthyEdge, fatEdge, dangerFactor);
            vec3 deepColor = mix(healthyDeep, fatDeep, dangerFactor);
            
            // دمج الألوان بناءً على مكان الـ UV (من تحت لفوق)
            vec3 baseColor = mix(deepColor, edgeColor, vUv.y);
            
            // حساب الإضاءة النهائية - ضربنا الـ fresnel في 3 عشان اللمعان يبقى حاد
            vec3 finalColor = baseColor + (edgeColor * fresnel * 3.0);
            
            // الشفافية: الحواف معتمة أكتر (0.8) والقلب شفاف (0.15) عشان الأعضاء تبان
            float alpha = (fresnel * 0.7) + 0.15;
            
            gl_FragColor = vec4(finalColor, alpha);
        }
    `
};

function createHolographicMaterial() {
    return new THREE.ShaderMaterial({
        vertexShader: HOLOGRAPHIC_SHADER.vertexShader,
        fragmentShader: HOLOGRAPHIC_SHADER.fragmentShader,
        uniforms: {
            time: { value: 0.0 },
            uWeight: { value: 0.2 }
        },
        transparent: true,
        side: THREE.DoubleSide,     // خليتها DoubleSide عشان لو الكاميرا دخلت جوه الجسم
        blending: THREE.NormalBlending, // غيرناها من Additive لـ Normal عشان يظهر ع الخلفية الفاتحة
        depthWrite: false,
        depthTest: true,
        morphTargets: true
    });
}

function init() {
    scene = new THREE.Scene();
    scene.background = null;

    // Resolve container for model rendering
    modelContainer = document.getElementById('model-container');
    const rect = modelContainer.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));

    camera = new THREE.PerspectiveCamera(
        75,
        width / height,
        0.01,
        1000
    );
    camera.position.set(0, 0, 5);
    camera.zoom = 1.2;
    camera.updateProjectionMatrix();

    // Create renderer
    renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    modelContainer.appendChild(renderer.domElement);
    // Expose a quick setter to tune zoom from console
    window.setZoom = (z = 1) => { camera.zoom = z; camera.updateProjectionMatrix(); };

    // Setup controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    // Disable zooming via mouse wheel and pinch
    controls.enableZoom = false;
    // Prevent touch pinch-to-zoom; keep rotate (one finger) and pan (two fingers)
    controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.PAN };
    // Lock vertical rotation: allow only left/right (horizontal) orbit
    controls.minPolarAngle = Math.PI / 2.5; // 90°
    controls.maxPolarAngle = Math.PI / 2.5; // 90°

    // Setup lighting
    addLights();

    // Load model
    loadModel();

    // Setup resize event
    window.addEventListener('resize', onWindowResize);

    // Create hover tooltip
    createHoverTooltip();

    // Start rendering
    animate();
}

// ================================
// LIGHTING SETUP
// ================================
function addLights() {
    // Strong ambient light for holographic materials
    const ambientLight = new THREE.AmbientLight(0x404040, 1.2);
    scene.add(ambientLight);

    // Main directional light
    const mainLight = new THREE.DirectionalLight(0xffffff, 2.0);
    mainLight.position.set(10, 15, 8);
    mainLight.castShadow = true;
    scene.add(mainLight);

    // Side light
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.8);
    keyLight.position.set(-10, 8, 10);
    scene.add(keyLight);

    // Rim light for glow effect
    const rimLight = new THREE.DirectionalLight(0xaaccff, 1.0);
    rimLight.position.set(0, -5, -10);
    scene.add(rimLight);

    // Colored point lights for holographic effect
    const pointLight1 = new THREE.PointLight(0x00ffff, 1.5, 100);
    pointLight1.position.set(15, 15, 15);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x87ceeb, 1.2, 80);
    pointLight2.position.set(-15, 10, -15);
    scene.add(pointLight2);

    // Hemisphere light
    const hemiLight = new THREE.HemisphereLight(0x000000, 0x404040, 1.0);
    scene.add(hemiLight);
}

// ================================
// MODEL LOADING
// ================================
function loadModel() {
    const loader = new THREE.GLTFLoader();
    const modelPath = './Man-v1.glb';

    loader.load(
        modelPath,

        // onLoad - on success
        function (gltf) {
            const model = gltf.scene;

            // Setup model
            setupModel(model);

            // Add model to scene
            scene.add(model);
            // Expose model for interactive tweaks
            modelRoot = model;
            window.model3D = modelRoot;
            window.moveModel = (dx = 0, dy = 0, dz = 0) => {
                if (!modelRoot) return;
                modelRoot.position.x += dx;
                modelRoot.position.y += dy;
                modelRoot.position.z += dz;
            };
            window.rotateModel = (rx = 0, ry = 0, rz = 0) => {
                if (!modelRoot) return;
                modelRoot.rotation.x += rx;
                modelRoot.rotation.y += ry;
                modelRoot.rotation.z += rz;
            };

            // Weight control API
            window.setWeight = (value) => {
                if (!modelRoot) return;
                const weightValue = Math.max(0, Math.min(1, value));
                modelRoot.traverse(function (child) {
                    // Update shape key
                    if (child.isMesh && child.morphTargetDictionary && child.morphTargetDictionary['fat'] !== undefined) {
                        const targetIndex = child.morphTargetDictionary['fat'];
                        child.morphTargetInfluences[targetIndex] = weightValue;
                    }
                    // Update holographic shader color transition
                    if (child.isMesh && child.material && child.material.uniforms && child.material.uniforms.uWeight) {
                        child.material.uniforms.uWeight.value = weightValue;
                    }
                });
            };

            // Hook up UI slider if present
            const weightSlider = document.getElementById('weight-slider');
            if (weightSlider) {
                weightSlider.addEventListener('input', (e) => {
                    window.setWeight(parseFloat(e.target.value));
                });
            }
            window.spinModel = (on = true, speed = 0.01) => {
                spin.active = !!on;
                spin.speed = speed;
            };

            // Auto-fit camera
            autoCamera(model);

            // Store original camera position for reset
            originalCameraPosition = camera.position.clone();
            originalControlsTarget = controls.target.clone();

            // Setup organ focusing after model is loaded
            setupOrganFocusing();
        },
    );
}

function setupModel(model) {
    holographicMaterial = createHolographicMaterial();

    // Print all Morph Targets in the model
    console.log('🎯 === MORPH TARGETS DETECTION ===');
    model.traverse(function (child) {
        if (child.isMesh && child.morphTargetDictionary) {
            console.log(`📋 Mesh: "${child.name}" has Morph Targets:`);
            const morphTargets = Object.keys(child.morphTargetDictionary);
            morphTargets.forEach((target, index) => {
                console.log(`   ${index + 1}. "${target}"`);
            });
            console.log(`   Total: ${morphTargets.length} morph targets`);
            console.log('---');
        }
    });
    console.log('🎯 === END MORPH TARGETS ===');

    model.traverse(function (child) {
        if (child.isMesh) {
            if (child.name === "Human1") {
                child.material = holographicMaterial.clone();
                child.material.uniforms = {
                    time: { value: 0.0 },
                    uWeight: { value: 0.2 }
                };
                // Put outer body on layer 1 (invisible to raycaster)
                child.layers.set(1);
            } else if (ORGAN_NAMES.includes(child.name)) {
                // Put target organs on layer 0 (visible to raycaster)
                child.layers.set(0);

                // Special handling for heart mesh
                if (child.name === 'heart') {
                    heartMesh = child;
                    heartOriginalScale = child.scale.clone();
                    console.log('💗 Heart mesh found and ready for pulsing!');
                }

                // Special handling for lung meshes
                if (child.name === 'lung') {
                    lungMeshes.push(child);
                    lungOriginalScales.push(child.scale.clone());
                    console.log(`🫁 Lung mesh "${child.name}" found and ready for breathing!`);
                }

                // Log all digestive system organs
                if (child.name === 'stomach') {
                    console.log(`🤢 Stomach mesh "${child.name}" found!`);
                }
                if (child.name === 'intestinesLarge') {
                    console.log(`🦠 Large intestine mesh "${child.name}" found!`);
                }
                if (child.name === 'intestinesSmall') {
                    console.log(`🧬 Small intestine mesh "${child.name}" found!`);
                }
                if (child.name === 'liver') {
                    console.log(`🟤 Liver mesh "${child.name}" found!`);
                }
                if (child.name === 'kidneys') {
                    console.log(`🔴 Kidneys mesh "${child.name}" found!`);
                }
                if (child.name === 'bladder') {
                    console.log(`💧 Bladder mesh "${child.name}" found!`);
                }
            } else {
                // Put all other meshes on layer 1 (invisible to raycaster)
                child.layers.set(1);
            }
            // Keep original materials for internal organs and other parts

            // Disable shadows for all meshes to maintain the holographic effect
            child.castShadow = false;
            child.receiveShadow = false;
        }
    });

    model.scale.setScalar(1);
    model.position.set(0, 0, 0);
    // model.rotation.y = Math.PI - Math.PI / -20;
}

function autoCamera(model) {
    // Auto-fit camera based on model size
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    const maxDimension = Math.max(size.x, size.y, size.z);
    const fov = camera.fov * (Math.PI / 270);
    // Adjust multiplier (0.42) to show the model down to the mid-thighs
    const cameraDistance = Math.abs(maxDimension / Math.sin(fov / 2)) * 0.42;

    // Shift focus higher (0.18) to push the model's head up near the top of the screen
    const targetOffset = size.y * 0.100;

    camera.position.set(center.x, center.y + targetOffset, cameraDistance);
    controls.target.set(center.x, center.y + targetOffset, center.z);
    controls.update();

    // Center composition (clear any previous view offset)
    clearCompositionOffset();
}

// Keep the orbit pivot stable while composing subject to the left
function clearCompositionOffset() {
    if (!camera) return;
    camera.clearViewOffset();
}

function showError(message) {
    document.getElementById('error').innerHTML = message;
    document.getElementById('error').style.display = 'block';
}

function onWindowResize() {
    const rect = modelContainer.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    clearCompositionOffset();
}

// ================================
// ORGAN FOCUSING SYSTEM
// ================================

function setupOrganFocusing() {
    // Configure camera to see both layers (for rendering)
    camera.layers.enable(0); // Organs layer
    camera.layers.enable(1); // Body layer

    // Debug: Print ALL mesh names in the model
    console.log("=== ALL MESHES IN MODEL ===");
    if (modelRoot) {
        modelRoot.traverse(function (child) {
            if (child.isMesh) {
                console.log(`Mesh: "${child.name}" | Type: ${child.type} | Material: ${child.material?.name || 'unnamed'}`);

                // Check for potential brain meshes
                const name = child.name.toLowerCase();
                if (name.includes('brain') || name.includes('head') || name.includes('skull') || name === 'object_5') {
                    console.log(`🧠 POTENTIAL BRAIN: "${child.name}"`);
                }
            }
        });
    }
    console.log("=== END OF MESH LIST ===");

    // Collect organ meshes from the loaded model
    if (modelRoot) {
        organMeshes = [];
        modelRoot.traverse(function (child) {
            if (child.isMesh && ORGAN_NAMES.includes(child.name)) {
                // Make sure organ is on layer 0
                child.layers.set(0);
                organMeshes.push(child);
                console.log(`✅ Found organ: ${child.name} on layer 0`);
            }
        });
        console.log(`📊 Total organs found: ${organMeshes.length} out of ${ORGAN_NAMES.length} expected`);
        console.log(`🎯 Looking for organs: lung1, lung2, heart, brain`);
    }

    // Add event listeners - double click for organs and returning
    modelContainer.addEventListener('dblclick', onDoubleClick, false);
    modelContainer.addEventListener('pointermove', onPointerMove, false);
}

function onPointerMove(event) {
    const rect = modelContainer.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Handle hover detection
    handleOrganHover(event);
}

function onDoubleClick(event) {
    console.log("🖱️🖱️ Double click detected!");

    if (isAnimating) {
        console.log("❌ Animation in progress, ignoring click");
        return;
    }

    const rect = modelContainer.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);

    // Check intersections with all objects
    const allIntersects = raycaster.intersectObjects(scene.children, true);

    if (allIntersects.length > 0) {
        const clickedMesh = allIntersects[0].object;
        console.log(`✅ Double clicked on: "${clickedMesh.name}"`);

        // If it's one of our target organs, focus on it
        if (ORGAN_NAMES.includes(clickedMesh.name)) {
            console.log(`🚀 Focusing on organ: ${clickedMesh.name}`);
            focusOnObject(clickedMesh);
            return;
        }
    }

    // If double click was on empty space or non-organ, return to normal view if we are focused
    if (isFocusedOnOrgan) {
        console.log("🏠 Returning to normal view...");
        returnToNormalView();
    }
}

function focusOnObject(mesh) {
    if (isAnimating) return;

    isAnimating = true;
    isFocusedOnOrgan = true;

    // Hide tooltip immediately when focusing starts
    hideHoverTooltip();
    currentHoveredOrgan = null;
    if (hoverTimeout) {
        clearTimeout(hoverTimeout);
        hoverTimeout = null;
    }

    // Calculate bounding box of the mesh
    const box = new THREE.Box3().setFromObject(mesh);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    // Calculate optimal camera distance
    const maxDimension = Math.max(size.x, size.y, size.z);
    const fov = camera.fov * (Math.PI / 180);
    const distance = Math.abs(maxDimension / Math.sin(fov / 2)) * 1.2;

    // Calculate new camera position (maintain current viewing angle but adjust distance)
    const direction = new THREE.Vector3()
        .subVectors(camera.position, controls.target)
        .normalize();
    const newCameraPosition = new THREE.Vector3()
        .copy(center)
        .add(direction.multiplyScalar(distance));

    // Store current positions for smooth transition
    const currentCameraPos = camera.position.clone();
    const currentTarget = controls.target.clone();

    // Animate camera position and controls target
    new TWEEN.Tween(currentCameraPos)
        .to(newCameraPosition, 1500)
        .easing(TWEEN.Easing.Cubic.InOut)
        .onUpdate(function () {
            camera.position.copy(currentCameraPos);
        })
        .start();

    new TWEEN.Tween(currentTarget)
        .to(center, 1500)
        .easing(TWEEN.Easing.Cubic.InOut)
        .onUpdate(function () {
            controls.target.copy(currentTarget);
            controls.update();
        })
        .onComplete(function () {
            isAnimating = false;
        })
        .start();
}

function returnToNormalView() {
    if (isAnimating || !originalCameraPosition || !originalControlsTarget) return;

    isAnimating = true;
    console.log("🏠 Returning to normal view...");

    // Store current positions for smooth transition
    const currentCameraPos = camera.position.clone();
    const currentTarget = controls.target.clone();

    // Animate back to original camera position
    new TWEEN.Tween(currentCameraPos)
        .to(originalCameraPosition, 1200)
        .easing(TWEEN.Easing.Cubic.InOut)
        .onUpdate(function () {
            camera.position.copy(currentCameraPos);
        })
        .start();

    // Animate back to original controls target
    new TWEEN.Tween(currentTarget)
        .to(originalControlsTarget, 1200)
        .easing(TWEEN.Easing.Cubic.InOut)
        .onUpdate(function () {
            controls.target.copy(currentTarget);
            controls.update();
        })
        .onComplete(function () {
            isAnimating = false;
            isFocusedOnOrgan = false;
            console.log("✅ Returned to normal view");
        })
        .start();
}

window.focusOnOrganByName = function (organName) {
    if (isAnimating || !modelRoot) return;
    console.log("🔎 focusOnOrganByName called for:", organName);
    let targetMesh = null;
    modelRoot.traverse(function (child) {
        if (child.isMesh && child.name === organName) {
            targetMesh = child;
        }
    });
    if (targetMesh) {
        focusOnObject(targetMesh);
    } else {
        console.warn("Could not find organ mesh with name:", organName);
    }
};

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    TWEEN.update(); // Update tweens for smooth camera transitions
    const time = (performance.now() * 0.001);

    // Heart pulsing animation
    if (heartMesh && heartOriginalScale) {
        const heartbeat = Math.sin(time * HEARTBEAT_SPEED * Math.PI * 2) * 0.5 + 0.5; // 0 to 1
        const scaleMultiplier = 1 + (heartbeat * HEARTBEAT_SCALE);
        heartMesh.scale.copy(heartOriginalScale).multiplyScalar(scaleMultiplier);
    }

    // Lung breathing animation
    if (lungMeshes.length > 0) {
        const breathing = Math.sin(time * BREATHING_SPEED * Math.PI * 2) * 0.5 + 0.5; // 0 to 1
        const scaleMultiplier = 1 + (breathing * BREATHING_SCALE);

        lungMeshes.forEach((lungMesh, index) => {
            if (lungOriginalScales[index]) {
                lungMesh.scale.copy(lungOriginalScales[index]).multiplyScalar(scaleMultiplier);
            }
        });
    }

    scene.traverse(function (child) {
        if (child.isMesh && child.material && child.material.uniforms && child.material.uniforms.time) {
            if (ENABLE_SHADER_TIME) child.material.uniforms.time.value = time;
        }
    });

    if (ENABLE_CHART_UPDATES) updateCharts(time);
    renderer.render(scene, camera);
}

window.addEventListener('load', function () {
    init();
    initCharts(); // draw once (charts static)
});

window.addEventListener('error', function (e) {
    showError('🔥An unexpected error occurred: ' + e.message);
});



// ================================
// CHART ENGINE (Minimal Neon)
// ================================
const charts = [];

class ChartEngine {
    constructor(id, opts) {
        this.canvas = document.getElementById(id);
        this.ctx = this.canvas.getContext('2d');
        this.type = opts.type || 'line'; // line | bars | area | scatter
        this.neon = opts.neon || '#00eaff';
        this.alt = opts.alt || '#9d6bff';
        this.data = opts.data || new Array(opts.points || 50).fill(0).map((_, i) => Math.sin(i * 0.15) + Math.random() * 0.2);
        this.range = opts.range || [0, 5];
        this.rangeX = opts.rangeX || null; // for scatter
        this.rangeY = opts.rangeY || null; // for scatter
        this.updateRate = ENABLE_CHART_UPDATES ? (opts.updateRate || 600) : Infinity;
        this.lastUpdate = 0;
        this.lineWidth = 2.2;
        this.initResize();
    }
    initResize() {
        const resize = () => {
            this.canvas.width = this.canvas.clientWidth * window.devicePixelRatio;
            this.canvas.height = this.canvas.clientHeight * window.devicePixelRatio;
            this.draw(0); // redraw static after resize
        };
        resize();
        window.addEventListener('resize', resize);
    }
    step(time) {
        if (ENABLE_CHART_UPDATES && time * 1000 - this.lastUpdate > this.updateRate) {
            this.lastUpdate = time * 1000;
            const nv = (Math.sin(time * 0.8) + 1) * 2.5 + (Math.random() - 0.5) * 1.2;
            this.data.push(nv);
            this.data.shift();
        }
        this.draw(time);
    }
    draw(time) {
        const { ctx, data } = this;
        const w = this.canvas.width;
        const h = this.canvas.height;
        ctx.clearRect(0, 0, w, h);
        // baseline
        ctx.save(); ctx.globalAlpha = 0.18; ctx.strokeStyle = 'rgba(0,255,255,0.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, h - 1); ctx.lineTo(w, h - 1); ctx.stroke(); ctx.restore();
        const scaleY = v => h - (v / (this.range[1] - this.range[0])) * (h * 0.82) - h * 0.08;
        if (this.type === 'line' || this.type === 'area') {
            ctx.save();
            ctx.lineWidth = this.lineWidth * window.devicePixelRatio;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            const grad = ctx.createLinearGradient(0, 0, w, 0);
            grad.addColorStop(0, this.neon); grad.addColorStop(1, this.alt);
            ctx.strokeStyle = grad;
            ctx.shadowColor = this.neon; ctx.shadowBlur = 18;
            ctx.beginPath();
            data.forEach((v, i) => { const x = (i / (data.length - 1)) * w; const y = scaleY(v); if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); });
            ctx.stroke();
            if (this.type === 'area') {
                const fillGrad = ctx.createLinearGradient(0, 0, 0, h);
                fillGrad.addColorStop(0, this.neon + '80');
                fillGrad.addColorStop(1, this.neon + '05');
                ctx.lineTo(w, h - 1); ctx.lineTo(0, h - 1); ctx.closePath();
                ctx.fillStyle = fillGrad; ctx.globalAlpha = 0.35; ctx.fill();
            }
            ctx.restore();
        } else if (this.type === 'bars') {
            ctx.save();
            const barW = w / data.length;
            const grad = ctx.createLinearGradient(0, 0, 0, h);
            grad.addColorStop(0, this.neon);
            grad.addColorStop(1, this.alt);
            data.forEach((v, i) => { const x = i * barW + barW * 0.15; const y = scaleY(v); const height = h - 1 - y; ctx.fillStyle = grad; ctx.globalAlpha = 0.85; ctx.fillRect(x, y, barW * 0.7, height); });
            ctx.restore();
        } else if (this.type === 'scatter') {
            // Determine ranges from data if not provided
            const xs = data.map(p => p.x), ys = data.map(p => p.y);
            const minX = this.rangeX ? this.rangeX[0] : Math.min(...xs);
            const maxX = this.rangeX ? this.rangeX[1] : Math.max(...xs);
            const minY = this.rangeY ? this.rangeY[0] : Math.min(...ys);
            const maxY = this.rangeY ? this.rangeY[1] : Math.max(...ys);
            const padX = (maxX - minX) * 0.06 || 1;
            const padY = (maxY - minY) * 0.06 || 1;
            const scaleSX = v => ((v - (minX - padX)) / ((maxX + padX) - (minX - padX))) * (w * 0.95);
            const scaleSY = v => h - ((v - (minY - padY)) / ((maxY + padY) - (minY - padY))) * (h * 0.88) - h * 0.06;
            // Points
            ctx.save();
            ctx.fillStyle = this.neon;
            data.forEach(p => {
                const x = scaleSX(p.x);
                const y = scaleSY(p.y);
                const g = ctx.createRadialGradient(x, y, 0, x, y, 6 * window.devicePixelRatio);
                g.addColorStop(0, this.neon);
                g.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = g;
                ctx.beginPath(); ctx.arc(x, y, 3 * window.devicePixelRatio, 0, Math.PI * 2); ctx.fill();
            });
            ctx.restore();
            // Trendline (linear regression)
            if (data.length >= 2) {
                const n = data.length;
                const sumX = data.reduce((a, p) => a + p.x, 0);
                const sumY = data.reduce((a, p) => a + p.y, 0);
                const sumXY = data.reduce((a, p) => a + p.x * p.y, 0);
                const sumXX = data.reduce((a, p) => a + p.x * p.x, 0);
                const denom = n * sumXX - sumX * sumX || 1;
                const m = (n * sumXY - sumX * sumY) / denom;
                const b = (sumY - m * sumX) / n;
                const y1 = m * minX + b;
                const y2 = m * maxX + b;
                ctx.save();
                const grad = ctx.createLinearGradient(0, 0, w, 0);
                grad.addColorStop(0, this.neon);
                grad.addColorStop(1, this.alt);
                ctx.strokeStyle = grad; ctx.lineWidth = 2 * window.devicePixelRatio; ctx.globalAlpha = 0.85;
                ctx.beginPath(); ctx.moveTo(scaleSX(minX), scaleSY(y1)); ctx.lineTo(scaleSX(maxX), scaleSY(y2)); ctx.stroke();
                ctx.restore();
            }
        }
        // no pulse in static mode
    }
}

function initCharts() { /* no charts currently in use; all cards are text/KPI-based */ }

function updateCharts(time) { charts.forEach(c => c.step(time)); }

// ================================
// HOVER TOOLTIP SYSTEM
// ================================

function createHoverTooltip() {
    hoverTooltip = document.createElement('div');
    hoverTooltip.id = 'hover-tooltip';
    hoverTooltip.style.cssText = `
        position: fixed;
        background: linear-gradient(135deg, rgba(0, 20, 40, 0.98), rgba(0, 50, 80, 0.98));
        border: 2px solid rgba(0, 255, 255, 0.6);
        border-radius: 12px;
        padding: 16px 20px;
        color: #ffffff;
        font-family: 'Segoe UI', 'Arial', sans-serif;
        font-size: 14px;
        font-weight: 500;
        backdrop-filter: blur(15px);
        box-shadow: 0 8px 32px rgba(0, 255, 255, 0.3),
                   inset 0 1px 0 rgba(255, 255, 255, 0.2);
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
        z-index: 2000;
        pointer-events: none;
        min-width: 180px;
        text-align: center;
        white-space: nowrap;
    `;

    document.body.appendChild(hoverTooltip);
}

function handleOrganHover(event) {
    return; // Disable hover tooltips as requested
    if (isAnimating || isFocusedOnOrgan) return; // Don't show hover during animations or when focused on organ

    const rect = modelContainer.getBoundingClientRect();
    const mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera({ x: mouseX, y: mouseY }, camera);

    // Check intersections only with organs (layer 0)
    const organIntersects = raycaster.intersectObjects(organMeshes, false);

    if (organIntersects.length > 0) {
        const hoveredMesh = organIntersects[0].object;
        const organName = hoveredMesh.name;

        if (ORGAN_NAMES.includes(organName)) {
            if (currentHoveredOrgan !== organName) {
                currentHoveredOrgan = organName;

                // Clear existing timeout
                if (hoverTimeout) {
                    clearTimeout(hoverTimeout);
                }

                // Show tooltip after short delay
                hoverTimeout = setTimeout(() => {
                    showHoverTooltip(organName, event.clientX, event.clientY);
                }, 150); // 150ms delay
            } else {
                // Update tooltip position if same organ
                updateTooltipPosition(event.clientX, event.clientY);
            }
        }
    } else {
        // No organ hovered
        if (currentHoveredOrgan) {
            currentHoveredOrgan = null;
            hideHoverTooltip();

            if (hoverTimeout) {
                clearTimeout(hoverTimeout);
                hoverTimeout = null;
            }
        }
    }
}

function showHoverTooltip(organName, x, y) {
    const info = ORGAN_INFO[organName];
    if (!info || !hoverTooltip) return;

    // Get real-time data
    const time = performance.now() * 0.001;
    let statusText = '';
    let statusColor = '#00ff88';

    switch (organName) {
        case 'heart':
            const bpm = Math.round(72 + Math.sin(time * 0.1) * 8);
            statusText = `${bpm} BPM`;
            statusColor = '#ff6b9d';
            break;
        case 'lung':
            const breaths = Math.round(15 + Math.sin(time * 0.15) * 3);
            statusText = `${breaths} breaths/min`;
            statusColor = '#87ceeb';
            break;
        case 'brain':
            const activity = Math.round(85 + Math.sin(time * 0.2) * 10);
            statusText = `${activity}% oxygen`;
            statusColor = '#9d6bff';
            break;
        case 'stomach':
            let acidLevel = Math.round(45 + Math.sin(time * 0.3) * 5);
            statusText = `${acidLevel}% acid`;
            statusColor = '#88ff88';
            break;
        case 'intestinesLarge':
            let inflammation = Math.round(10 + Math.sin(time * 0.25) * 5);
            statusText = `${inflammation}% inflamed`;
            statusColor = '#44ff88';
            break;
        case 'intestinesSmall':
            let absorption = Math.round(85 + Math.sin(time * 0.35) * 10);
            statusText = `${absorption}% absorption`;
            statusColor = '#66ff88';
            break;
        case 'liver':
            let detoxification = Math.round(90 + Math.sin(time * 0.28) * 8);
            statusText = `${detoxification}% detox`;
            statusColor = '#ffaa44';
            break;
        case 'kidneys':
            let filtration = Math.round(95 + Math.sin(time * 0.32) * 4);
            statusText = `${filtration}% filtration`;
            statusColor = '#ff6666';
            break;
        case 'bladder':
            let capacity = Math.round(25 + Math.sin(time * 0.18) * 20);
            statusText = `${capacity}% full`;
            statusColor = '#44aaff';
            break;
        default:
            statusText = 'Normal';
    }

    let healthStatus = info.status;

    hoverTooltip.innerHTML = `
        <div style="color: #00ffff; font-size: 16px; font-weight: bold; margin-bottom: 6px; text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);">${info.name}</div>
        <div style="color: ${statusColor}; font-size: 13px; font-weight: 500;">${statusText}</div>
        <div style="color: #88ff88; font-size: 11px; margin-top: 2px;">${healthStatus}</div>
        <div style="width: 100%; height: 2px; background: linear-gradient(90deg, transparent, #00ffff, transparent); margin-top: 8px; border-radius: 1px;"></div>
    `;

    // Position tooltip
    updateTooltipPosition(x, y);

    // Show tooltip with scale effect
    hoverTooltip.style.visibility = 'visible';
    hoverTooltip.style.opacity = '1';
    hoverTooltip.style.transform = 'scale(1)';
}

function hideHoverTooltip() {
    if (!hoverTooltip) return;

    hoverTooltip.style.opacity = '0';
    hoverTooltip.style.transform = 'scale(0.8)';

    setTimeout(() => {
        if (hoverTooltip) {
            hoverTooltip.style.visibility = 'hidden';
            hoverTooltip.style.transform = 'scale(1)';
        }
    }, 300);
}

function updateTooltipPosition(x, y) {
    if (!hoverTooltip) return;

    // Offset tooltip to avoid cursor overlap
    const offsetX = 15;
    const offsetY = -15;

    // Prevent tooltip from going off-screen
    const tooltipRect = hoverTooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let finalX = x + offsetX;
    let finalY = y + offsetY;

    // Adjust if going off right edge
    if (finalX + tooltipRect.width > viewportWidth) {
        finalX = x - tooltipRect.width - offsetX;
    }

    // Adjust if going off top edge
    if (finalY < 0) {
        finalY = y - offsetY;
    }

    // Adjust if going off bottom edge
    if (finalY + tooltipRect.height > viewportHeight) {
        finalY = viewportHeight - tooltipRect.height - 10;
    }

    hoverTooltip.style.left = finalX + 'px';
    hoverTooltip.style.top = finalY + 'px';
}



// ================================
// STAT PULSE (Occasional micro variance)
// ================================
function startStatPulse() { /* not used in this mode */ }
