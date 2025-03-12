import * as THREE from 'three';
import {OBJLoader} from 'three/addons/loaders/OBJLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
import {MTLLoader} from 'three/addons/loaders/MTLLoader.js';

class ColorGUIHelper {
  constructor(object, prop) {
    this.object = object;
    this.prop = prop;
  }
  get value() {
    return `#${this.object[this.prop].getHexString()}`;
  }
  set value(hexString) {
    this.object[this.prop].set(hexString);
  }
}
class FogGUIHelper {
  constructor(fog, backgroundcolor) {
    this.fog = fog;
    this.backgroundColor = backgroundcolor;
  }
  get near() {
    return this.fog.near;
  }
  set near(v) {
    this.fog.near = v;
    this.fog.far = Math.max(this.fog.far, v);
  }
  get far() {
    return this.fog.far;
  }
  set far(v) {
    this.fog.far = v;
    this.fog.near = Math.min(this.fog.near, v);
  }
  get color() {
    return `#${this.fog.color.getHexString()}`;
  }
  set color(hexString) {
    this.fog.color.set(hexString);
    this.backgroundColor.set(hexString);
  }
}
class DimensionGUIHelper {
  constructor(obj, minProp, maxProp) {
    this.obj = obj;
    this.minProp = minProp;
    this.maxProp = maxProp;
  }
  get value() {
    return this.obj[this.maxProp] * 2;
  }
  set value(v) {
    this.obj[this.maxProp] = v /  2;
    this.obj[this.minProp] = v / -2;
  }
}

class MinMaxGUIHelper {

  constructor( obj, minProp, maxProp, minDif ) {

    this.obj = obj;
    this.minProp = minProp;
    this.maxProp = maxProp;
    this.minDif = minDif;

  }
  get min() {

    return this.obj[ this.minProp ];

  }
  set min( v ) {

    this.obj[ this.minProp ] = v;
    this.obj[ this.maxProp ] = Math.max( this.obj[ this.maxProp ], v + this.minDif );

  }
  get max() {

    return this.obj[ this.maxProp ];

  }
  set max( v ) {

    this.obj[ this.maxProp ] = v;
    this.min = this.min; // this will call the min setter

  }

}

class DegRadHelper {
  constructor(obj, prop) {
    this.obj = obj;
    this.prop = prop;
  }
  get value() {
    return THREE.MathUtils.radToDeg(this.obj[this.prop]);
  }
  set value(v) {
    this.obj[this.prop] = THREE.MathUtils.degToRad(v);
  }
}

class PickHelper {
  constructor() {
    this.raycaster = new THREE.Raycaster();
    this.pickedObject = null;
    this.pickedObjectSavedColor = 0;
  }
  pick(normalizedPosition, scene, camera, time) {

    // restore the color if there is a picked object
    if (this.pickedObject && this.pickedObject.material.emissive != null) {
      // munging but i have no time
      if (this.pickedObject.geometry.type != "PlaneGeometry") {
        this.pickedObject.material.emissive.setHex(this.pickedObjectSavedColor);
      }
      this.pickedObject = undefined;
    }

    if (this.pickedObject && Array.isArray(this.pickedObject.material)) {
      for (const material of this.pickedObject.material) {
        material.emissive.setHex(this.pickedObjectSavedColor);
      }
      this.pickedObject = undefined;
    }
 
    // cast a ray through the frustum
    this.raycaster.setFromCamera(normalizedPosition, camera);
    // get the list of objects the ray intersected
    const intersectedObjects = this.raycaster.intersectObjects(scene.children);
    let found = false;
    let i = 0;
    while (!found && i < intersectedObjects.length) {
      // pick the first object. It's the closest one
      this.pickedObject = intersectedObjects[i++].object;
      if (this.pickedObject.type == "CameraHelper" || this.pickedObject.castShadow == false
      ) {
        continue;
      }
      // save its color      
      if (Array.isArray(this.pickedObject.material)) {
        for (const material of this.pickedObject.material) {
          this.pickedObjectSavedColor = material.emissive.getHex();
          material.emissive.setHex((time * 8) % 2 > 1 ? 0xFFFF00 : 0xFF0000);
        }
      } else {
        this.pickedObjectSavedColor = this.pickedObject.material.emissive.getHex();
        // set its emissive color to flashing red/yellow
        this.pickedObject.material.emissive.setHex((time * 8) % 2 > 1 ? 0xFFFF00 : 0xFF0000);
      }
      found = true;
      return;
    }
  }
}

