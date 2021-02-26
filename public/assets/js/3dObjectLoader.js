import {
	Vector2,
	Vector3,
	Color,
	Raycaster,
	WebGLRenderer,
	PerspectiveCamera,
	Scene,
	PlaneBufferGeometry,
	MeshBasicMaterial,
	Mesh,
	AmbientLight,
	PointLight,
	DirectionalLight,
	ReinhardToneMapping,
	sRGBEncoding,
	LoadingManager,
	Object3D
} from "https://cdn.skypack.dev/three@0.125.2";
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.125.2/examples/jsm/loaders/GLTFLoader";
import gsap from "https://cdn.skypack.dev/gsap@3.6.0";

import { OrbitControls } from "https://cdn.skypack.dev/three@0.125.2/examples/jsm/controls/OrbitControls.js";

// ******** CONSTANTS ********
const CAMERA_Z = 12;
const INTERSECTION_PLANE_Z = 1.8;
const INTERSECTION_PLANE_SIZE = CAMERA_Z * 2;
const BACKGROUND_COLOR = "#efefef";
const CANVAS_HOLDER_ID = "canvas-holder"

// *************************

// ******** UTILS **********
const loadGLTF = (url) => {
	return new Promise((resolve, reject) => {
		let GLTF;
		const manager = new LoadingManager();
		const loader = new GLTFLoader(manager);

		loader.load(url, (gltf) => (GLTF = gltf));
		manager.onLoad = () => resolve(GLTF);
		manager.onError = reject;
	});
};

// *************************

// ******** CLASS **********
// class Model3D extends Object3D {
// 	constructor(options = {}) {
// 		super(options);
// 		this.modelItem = options.modelItem || null;
// 		this.location = options.position || new Vector3(0, 0, 0);
// 		this.offsetLocation = options.offsetLocation || new Vector3(0, 0, 0);
// 		this.model = new Object3D();
// 		this.init();
// 	}

// 	init() {
// 		this.model.add(this.modelItem);
// 	}

// 	updatePosition() {
// 		this.model.position.set(
// 			this.location.x + this.offsetLocation.x,
// 			this.location.y + this.offsetLocation.y,
// 			this.location.z + this.offsetLocation.z
// 		);
// 	}
// }

class Loader {
	constructor() {
		this.canvasHolder = document.getElementById(CANVAS_HOLDER_ID);
		this.width = this.canvasHolder.clientWidth;
		this.height = this.width * 0.8;
		this.raycaster = new Raycaster();
		this.mouse = new Vector2();
		this.lerpedMouse = new Vector2();
		this.mouse3d = new Vector3();
		this.animationComplete = false;
		this.mouseLerpAmount = 0.175;
	}

	init() {
		this.createScene();
		this.createRenderer();
		this.createCamera();
		this.addIntersectionPlane();
		this.addLights();
		this.render();
		this.initEvents();

		loadGLTF(Model3D)
			.then((gltf) => {
				const model = gltf.scene.children[0];
				model.scale.setScalar(1);
				model.traverse((o) => {
					if (o.isMesh) {
						o.castShadow = true;
						o.recieveShadow = true;
						if (o.material) {
						}
					}
				});
				return model;
			})
			.then((model) => {
				this.eyeModel = model;
				this.scene.add(this.eyeModel);
				this.initAnimation();
			})
			.catch((url) => console.error(`Error loading from ${url}`));
	}

	createScene() {
		this.scene = new Scene();
		this.scene.background = new Color(BACKGROUND_COLOR);
	}

	createRenderer() {
		this.renderer = new WebGLRenderer({ antialias: true });
		this.renderer.setPixelRatio(window.devicePixelRatio);
		this.renderer.setSize(this.width, this.height);
		this.renderer.physicallyCorrectLights = true;
		this.renderer.outputEncoding = sRGBEncoding;
		this.renderer.toneMapping = ReinhardToneMapping;
		this.renderer.toneMappingExposure = 2;
		this.renderer.shadowMap.enabled = true;

		this.canvasHolder.appendChild(this.renderer.domElement);
	}

	createCamera() {
		this.camera = new PerspectiveCamera(50, this.width / this.height, 0.1, 100);
		this.camera.position.set(0, 0, CAMERA_Z);
		this.camera.lookAt(new Vector3());
		this.controls = new OrbitControls(this.camera, this.renderer.domElement);
		this.controls.update();
		this.scene.add(this.camera);
	}

	addIntersectionPlane() {
		const geometry = new PlaneBufferGeometry(
			INTERSECTION_PLANE_SIZE,
			INTERSECTION_PLANE_SIZE
		);
		const material = new MeshBasicMaterial({ visible: false, wireframe: true });
		this.intersectionPlane = new Mesh(geometry, material);
		this.intersectionPlane.position.z = INTERSECTION_PLANE_Z;
		this.scene.add(this.intersectionPlane);
	}

	addLights() {
		this.scene.add(new AmbientLight(BACKGROUND_COLOR, 1.5));

		let l1 = new DirectionalLight(0xffffff, 4.25);
		l1.position.set(2, 15, 5);
		this.scene.add(l1);

		let l2 = new DirectionalLight(0xffffff, 4.15);
		l2.position.set(-5, -2, 10);
		this.scene.add(l2);

		this.pointLight = new PointLight(0xffffff, 4);
		this.pointLight.castShadow = true;
		this.pointLight.shadow.bias = -0.0001;
		this.pointLight.shadow.mapSize.setScalar(1024);
		this.scene.add(this.pointLight);
	}

	initEvents() {
		const onResize = () => {
			this.width = window.innerWidth;
			this.height = window.innerHeight;

			this.camera.aspect = this.width / this.height;
			this.camera.updateProjectionMatrix();

			this.renderer.setPixelRatio(window.devicePixelRatio);
			this.renderer.setSize(this.width, this.height);
		};

		window.addEventListener("resize", onResize, { passive: true });
	}

	initAnimation() {
		const tl = gsap.timeline({
			delay: 0.15,
			defaults: {
				duration: 0.8,
				ease: "elastic.out(1, 1)"
			},
			onComplete: () => (this.animationComplete = true)
		});
		tl.addLabel("start", 0);
	}

	updateLerpedMouse() {
		this.lerpedMouse.lerp(this.mouse, this.mouseLerpAmount);
	}

	render() {
		this.updateLerpedMouse();

		this.renderer.render(this.scene, this.camera);

		this.raf = requestAnimationFrame(this.render.bind(this));
	}
}

// *************************

const app = new Loader();
app.init();