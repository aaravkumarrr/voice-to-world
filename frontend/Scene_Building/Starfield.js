import * as THREE from 'three';
// import * as math from 'mathjs';
import { scene } from '../Camera_Setup/camera_setup.js';

const minimum_radius = 1000;


export function buildStarfield({count, radius, star_color, star_size}){

    function generate_star_point(){
        let stars = [];
        for (let i=0; i<count*3; i++){
            const r = radius * (0.5 + Math.random() * 0.5);
            const phi = Math.acos(2 * Math.random() - 1);
            const theta = Math.random() * 2 * Math.PI;
            const x = r * Math.sin(phi) * Math.cos(theta);
            const y = r * Math.cos(phi);
            const z = r * Math.sin(phi) * Math.sin(theta);

            stars.push(x)
            stars.push(y)
            stars.push(z)
        }
        return stars;
    }

    const geometry = new THREE.BufferGeometry();
    const vertices = new Float32Array(generate_star_point());

    geometry.setAttribute('position',new THREE.BufferAttribute(vertices, 3));
    const material = new THREE.PointsMaterial({color: star_color, size: star_size})
    const points = new THREE.Points(geometry, material);  

    scene.add(points);
}
