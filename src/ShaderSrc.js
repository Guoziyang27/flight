export default {
vsShader: `#version 300 es
precision mediump float;

layout (location = 0) in vec3 aPos;
layout (location = 1) in vec3 aNormal;
layout (location = 2) in vec3 aColor;
layout (location = 3) in vec2 aTexCoord;

out vec3 ourColor;
out vec3 ourNormal;
out vec3 ourPosition;
out vec2 TexCoord;

uniform mat4 model;
uniform mat4 view;
uniform mat4 projection;

void main()
{
    gl_Position = projection * view * model * vec4(aPos, 1.0f);
    // gl_Position = vec4(aPos, 1.0f);
    ourColor = aColor;
    ourNormal = (transpose(inverse(model)) * vec4(aNormal, 1.0f)).xyz;
    // ourNormal = aNormal;
    ourPosition = (model * vec4(aPos, 1.0f)).xyz;
    TexCoord = vec2(aTexCoord.x, aTexCoord.y);
}`,
fsShader: `#version 300 es
precision mediump float;

out vec4 FragColor;

uniform vec3 eyePosition;
uniform vec3 lightPosition;

uniform int useLightPoint;

uniform float roughness, fresnel;

uniform int useTexture;
uniform sampler2D ourTexture;

uniform vec3 ambient;
uniform int useSpecular;
uniform vec3 specular;

in vec3 ourColor;
in vec3 ourNormal;
in vec3 ourPosition;
in vec2 TexCoord;


float beckmannDistribution(float x, float roughness) {
    float NdotH = max(x, 0.0001);
    float cos2Alpha = NdotH * NdotH;
    float tan2Alpha = (cos2Alpha - 1.0) / cos2Alpha;
    float roughness2 = roughness * roughness;
    float denom = 3.141592653589793 * roughness2 * cos2Alpha * cos2Alpha;
    return exp(tan2Alpha / roughness2) / denom;
}

float cookTorranceSpecular(
    vec3 lightDirection,
    vec3 viewDirection,
    vec3 surfaceNormal,
    float roughness,
    float fresnel) {

    float VdotN = max(dot(viewDirection, surfaceNormal), 0.0);
    float LdotN = max(dot(lightDirection, surfaceNormal), 0.0);
    //Ha1f angle vector
    vec3 H = normalize(lightDirection + viewDirection);
    //Geometric term
    float NdotH = max(dot(surfaceNormal, H), 0.0);
    float VdotH = max(dot(viewDirection, H), 0.000001);
    float x = 2.0 * NdotH / VdotH;
    float G = min(1.0, min(x * VdotN, x * LdotN));
    //Distribution term
    float D = beckmannDistribution(NdotH, roughness);
    // Fresnel term
    float F = pow(1.0 - VdotN, fresnel);

    return G * F * D / max(3.14159265 * VdotN * LdotN, 0.000001);
}

void main()
{
    vec3 viewDirection = normalize(eyePosition - ourPosition);
    vec3 lightDirection = normalize(lightPosition);
    if (useLightPoint == 1) {
        lightDirection = normalize(lightPosition - ourPosition);
    }

    vec3 normal = normalize(ourNormal);
    
    float VdotN = max(dot(viewDirection, normal), 0.0);
    float LdotN = max(dot(lightDirection, normal), 0.0);
    //Ha1f angle vector
    vec3 H = normalize(lightDirection + viewDirection);
    //Geometric term
    float NdotH = max(dot(normal, H), 0.0);
    float VdotH = max(dot(viewDirection, H), 0.000001);
    float x = 2.0 * NdotH / VdotH;
    float G = min(1.0, min(x * VdotN, x * LdotN));
    
    //Distribution term
    float D = beckmannDistribution(NdotH, roughness);
    
    // Fresnel term
    float F = pow(1.0 - VdotN, fresnel);
    if (useSpecular == 0) {
        float power = G * F * D / (max(3.14159265 * VdotN * LdotN, 0.000001));
        float carry = ((1.0 - F) + power) * LdotN;
        vec4 afterTexture = texture(ourTexture, TexCoord);
        if (useTexture == 0) {
            afterTexture = vec4(ourColor.x, ourColor.y, ourColor.z, 1.0);
        }
        FragColor = vec4(carry * afterTexture.x, carry * afterTexture.y, carry * afterTexture.z, 1.0);
    } else {
        vec3 power = G * specular * D / (max(3.14159265 * VdotN * LdotN, 0.000001));
        vec3 carry = ((1.0 - specular) + power) * LdotN;
        vec4 afterTexture = texture(ourTexture, TexCoord);
        if (useTexture == 0) {
            afterTexture = vec4(ourColor.x, ourColor.y, ourColor.z, 1.0);
        }
        vec3 color = vec3((carry.x + ambient.x) * afterTexture.x, (carry.y + ambient.y) * afterTexture.y, (carry.z + ambient.z) * afterTexture.z);
        color = color / (color + 1.0);
        FragColor = vec4(color, 1.0);
        // FragColor = vec4(1, 1, 1, 1.0);
    }
}`,
skyVsShader:`#version 300 es
precision mediump float;

layout (location = 0) in vec2 aPos;

out vec4 v_position;

uniform mat4 projection;
uniform mat4 view;

void main()
{
    v_position = vec4(aPos, 1.0, 1.0);
    vec4 pos = vec4(aPos, 1.0, 1.0);
    gl_Position = pos.xyzw;
}
`,
skyFsShader:`#version 300 es
precision mediump float;
 
out vec4 FragColor;

in vec4 v_position;

uniform samplerCube u_skybox;
uniform mat4 u_viewDirectionProjectionInverse;

void main()
{
    vec4 t = u_viewDirectionProjectionInverse * v_position;
    FragColor = texture(u_skybox, normalize(t.xyz / t.w));
}
`,
terrainVsShader: `#version 300 es
precision mediump float;
layout (location = 0) in vec3 aPos;
layout (location = 1) in vec3 aNormal;
layout (location = 2) in vec3 aColor;
layout (location = 3) in vec2 aTexCoord;
out vec3 ourColor;
out vec3 ourNormal;
out vec3 ourPosition;
out vec2 TexCoord;
uniform mat4 model;
uniform mat4 view;
uniform mat4 projection;
uniform int id;
uniform float x_size;
uniform float z_size;
void main()
{
    if(id == 0)
    {
        gl_Position = projection * view * model * vec4(aPos, 1.0f);
        ourColor = aColor;
        ourNormal = (transpose(inverse(model)) * vec4(aNormal, 1.0f)).xyz;
        ourPosition = (model * vec4(aPos, 1.0f)).xyz;
        TexCoord = vec2(aTexCoord.x, aTexCoord.y);
    }
    else if(id == 1)
    {
        vec3 bPos = vec3(x_size - aPos.x, aPos.y, aPos.z);
        vec3 bNormal = vec3(-aNormal.x, aNormal.y, aNormal.z);
        gl_Position = projection * view * model * vec4(bPos, 1.0f);
        ourColor = aColor;
        ourNormal = (transpose(inverse(model)) * vec4(bNormal, 1.0f)).xyz;
        ourPosition = (model * vec4(bPos, 1.0f)).xyz;
        TexCoord = vec2(aTexCoord.x, aTexCoord.y);
    }
    else if(id == 2)
    {
        vec3 cPos = vec3(aPos.x, aPos.y, z_size - aPos.z);
        vec3 cNormal = vec3(aNormal.x, aNormal.y, -aNormal.z);
        gl_Position = projection * view * model * vec4(cPos, 1.0f);
        ourColor = aColor;
        ourNormal = (transpose(inverse(model)) * vec4(cNormal, 1.0f)).xyz;
        ourPosition = (model * vec4(cPos, 1.0f)).xyz;
        TexCoord = vec2(aTexCoord.x, aTexCoord.y);
    }
    else if(id == 3)
    {
        vec3 dPos = vec3(x_size - aPos.x, aPos.y, z_size - aPos.z);
        vec3 dNormal = vec3(-aNormal.x, aNormal.y, -aNormal.z);
        gl_Position = projection * view * model * vec4(dPos, 1.0f);
        ourColor = aColor;
        ourNormal = (transpose(inverse(model)) * vec4(dNormal, 1.0f)).xyz;
        ourPosition = (model * vec4(dPos, 1.0f)).xyz;
        TexCoord = vec2(aTexCoord.x, aTexCoord.y);
    }
}`,
terrainFsShader:`#version 300 es
precision mediump float;

out vec4 FragColor;

uniform vec3 eyePosition;
uniform vec3 lightPosition;

uniform int useLightPoint;

uniform float roughness, fresnel;
uniform int useTexture;
uniform sampler2D ourTexture;

uniform vec3 ambient;
uniform int useSpecular;
uniform vec3 specular;

in vec3 ourColor;
in vec3 ourNormal;
in vec3 ourPosition;
in vec2 TexCoord;


float beckmannDistribution(float x, float roughness) {
    float NdotH = max(x, 0.0001);
    float cos2Alpha = NdotH * NdotH;
    float tan2Alpha = (cos2Alpha - 1.0) / cos2Alpha;
    float roughness2 = roughness * roughness;
    float denom = 3.141592653589793 * roughness2 * cos2Alpha * cos2Alpha;
    return exp(tan2Alpha / roughness2) / denom;
}

float cookTorranceSpecular(
    vec3 lightDirection,
    vec3 viewDirection,
    vec3 surfaceNormal,
    float roughness,
    float fresnel) {

    float VdotN = max(dot(viewDirection, surfaceNormal), 0.0);
    float LdotN = max(dot(lightDirection, surfaceNormal), 0.0);
    //Ha1f angle vector
    vec3 H = normalize(lightDirection + viewDirection);
    //Geometric term
    float NdotH = max(dot(surfaceNormal, H), 0.0);
    float VdotH = max(dot(viewDirection, H), 0.000001);
    float x = 2.0 * NdotH / VdotH;
    float G = min(1.0, min(x * VdotN, x * LdotN));
    //Distribution term
    float D = beckmannDistribution(NdotH, roughness);
    // Fresnel term
    float F = pow(1.0 - VdotN, fresnel);

    return G * F * D / max(3.14159265 * VdotN * LdotN, 0.000001);
}

void main()
{
    vec3 viewDirection = normalize(eyePosition - ourPosition);
    vec3 lightDirection = normalize(lightPosition);
    if (useLightPoint == 1) {
        lightDirection = normalize(lightPosition - ourPosition);
    }

    vec3 normal = normalize(ourNormal);
    
    float VdotN = max(dot(viewDirection, normal), 0.0);
    float LdotN = max(dot(lightDirection, normal), 0.0);
    //Ha1f angle vector
    vec3 H = normalize(lightDirection + viewDirection);
    //Geometric term
    float NdotH = max(dot(normal, H), 0.0);
    float VdotH = max(dot(viewDirection, H), 0.000001);
    float x = 2.0 * NdotH / VdotH;
    float G = min(1.0, min(x * VdotN, x * LdotN));
    
    //Distribution term
    float D = beckmannDistribution(NdotH, roughness);
    
    // Fresnel term
    float F = pow(1.0 - VdotN, fresnel);
    vec3 power = G * specular * D / (max(3.14159265 * VdotN * LdotN, 0.000001));
    vec3 carry = ((1.0 - specular) + power) * LdotN;
    vec4 afterTexture = texture(ourTexture, vec2(0.2f, 0.2f));
    vec3 color = vec3((carry.x + ambient.x) * afterTexture.x, (carry.y + ambient.y) * afterTexture.y, (carry.z + ambient.z) * afterTexture.z);
    color = color / (color + 1.0);
    FragColor = vec4(color, 1.0);
}`
}