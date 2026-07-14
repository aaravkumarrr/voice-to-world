import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

// SCENE AND CAMERA OBJECT CREATION
export const scene = new THREE.Scene();
export const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);



// renderer building
export const renderer = new THREE.WebGLRenderer({
	powerPreference: "high-performance",
	antialias: false,
	stencil: false,
	depth: false
});

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);



// EffectComposer building
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const resolution = new THREE.Vector2( window.innerWidth, window.innerHeight );
const bloomPass = new UnrealBloomPass( resolution, 1.5, 0.4, 0.85 );
composer.addPass( bloomPass );

// orbit controls setting
const controls = new OrbitControls(camera, renderer.domElement);
camera.position.set(0,3,15);
controls.update();

// // rendering everything and setting the scene and the camera
export function animate(time){
    controls.update();
	composer.render();
}

