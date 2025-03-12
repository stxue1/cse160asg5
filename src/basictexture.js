import * as THREE from 'three';
// import {OBJLoader} from 'three/addons/loaders/OBJLoader.js';

function main() {
  console.log('running 3js');
  const canvas = document.querySelector('#c');
  const renderer = new THREE.WebGLRenderer({antialias: true, canvas});

  const fov = 75;
  const aspect = 2;  // the canvas default
  const near = 0.1;
  const far = 5;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.z = 2;

  const scene = new THREE.Scene();
  
  const boxWidth = 1;
  const boxHeight = 1;
  const boxDepth = 1;
  const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);

  const color = 0xFFFFFF;
  const intensity = 3;
  const light = new THREE.DirectionalLight(color, intensity);
  light.position.set(-1, 2, 4);
  scene.add(light);

  const cubes = [];

  // textures
  const loadManager = new THREE.LoadingManager();
  const loader = new THREE.TextureLoader(loadManager);
  function loadColorTexture( path ) {
    const texture = loader.load( path );
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }
  
  const materials = [
    new THREE.MeshBasicMaterial({map: loadColorTexture('public/flower-1.jpg')}),
    new THREE.MeshBasicMaterial({map: loadColorTexture('public/flower-2.jpg')}),
    new THREE.MeshBasicMaterial({map: loadColorTexture('public/flower-3.jpg')}),
    new THREE.MeshBasicMaterial({map: loadColorTexture('public/flower-4.jpg')}),
    new THREE.MeshBasicMaterial({map: loadColorTexture('public/flower-5.jpg')}),
    new THREE.MeshBasicMaterial({map: loadColorTexture('public/flower-6.jpg')}),
  ];

  const loadingElem = document.querySelector('#loading');
  const progressBarElem = loadingElem.querySelector('.progressbar');

  loadManager.onLoad = () => {
    loadingElem.style.display = 'none';
    const cube = new THREE.Mesh(geometry, materials);
    scene.add(cube);
    cubes.push(cube);  // add to our list of cubes to rotate
  };
  loadManager.onProgress = (urlOfLastItemLoaded, itemsLoaded, itemsTotal) => {
    const progress = itemsLoaded / itemsTotal;
    progressBarElem.style.transform = `scaleX(${progress})`;
  };

 
  renderer.setSize( window.innerWidth, window.innerHeight );

  function render(time) {
    time *= 0.001;  // convert time to seconds

    cubes.forEach((cube, ndx) => {
      const speed = 1 + ndx * .1;
      const rot = time * speed;
      cube.rotation.x = rot;
      cube.rotation.y = rot;
    });
    renderer.render(scene, camera);
   
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}
function main3() {
  console.log('running 3js');
  const canvas = document.querySelector('#c');
  const renderer = new THREE.WebGLRenderer({antialias: true, canvas});

  const fov = 75;
  const aspect = 2;  // the canvas default
  const near = 0.1;
  const far = 5;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.z = 2;

  const scene = new THREE.Scene();

  function makeInstance(geometry, color, x) {
    const material = new THREE.MeshPhongMaterial({color});
   
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);
   
    cube.position.x = x;
   
    return cube;
  }

  const boxWidth = 1;
  const boxHeight = 1;
  const boxDepth = 1;
  const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);

  const color = 0xFFFFFF;
  const intensity = 3;
  const light = new THREE.DirectionalLight(color, intensity);
  light.position.set(-1, 2, 4);
  scene.add(light);

  const cubes = [
    makeInstance(geometry, 0x44aa88,  0),
    makeInstance(geometry, 0x8844aa, -2),
    makeInstance(geometry, 0xaa8844,  2),
  ];

  renderer.setSize( window.innerWidth, window.innerHeight );

  function render(time) {
    time *= 0.001;  // convert time to seconds

    cubes.forEach((cube, ndx) => {
      const speed = 1 + ndx * .1;
      const rot = time * speed;
      cube.rotation.x = rot;
      cube.rotation.y = rot;
    });
   
    renderer.render(scene, camera);
   
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}

main();