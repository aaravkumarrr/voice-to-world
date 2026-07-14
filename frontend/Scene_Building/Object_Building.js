import * as THREE from 'three';
import { scene } from '../Camera_Setup/camera_setup.js';
import { textureMap } from './textures.js';

// shape creation function
export function spawnObject(description){
    let geometry;
    let material;

    switch(description.shape){
        case "cube":
            geometry = new THREE.BoxGeometry(1,1,1);
            material = decide_shape_features(description)

            break;
        case "cylinder":
            geometry = new THREE.CylinderGeometry(0.5,0.5,1,16);
            material = decide_shape_features(description)
            break;
        case "sphere":
            geometry = new THREE.SphereGeometry(0.5,16,16);
            material = decide_shape_features(description)
            break;
        case "cone":
            geometry = new THREE.ConeGeometry(0.5,1,16)
            material = decide_shape_features(description)
            break;
        case "tetrahedron":
            geometry = new THREE.TetrahedronGeometry(0.7, 0);
            material = decide_shape_features(description)
            break;
        case "octahedron":
            geometry = new THREE.OctahedronGeometry(0.6, 0);
            material = decide_shape_features(description)
            break;
        case "dodecahedron":
            geometry = new THREE.DodecahedronGeometry(0.6, 0);
            material = decide_shape_features(description)
            break;
        case "icosahedron":
            geometry = new THREE.IcosahedronGeometry(0.6, 0);
            material = decide_shape_features(description)
            break;
        case "torus":
            geometry = new THREE.TorusGeometry(0.5, 0.2, 16, 32);
            material = decide_shape_features(description)
            break;
        case "ring":
            geometry = new THREE.RingGeometry(0.3, 0.6, 32);
            material = decide_shape_features(description)
            break;
        case "plane":
            geometry = new THREE.PlaneGeometry(1, 1);
            material = decide_shape_features(description)
            break;
        case "circle":
            geometry = new THREE.CircleGeometry(0.5, 32);
            material = decide_shape_features(description)
            break;
        case "capsule":
            geometry = new THREE.CapsuleGeometry(0.3, 0.6, 4, 8);
            material = decide_shape_features(description)
            break;
        case "torusknot":
            geometry = new THREE.TorusKnotGeometry(0.4, 0.15, 100, 16, 2, 3);
            material = decide_shape_features(description);
            break;
        case "lathe":
            let points = [];
            for (let i = 0; i < description.profile.length;i++){
                points.push(new THREE.Vector2(description.profile[i][0],description.profile[i][1]))
            }
            geometry = new THREE.LatheGeometry(points, 32)
            material = decide_shape_features(description);
            break;
    }
    
    
    const shape = new THREE.Mesh(geometry, material);
    shape.scale.set(description.scale[0],description.scale[1],description.scale[2]);
    shape.position.set(description.position[0],description.position[1],description.position[2]);

    if (!description.rotation){
        shape.rotation.set(0,0,0)
    } else {
        shape.rotation.set(description.rotation[0],description.rotation[1],description.rotation[2]);
    }
    scene.add(shape);
    shape.edgeGlow
}

// shape description function
export function decide_shape_features(description){
    let material;
    if (description.glowColor && description.glowIntensity){
        material = new THREE.MeshPhongMaterial( {color: description.color , emissive: description.glowColor, emissiveIntensity: description.glowIntensity});
    } else {
        material = new THREE.MeshPhongMaterial( {color: description.color });
    }

    if (description.texture){
        material.map = textureMap[description.texture];
    }
    return material
}

// build's the scene by adding each object in the array to the scene object
export function buildScene(objects){
    objects.forEach(obj => spawnObject(obj));
}

