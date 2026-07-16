
import * as THREE from 'three';
// import * as math from 'mathjs';
import { scene } from '../Camera_Setup/camera_setup.js';

export function buildNebulae({centerX, centerY, centerZ, baseHue, count, spreadX, spreadY, spreadZ}){

    function generate_star_points_nebula(){

        function gaussian() {
            const u = 1 - Math.random();
            const v = Math.random();
            return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
        }
        const positions = new Float32Array(count*3);
        const colors = new Float32Array(count*3);

        for (let i=0; i < count-2; i++){
            let x = centerX + gaussian()*spreadX;
            let y = centerY + gaussian()*spreadY;
            let z = centerZ + gaussian()*spreadZ;

            positions[i*3] = x;
            positions[i*3+1]=y;
            positions[i*3+2]=z;
            
            const color = new THREE.Color();
            color.setHSL(baseHue + Math.random() * 0.1, 0.8, Math.random() * 0.5 + 0.4);
            let r = color.r;
            let g = color.g
            let b = color.b

            colors[i*3]=(r);
            colors[i*3+1]=(g);
            colors[i*3+2]=(b);
        }
        return { positions, colors} ;
    }
    


        const { positions, colors } = generate_star_points_nebula();    
    
        const geometry = new THREE.BufferGeometry();
        const vertices = new Float32Array(positions);

        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({size: Math.random()*3, vertexColors: true, blending: THREE.AdditiveBlending, transparent: true});

        const points = new THREE.Points(geometry, material);
        points.rotation.x = Math.random() * Math.PI;
        points.rotation.y = Math.random() * Math.PI;
        points.rotation.z = Math.random() * Math.PI;

        scene.add(points);
    }


