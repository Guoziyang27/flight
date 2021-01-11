import shaders from "./ShaderSrc";

export default class Shader {

    constructor(gl, vertexID, fragmentID, geometryID = null) {
        console.log(vertexID, fragmentID);
        console.log(shaders);
        this.gl = gl;
        // 1. retrieve the vertex/fragment source code from filePath
        let vertexCode;
        let fragmentCode;
        let geometryCode;
        vertexCode = shaders[vertexID];
        fragmentCode = shaders[fragmentID];

        if(geometryID !== null)
        {
            geometryCode = shaders[geometryID];
        }
        let vShaderCode = vertexCode;
        let fShaderCode = fragmentCode;
        // 2. compile shaders
        let vertex, fragment;
        // vertex shader
        vertex = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertex, vShaderCode);
        gl.compileShader(vertex);
        this.checkCompileErrors(gl, vertex, "VERTEX");
        // fragment Shader
        fragment = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragment, fShaderCode);
        gl.compileShader(fragment);
        this.checkCompileErrors(gl, fragment, "FRAGMENT");
        // if geometry shader is given, compile geometry shader
        let geometry;
        if(geometryID !== null)
        {
            let gShaderCode = geometryCode;
            geometry = gl.createShader(gl.GEOMETRY_SHADER);
            gl.shaderSource(geometry, gShaderCode);
            gl.compileShader(geometry);
            this.checkCompileErrors(gl, geometry, "GEOMETRY");
        }
        // shader Program
        this.ID = gl.createProgram();
        gl.attachShader(this.ID, vertex);
        gl.attachShader(this.ID, fragment);
        if(geometryID !== null)
            gl.attachShader(this.ID, geometry);
        gl.linkProgram(this.ID);
        this.checkCompileErrors(gl, this.ID, "PROGRAM");
        // delete the shaders as they're linked into our program now and no longer necessery
        gl.deleteShader(vertex);
        gl.deleteShader(fragment);
        if(geometryID !== null)
            gl.deleteShader(geometry);
    }

    checkCompileErrors(gl, shader, type) {
        let success;
        let infoLog;
        if(type !== "PROGRAM") {
            success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
            if(!success) {
                infoLog = gl.getShaderInfoLog(shader);
                console.log("ERROR::SHADER_COMPILATION_ERROR of type: " + type);
                console.log(infoLog);
                console.log("-- --------------------------------------------------- -- ");
            }
        }
        else {
            console.log(shader);
            success = gl.getProgramParameter(shader, gl.LINK_STATUS);
            if(!success) {
                infoLog = gl.getProgramInfoLog(shader);
                console.log("ERROR::PROGRAM_LINKING_ERROR of type: " + type);
                console.log(infoLog);
                console.log("-- --------------------------------------------------- -- ");
            }
        }
    }

    use() {
        this.gl.useProgram(this.ID);
    }

    setBool(name, value) {
        this.gl.uniform1i(this.gl.getUniformLocation(this.ID, name), value);
    }

    setInt(name, value) {
        this.gl.uniform1i(this.gl.getUniformLocation(this.ID, name), value);
    }

    setFloat(name, value) {
        this.gl.uniform1f(this.gl.getUniformLocation(this.ID, name), value);
    }

    setVec2(name, value) {
        this.gl.uniform2fv(this.gl.getUniformLocation(this.ID, name), value);
    }
    setVec2xy(name, x, y) {
        this.gl.uniform2f(this.gl.getUniformLocation(this.ID, name), x, y);
    }

    setVec3(name, value) {
        this.gl.uniform3fv(this.gl.getUniformLocation(this.ID, name), value);
    }
    setVec3xyz(name, x, y, z) {
        this.gl.uniform3f(this.gl.getUniformLocation(this.ID, name), x, y, z);
    }

    setVec4(name, value) {
        this.gl.uniform4fv(this.gl.getUniformLocation(this.ID, name), value);
    }
    setVec4xyzw(name, x, y, z, w) {
        this.gl.uniform4f(this.gl.getUniformLocation(this.ID, name), x, y, z, w);
    }

    setMat2(name, mat) {
        this.gl.uniformMatrix2fv(this.gl.getUniformLocation(this.ID, name), false, mat);
    }

    setMat3(name, mat) {
        this.gl.uniformMatrix3fv(this.gl.getUniformLocation(this.ID, name), false, mat);
    }

    setMat4(name, mat) {
        this.gl.uniformMatrix4fv(this.gl.getUniformLocation(this.ID, name), false, mat);
    }

}