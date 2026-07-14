import * as THREE from 'three';
import { scene } from '../Camera_Setup/camera_setup.js';
import { textureMap } from './textures.js';

export const PLANET_RADIUS = 5.0;

let planet;

// builds (or rebuilds) the planet itself, using whatever color/texture the scene description specifies
export function buildPlanet(planet_desc){
    if (planet) scene.remove(planet);

    const planet_geometry = new THREE.SphereGeometry(PLANET_RADIUS, 32, 32);
    const planet_material = new THREE.MeshPhongMaterial({ color: planet_desc.color });

    if (planet_desc.texture){
        planet_material.map = textureMap[planet_desc.texture];
    }

    planet = new THREE.Mesh(planet_geometry, planet_material);
    scene.add(planet);
}

// given a direction (already normalized) pointing away from the planet's center,
// returns Euler angles that rotate an object's local "up" (+Y) to match that direction
export function euler_from_up(up_dir){
    const ux = up_dir[0], uy = up_dir[1], uz = up_dir[2];
    const horizontal_mag = Math.sqrt(ux*ux + uz*uz);
    const tilt = Math.atan2(horizontal_mag, uy);
    const heading = Math.atan2(ux, uz);
    return [tilt, heading, 0];
}

// given spherical angles (theta, phi) and an object's half-height, returns
// { position, rotation, surfaceDir } so the object sits flush on the planet's curve
export function place_on_planet(theta, phi, half_height, sink = 0.1){
    const sx = Math.sin(theta) * Math.cos(phi);
    const sy = Math.cos(theta);
    const sz = Math.sin(theta) * Math.sin(phi);

    const len = Math.sqrt(sx*sx + sy*sy + sz*sz);
    const surfaceDir = [sx/len, sy/len, sz/len];

    const dist = PLANET_RADIUS + half_height - sink;
    const position = [surfaceDir[0]*dist, surfaceDir[1]*dist, surfaceDir[2]*dist];
    const rotation = euler_from_up(surfaceDir);

    return { position, rotation, surfaceDir };
}