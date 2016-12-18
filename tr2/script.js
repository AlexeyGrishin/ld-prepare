var container, camera, scene;

var mtlLoader = new THREE.MTLLoader();
mtlLoader.setPath('models/');
//mtlLoader.setBaseUrl('models/');

function loadModel(name, cb) {
    mtlLoader.load(name + '.mtl', function(materials) {
        materials.preload();
        var objLoader = new THREE.OBJLoader();
        objLoader.setPath('models/');
        objLoader.setMaterials(materials);
        objLoader.load(name + '.obj', function(obj) {
            cb(obj);
        });
    });
}

var door;
var renderer;
var doorContainer;
var zoom = 1;
var size = 24 * zoom;


init(function() { setTimeout(function() { render(); }, 200)});


var frames = [];
var maxWidth = 640*zoom;
var targetCanvas = document.createElement("canvas");
targetCanvas.setAttribute("width", maxWidth);
targetCanvas.setAttribute("height", size);
document.body.appendChild(targetCanvas);


function init(afterInit) {

    scene = new THREE.Scene();
    camera = new THREE.OrthographicCamera( 0, size/zoom, size/zoom, 0, 1, 100 );
    camera.position.z = 100;
    camera.position.x = 0;
    camera.position.y = 0;

    renderer = new THREE.WebGLRenderer({ alpha: true, preserveDrawingBuffer: true });
    renderer.setClearColor( 0x000000, 0 );
    renderer.setSize( size, size);
    renderer.shadowMap.enabled = true;

    document.body.appendChild( renderer.domElement );

    var ambient = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambient);

    var light1 = new THREE.DirectionalLight(0xffffff, 1.0);
    light1.position.set(size/2, size, 100);
    light1.target.position.set(size / 2, 0, 0);
    scene.add(light1);

    function loadModels(models, cb) {
        var res = models.map(function(m) { return {
            model: m,
            result: undefined
        };});

        var done = 0;
        function loadOne(mr) {
            loadModel(mr.model, function(obj) {
                mr.result = obj;
                done++;
                if (done == models.length) cb(res.map(function(r) { return r.result;}))
            });
        }
        res.forEach(loadOne);
    }

    function loadSingleObject(rotations, doorObj) {
        doorContainer = new THREE.Group();
        door = doorObj;
        //console.log(doorObj);
        doorContainer.position.set(size / 2 / zoom, size / 2 / zoom, 20);
        door.position.set(0, -8, 0);
        //door.position.set(8,8,-8);
        door.rotateX(rotations[0]);
        door.rotateY(rotations[1]);
        door.rotateZ(rotations[2]);
        door.updateMatrix();
        doorContainer.updateMatrix();
        doorContainer.add(door);
        scene.add(doorContainer);
        frames = null;



        afterInit();
    };

    function loadDoor() {
        loadModel('door', loadSingleObject.bind(null, [0, -Math.PI/2, 0]));
    }

    function loadAudiosystem() {
        loadModel("recorder", loadSingleObject.bind(null, [0, -Math.PI, 0]));
    }

    function loadSpeaker1() {
        loadModels(['speaker1_1', 'speaker1_2', 'speaker1_3'], function(sps) {
            loadAnimated([0, -Math.PI/2, 0], sps, [sps[0], sps[1], sps[2], sps[1]])
        })
    }

    function loadSpeaker2() {
        loadModel('speaker2', loadSingleObject.bind(null, [0, -Math.PI/2, 0]))
    }

    function loadAnimated(rotations, objects, oframes) {
        frames = oframes;
        doorContainer = new THREE.Group();
        doorContainer.position.set(size / 2 / zoom, size / 2 / zoom, 20);
        doorContainer.updateMatrix();
        objects.forEach(function (f) {
            f.position.set(0, -8, 0);
            f.rotateX(rotations[0]);
            f.rotateY(rotations[1]);
            f.rotateZ(rotations[2]);
            f.updateMatrix();
            doorContainer.add(f);
            f.visible = false;
        });
        frames[0].visible = true;
        //door.position.set(8,8,-8);

        scene.add(doorContainer);

        afterInit();
    }

    function loadGarderob() {
        loadModels(['garderob','garderob1','garderob2','garderob3'], function(g) {
            loadAnimated([0,0,0], g, [g[0], g[1], g[2], g[3], g[2], g[1]]);
        });
    }
    //loadDoor();
    //loadGarderob();
    //loadAudiosystem();
    loadSpeaker2();
}

let frameChange = {
    started: new Date().getTime(),
    passed: 0,
    ts: 200,

    ti: 20/6
};

var ctx = targetCanvas.getContext('2d');
var i = 0;
var justAnimation = true;

function render() {
    //if (i > 2) return;
    if (i*size > maxWidth) return;
    requestAnimationFrame(render);
    renderer.render(scene, camera);
    ctx.drawImage(renderer.domElement, i*size, 0);
    i++;
    if (frames && justAnimation) {
        frames[0].visible = false;
        frames.push(frames.shift());
        frames[0].visible = true;
        if (i == frames.length) justAnimation = false;
        if (justAnimation) return;
    }
    //controls.update();
    //doorContainer.rotateX(Math.PI/180);
    let sp1 = Math.PI/180*2;
    //doorContainer.rotateX(-sp1*4);
    doorContainer.rotateY(sp1*8);
    doorContainer.rotateZ(-sp1*4);
    if (frames) {
        frameChange.passed = new Date().getTime() - frameChange.started;
        //if (frameChange.passed >= frameChange.ts) {
        if (i % frameChange.ti == 0) {
            frames[0].visible = false;
            frames.push(frames.shift());
            frames[0].visible = true;
            frameChange.started = new Date().getTime();
        }
    }

}