import * as THREE from 'three';
import { scene } from '../Camera_Setup/camera_setup.js';

export function initiateLight(type){
    let light;

    if (type == "Directional"){
        light = new THREE.DirectionalLight(0xff8866, 6);
        light.position.set(3,5,4);
    } else if (type == "Ambient") {
        light = new THREE.AmbientLight(0xff8866, 3);
    }

    scene.add(light);
}