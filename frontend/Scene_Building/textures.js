import * as THREE from 'three';


// In this file, the textures and texture loader are all used.

const loader = new THREE.TextureLoader();

export const textureMap = {
    grass : loader.load('textures/Grass005_1K-JPG_Color.jpg'),
    rock : loader.load('textures/Rock030_1K-JPG_Color.jpg'),
    wood : loader.load('textures/Wood049_1K-JPG_Color.jpg'),
    brick : loader.load('textures/Bricks090_1K-JPG_Color.jpg'),
    bark : loader.load('textures/Bark006_1K-JPG_Color.jpg'),
    cobble : loader.load('textures/PavingStones070_1K-JPG_Color.jpg'),
    sand : loader.load('textures/Ground054_1K-JPG_Color.jpg'),
    snow : loader.load('textures/Snow006_1K-JPG_Color.jpg'),
}