const objects = [];

function main() {
  const canvas = document.querySelector('#c');

  const pickHelper = new PickHelper();
  const pickPosition = {x: 0, y: 0};
  function getCanvasRelativePosition(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * canvas.width  / rect.width,
      y: (event.clientY - rect.top ) * canvas.height / rect.height,
    };
  }
   
  function setPickPosition(event) {
    const pos = getCanvasRelativePosition(event);
    pickPosition.x = (pos.x / canvas.width ) *  2 - 1;
    pickPosition.y = (pos.y / canvas.height) * -2 + 1;  // note we flip Y
  }
   
  function clearPickPosition() {
    // unlike the mouse which always has a position
    // if the user stops touching the screen we want
    // to stop picking. For now we just pick a value
    // unlikely to pick something
    pickPosition.x = -100000;
    pickPosition.y = -100000;
  }
  clearPickPosition();
   
   
  window.addEventListener('mousemove', setPickPosition);
  window.addEventListener('mouseout', clearPickPosition);
  window.addEventListener('mouseleave', clearPickPosition);

  const renderer = new THREE.WebGLRenderer({antialias: true, canvas});
  renderer.shadowMap.enabled = true;

	const fov = 45;
	const aspect = 2;
	const near = 0.1;
	const far = 100;
  const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.set(0, 10, 20);

  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 5, 0);
  controls.update();

  const scene = new THREE.Scene();
  scene.background = new THREE.Color( 'black' );

  //fog
  {
    const color = 0xFFFFFF;  // white
    const near = 10;
    const far = 50;
    scene.fog = new THREE.Fog(color, near, far);
  }

  // skybox
  {
    const loader = new THREE.TextureLoader();
    const texture = loader.load(
      'public/the_lost_city.jpg',
      () => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        texture.colorSpace = THREE.SRGBColorSpace;
        scene.background = texture;
    });
  }

  // load object
  {
    const objLoader = new OBJLoader();
    const mtlLoader = new MTLLoader();
    mtlLoader.load('public/Building/building.mtl', (mtl) => {
      mtl.preload();
      objLoader.setMaterials(mtl);
      objLoader.load('public/Building/building.obj', (root) => {
        scene.add(root);
      });
    });
  }

	{
		const planeSize = 40;

		const loader = new THREE.TextureLoader();
		const texture = loader.load( 'public/checker.jpg' );
		texture.wrapS = THREE.RepeatWrapping;
		texture.wrapT = THREE.RepeatWrapping;
		texture.magFilter = THREE.NearestFilter;
		texture.colorSpace = THREE.SRGBColorSpace;
		const repeats = planeSize / 2;
		texture.repeat.set( repeats, repeats );

		const planeGeo = new THREE.PlaneGeometry( planeSize, planeSize );
		const planeMat = new THREE.MeshPhongMaterial( {
			map: texture,
			side: THREE.DoubleSide,
		} );
		const mesh = new THREE.Mesh( planeGeo, planeMat );
    mesh.receiveShadow = true;
		mesh.rotation.x = Math.PI * - .5;
		scene.add( mesh );
	}
  {
    const cubeSize = 4;
    const cubeGeo = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
    const cubeMat = new THREE.MeshPhongMaterial({color: '#8AC'});
    const mesh = new THREE.Mesh(cubeGeo, cubeMat);
    mesh.position.set(cubeSize + 2, cubeSize / 2, 5); // move it away
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    scene.add(mesh);
  }
  {
    const sphereRadius = 3;
    const sphereWidthDivisions = 32;
    const sphereHeightDivisions = 16;
    const sphereGeo = new THREE.SphereGeometry(sphereRadius, sphereWidthDivisions, sphereHeightDivisions);
    const sphereMat = new THREE.MeshPhongMaterial({color: '#CA8'});
    const mesh = new THREE.Mesh(sphereGeo, sphereMat);
    mesh.position.set(-sphereRadius - 5, sphereRadius + 2, -5); // move it awawy
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    scene.add(mesh);
  }

  const gui = new GUI();

  function makeXYZGUI(gui, vector3, name, onChangeFn) {
    const folder = gui.addFolder(name);
    folder.add(vector3, 'x', -10, 10).onChange(onChangeFn);
    folder.add(vector3, 'y', 0, 10).onChange(onChangeFn);
    folder.add(vector3, 'z', -10, 10).onChange(onChangeFn);
    folder.open();
  }
  {
    const pointlightcolor = 0xFFFFFF;
    const pointlightintensity = 150;
    const pointlight = new THREE.PointLight(pointlightcolor, pointlightintensity);
    pointlight.position.set(0, 10, 0);
    pointlight.castShadow = true;
    scene.add(pointlight);
  
    const helper = new THREE.PointLightHelper(pointlight);
    scene.add(helper);
  
    const cameraHelper = new THREE.CameraHelper(pointlight.shadow.camera);
    scene.add(cameraHelper);

    function updateCamera() {
      pointlight.shadow.camera.updateProjectionMatrix();
      cameraHelper.update();
    }
    updateCamera();
    setTimeout( updateCamera );

    const pointlightfolder = gui.addFolder("Pointlight");
    pointlightfolder.addColor(new ColorGUIHelper(pointlight, 'color'), 'value').name('color');
    pointlightfolder.add(pointlight, 'intensity', 0, 250, 0.01);
    pointlightfolder.add(pointlight, 'distance', 0, 40).onChange(updateCamera);
		{

			const folder = gui.addFolder( 'Pointlight Shadow Camera' );
			folder.open();
			const minMaxGUIHelper = new MinMaxGUIHelper( pointlight.shadow.camera, 'near', 'far', 0.1 );
			folder.add( minMaxGUIHelper, 'min', 0.1, 50, 0.1 ).name( 'near' ).onChange( updateCamera );
			folder.add( minMaxGUIHelper, 'max', 0.1, 50, 0.1 ).name( 'far' ).onChange( updateCamera );

		}
    makeXYZGUI(gui, pointlight.position, 'pointlight position', updateCamera);

  }

  // const helper = new THREE.SpotLightHelper(light);
  // scene.add(helper);

  {
    const color = 0xFFFFFF;
    const intensity = 150;
    const light = new THREE.SpotLight(color, intensity);
    light.castShadow = true;
    light.position.set(-10, 10, -10);
    light.target.position.set(-5, 0, 0);
    scene.add(light.target);
    scene.add(light);

    const cameraHelper = new THREE.CameraHelper(light.shadow.camera);
    scene.add(cameraHelper);

    function updateCamera() {
      light.target.updateMatrixWorld();
      light.shadow.camera.updateProjectionMatrix();
      cameraHelper.update();
    }
    updateCamera();
    setTimeout( updateCamera );
    
    const spotlightfolder = gui.addFolder("Spotlight");
    spotlightfolder.addColor(new ColorGUIHelper(light, 'color'), 'value').name('color');
    spotlightfolder.add(light, 'intensity', 0, 250, 0.01);
    spotlightfolder.add(light, 'distance', 0, 40).onChange(updateCamera);
    spotlightfolder.add(new DegRadHelper(light, 'angle'), 'value', 0, 90).name('angle').onChange(updateCamera);
    spotlightfolder.add(light, 'penumbra', 0, 1, 0.01);
  
    {
  
      const folder = gui.addFolder( 'Spotlight Shadow Camera' );
      folder.open();
      const minMaxGUIHelper = new MinMaxGUIHelper( light.shadow.camera, 'near', 'far', 0.1 );
      folder.add( minMaxGUIHelper, 'min', 0.1, 50, 0.1 ).name( 'near' ).onChange( updateCamera );
      folder.add( minMaxGUIHelper, 'max', 0.1, 50, 0.1 ).name( 'far' ).onChange( updateCamera );
  
    }
    makeXYZGUI(gui, light.position, 'spotlight position', updateCamera);
    makeXYZGUI(gui, light.target.position, 'spotlight target', updateCamera);
  }



  {
    const directionallightcolor = 0xFFFFFF;
    const dirintensity = 1;
    const dirlight = new THREE.DirectionalLight(directionallightcolor, dirintensity);
    dirlight.position.set(10, 10, 0);
    dirlight.target.position.set(-5, 0, -5);
    dirlight.castShadow = true;
    scene.add(dirlight);
    scene.add(dirlight.target);
  

    const cameraHelper = new THREE.CameraHelper(dirlight.shadow.camera);
    scene.add(cameraHelper);

    function updateCamera() {
      dirlight.target.updateMatrixWorld();

      dirlight.shadow.camera.updateProjectionMatrix();
      cameraHelper.update();
    }
    updateCamera();
    setTimeout( updateCamera );
    
    const dirfolder = gui.addFolder('Directional Light');
    dirfolder.addColor(new ColorGUIHelper(dirlight, 'color'), 'value').name('color');
    dirfolder.add(dirlight, 'intensity', 0, 5, 0.01);
    {
      const folder = gui.addFolder('Directional Shadow Camera');
      folder.open();
      folder.add(new DimensionGUIHelper(dirlight.shadow.camera, 'left', 'right'), 'value', 1, 100)
        .name('width')
        .onChange(updateCamera);
      folder.add(new DimensionGUIHelper(dirlight.shadow.camera, 'bottom', 'top'), 'value', 1, 100)
        .name('height')
        .onChange(updateCamera);
      const minMaxGUIHelper = new MinMaxGUIHelper(dirlight.shadow.camera, 'near', 'far', 0.1);
      folder.add(minMaxGUIHelper, 'min', 0.1, 50, 0.1).name('near').onChange(updateCamera);
      folder.add(minMaxGUIHelper, 'max', 0.1, 50, 0.1).name('far').onChange(updateCamera);
      folder.add(dirlight.shadow.camera, 'zoom', 0.01, 1.5, 0.01).onChange(updateCamera);
    }
    makeXYZGUI(gui, dirlight.position, 'directional light position', updateCamera);
    makeXYZGUI(gui, dirlight.target.position, 'directional light target', updateCamera);
    
  }

  const fogGuiFolder = gui.addFolder('fog');
  const fogGUIHelper = new FogGUIHelper(scene.fog, scene.background);
  fogGuiFolder.add(fogGUIHelper, 'near', near, far).listen();
  fogGuiFolder.add(fogGUIHelper, 'far', near, far).listen();
  fogGuiFolder.addColor(fogGUIHelper, 'color');

  // {
  //   const folder = gui.addFolder('Shadow Camera');
  //   folder.open();
  //   folder.add(new DimensionGUIHelper(light.shadow.camera, 'left', 'right'), 'value', 1, 100)
  //     .name('width')
  //     .onChange(updateCamera);
  //   folder.add(new DimensionGUIHelper(light.shadow.camera, 'bottom', 'top'), 'value', 1, 100)
  //     .name('height')
  //     .onChange(updateCamera);
  //   const minMaxGUIHelper = new MinMaxGUIHelper(light.shadow.camera, 'near', 'far', 0.1);
  //   folder.add(minMaxGUIHelper, 'min', 0.1, 50, 0.1).name('near').onChange(updateCamera);
  //   folder.add(minMaxGUIHelper, 'max', 0.1, 50, 0.1).name('far').onChange(updateCamera);
  //   folder.add(light.shadow.camera, 'zoom', 0.01, 1.5, 0.01).onChange(updateCamera);
  // }


  {

    // create a bunch of bouncing objects
    const numObjects = 50;
    for (let i = 0; i < numObjects; ++i) {
      const rand = Math.random();

      const sphereRadius = 1;
      const sphereWidthDivisions = 32;
      const sphereHeightDivisions = 16;
      
      let mesh = null;
      if (rand < 0.2) {
        const sphereGeo = new THREE.SphereGeometry(sphereRadius, sphereWidthDivisions, sphereHeightDivisions);
        const sphereMat = new THREE.MeshPhongMaterial();
        sphereMat.color.setHSL(i / numObjects, 1, 0.75);
        mesh = new THREE.Mesh(sphereGeo, sphereMat);
        mesh.position.set(-sphereRadius - 5, sphereRadius + 2, -5); // move it awawy
        mesh.receiveShadow = true;
        mesh.castShadow = true;
        scene.add(mesh);
      } else if (rand < 0.4) {
        const cylinderRadius = 1;
        const cylinderHeight = 3;
        const cylinderGeo = new THREE.CylinderGeometry(cylinderRadius, cylinderRadius, cylinderHeight);
        const cylinderMat = new THREE.MeshPhongMaterial();
        cylinderMat.color.setHSL(i / numObjects, 1, 0.75);
        mesh = new THREE.Mesh(cylinderGeo, cylinderMat);
        mesh.position.set(-cylinderRadius - 5, cylinderRadius + 2, -5);
        mesh.receiveShadow = true;
        mesh.castShadow = true;
        scene.add(mesh);
      } else if (rand < 0.6) {
        const dodecahedronRadius = 1;
        const dodecahedronGeo = new THREE.DodecahedronGeometry(dodecahedronRadius);
        const dodecahedronMat = new THREE.MeshPhongMaterial();
        dodecahedronMat.color.setHSL(i / numObjects, 1, 0.75);
        mesh = new THREE.Mesh(dodecahedronGeo, dodecahedronMat);
        mesh.position.set(-dodecahedronRadius - 5, dodecahedronRadius + 2, -5);
        mesh.receiveShadow = true;
        mesh.castShadow = true;
        scene.add(mesh);
      } else if (rand < 0.8) {

        const icosahedronRadius = 1;
        const icosahedronGeo = new THREE.IcosahedronGeometry(icosahedronRadius);
        const icosahedronMat = new THREE.MeshPhongMaterial();
        icosahedronMat.color.setHSL(i / numObjects, 1, 0.75);
        mesh = new THREE.Mesh(icosahedronGeo, icosahedronMat);
        mesh.position.set(-icosahedronRadius - 5, icosahedronRadius + 2, -5);
        mesh.receiveShadow = true;
        mesh.castShadow = true;
        scene.add(mesh);
      } else {
        const radius = 0.5;
        const tube = 0.5;
        const ringGeo = new THREE.TorusKnotGeometry(radius, tube);
        const ringMat = new THREE.MeshPhongMaterial();
        ringMat.color.setHSL(i / numObjects, 1, 0.75);
        mesh = new THREE.Mesh(ringGeo, ringMat);
        mesh.position.set(-radius - 5, radius + 2, -5);
        mesh.receiveShadow = true;
        mesh.castShadow = true;
        scene.add(mesh);
      }
      objects.push({mesh, y: mesh.position.y});
    }

  }
  {
    const loadManager = new THREE.LoadingManager();
    const loader = new THREE.TextureLoader(loadManager);
    function loadColorTexture( path ) {
      const texture = loader.load( path );
      texture.colorSpace = THREE.SRGBColorSpace;
      return texture;
    }
    
    const materials = [
      new THREE.MeshPhongMaterial({map: loadColorTexture('public/flower-1.jpg')}),
      new THREE.MeshPhongMaterial({map: loadColorTexture('public/flower-2.jpg')}),
      new THREE.MeshPhongMaterial({map: loadColorTexture('public/flower-3.jpg')}),
      new THREE.MeshPhongMaterial({map: loadColorTexture('public/flower-4.jpg')}),
      new THREE.MeshPhongMaterial({map: loadColorTexture('public/flower-5.jpg')}),
      new THREE.MeshPhongMaterial({map: loadColorTexture('public/flower-6.jpg')}),
    ];

    loadManager.onLoad = () => {
      const boxWidth = 2;
      const boxHeight = 2;
      const boxDepth = 2;
      const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);
      
      const mesh = new THREE.Mesh(geometry, [...materials]);
      mesh.position.set(-boxWidth - 5, boxHeight + 2, boxDepth-5);

      mesh.receiveShadow = true;
      mesh.castShadow = true;
      objects.push({mesh, y: mesh.position.y});
      scene.add(mesh);
    };
  }
  // this is super freaking messy but i have other stuff to get to
  {
    const loadManager = new THREE.LoadingManager();
    const loader = new THREE.TextureLoader(loadManager);
    function loadColorTexture( path ) {
      const texture = loader.load( path );
      texture.colorSpace = THREE.SRGBColorSpace;
      return texture;
    }
    
    const materials = [
      new THREE.MeshPhongMaterial({map: loadColorTexture('public/flower-1.jpg')}),
      new THREE.MeshPhongMaterial({map: loadColorTexture('public/flower-2.jpg')}),
      new THREE.MeshPhongMaterial({map: loadColorTexture('public/flower-3.jpg')}),
      new THREE.MeshPhongMaterial({map: loadColorTexture('public/flower-4.jpg')}),
      new THREE.MeshPhongMaterial({map: loadColorTexture('public/flower-5.jpg')}),
      new THREE.MeshPhongMaterial({map: loadColorTexture('public/flower-6.jpg')}),
    ];

    loadManager.onLoad = () => {
      const boxWidth = 4;
      const boxHeight = 4;
      const boxDepth = 4;
      const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);
      
      const mesh = new THREE.Mesh(geometry, [...materials]);
      mesh.position.set(-boxWidth - 5, boxHeight + 2, boxDepth-5);

      mesh.receiveShadow = true;
      mesh.castShadow = true;
      objects.push({mesh, y: mesh.position.y});
      scene.add(mesh);
    };
  }

  {
    const loadManager = new THREE.LoadingManager();
    const loader = new THREE.TextureLoader(loadManager);
    function loadColorTexture( path ) {
      const texture = loader.load( path );
      texture.colorSpace = THREE.SRGBColorSpace;
      return texture;
    }
    
    const materials = [
      new THREE.MeshPhongMaterial({map: loadColorTexture('public/flower-1.jpg')}),
      new THREE.MeshPhongMaterial({map: loadColorTexture('public/flower-2.jpg')}),
      new THREE.MeshPhongMaterial({map: loadColorTexture('public/flower-3.jpg')}),
      new THREE.MeshPhongMaterial({map: loadColorTexture('public/flower-4.jpg')}),
      new THREE.MeshPhongMaterial({map: loadColorTexture('public/flower-5.jpg')}),
      new THREE.MeshPhongMaterial({map: loadColorTexture('public/flower-6.jpg')}),
    ];

    loadManager.onLoad = () => {
      const boxWidth = 2;
      const boxHeight = 2;
      const boxDepth = 2;
      const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);
      
      const mesh = new THREE.Mesh(geometry, [...materials]);
      mesh.position.set(-boxWidth - 5, boxHeight + 2, boxDepth-5);

      mesh.receiveShadow = true;
      mesh.castShadow = true;
      objects.push({mesh, y: mesh.position.y});
      scene.add(mesh);
    };
  }


 
  renderer.setSize( window.innerWidth, window.innerHeight );

	requestAnimationFrame( render );

  function resizeRendererToDisplaySize( renderer ) {

    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if ( needResize ) {

      renderer.setSize( width, height, false );

    }

    return needResize;

  }
  function render(time) {
    time *= 0.001;
    pickHelper.pick(pickPosition, scene, camera, time);
    if ( resizeRendererToDisplaySize( renderer ) ) {

      const canvas = renderer.domElement;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();

    }

    objects.forEach((mesh, ndx) => {
      const base = mesh.mesh;
      const y = mesh.y;
   
      // u is a value that goes from 0 to 1 as we iterate the spheres
      const u = ndx / objects.length;
   
      // compute a position for the base. This will move
      // both the sphere and its shadow
      const speed = time * 0.2;
      const angle = speed + u * Math.PI * 2 * (ndx % 1 ? 1 : -1);
      const radius = Math.sin(speed - ndx) * 20;
      base.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
   
      // yOff is a value that goes from 0 to 1
      const yOff = Math.abs(Math.sin(time * 2 + ndx));
      // move the sphere up and down
      base.position.y = y + THREE.MathUtils.lerp(-2, 2, yOff);
      // fade the shadow as the sphere goes up
      base.material.opacity = THREE.MathUtils.lerp(1, .25, yOff);
    });
   

    renderer.render( scene, camera );

    requestAnimationFrame( render );

  }

}

main();