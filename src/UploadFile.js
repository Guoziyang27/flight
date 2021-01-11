import Env from './env'
import {parseMTL, parseOBJ} from "./loadOBJ";
import rawMTl from "./AircraftModel/3d-model1.mtl";
import {genOBJBuffer} from "./main";

export async function onSubmit() {
    const objFile = document.getElementById('obj-reader').files[0];
    const mtlFile = document.getElementById('mtl-reader').files[0];
    const readerOBJ = new FileReader();
    let aircraftOBJ, aircraftMTL;
    readerOBJ.readAsText(objFile);
    readerOBJ.onload = function() {
        aircraftOBJ = parseOBJ(readerOBJ.result);
        console.log(aircraftOBJ);
        const readerMTL = new FileReader();
        readerMTL.readAsText(mtlFile);
        readerMTL.onload = function() {
            aircraftMTL = parseMTL(readerMTL.result);
            console.log(aircraftMTL);
            [Env.aircraftOBJs, Env.aircraftOBB] = genOBJBuffer(Env.gl, aircraftOBJ, aircraftMTL);
            Env.uploadedOBJ = true;
        };

    };

}