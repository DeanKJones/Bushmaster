// src/engine/math/mat4.ts
export class Mat4 {
    // Create a 4x4 identity matrix
    static identity(): number[] {
        return [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ];
    }
    
    // Multiply two 4x4 matrices
    static multiply(a: number[], b: number[]): number[] {
        const result = new Array(16).fill(0);
        
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                for (let k = 0; k < 4; k++) {
                    result[i * 4 + j] += a[i * 4 + k] * b[k * 4 + j];
                }
            }
        }
        
        return result;
    }
    
    // Create a perspective projection matrix
    static perspective(fovY: number, aspect: number, near: number, far: number): number[] {
        const f = 1.0 / Math.tan(fovY / 2);
        const rangeInv = 1 / (near - far);
        
        return [
            f / aspect, 0, 0, 0,
            0, f, 0, 0,
            0, 0, (near + far) * rangeInv, -1,
            0, 0, 2 * near * far * rangeInv, 0
        ];
    }
    
    // Create a look-at view matrix
    static lookAt(eye: [number, number, number], target: [number, number, number], up: [number, number, number]): number[] {
        const z = normalize([
            eye[0] - target[0],
            eye[1] - target[1],
            eye[2] - target[2]
        ]);
        
        const x = normalize(cross(up, z));
        const y = cross(z, x);
        
        return [
            x[0], y[0], z[0], 0,
            x[1], y[1], z[1], 0,
            x[2], y[2], z[2], 0,
            -dot(x, eye), -dot(y, eye), -dot(z, eye), 1
        ];
    }
    
    static inverse(m: number[]): number[] {
        const result = new Array(16).fill(0);
        
        // Calculate matrix of minors, cofactors, and adjugate
        const determinant = 
            m[0] * (
                m[5] * (m[10] * m[15] - m[11] * m[14]) -
                m[9] * (m[6] * m[15] - m[7] * m[14]) +
                m[13] * (m[6] * m[11] - m[7] * m[10])
            ) -
            m[4] * (
                m[1] * (m[10] * m[15] - m[11] * m[14]) -
                m[9] * (m[2] * m[15] - m[3] * m[14]) +
                m[13] * (m[2] * m[11] - m[3] * m[10])
            ) +
            m[8] * (
                m[1] * (m[6] * m[15] - m[7] * m[14]) -
                m[5] * (m[2] * m[15] - m[3] * m[14]) +
                m[13] * (m[2] * m[7] - m[3] * m[6])
            ) -
            m[12] * (
                m[1] * (m[6] * m[11] - m[7] * m[10]) -
                m[5] * (m[2] * m[11] - m[3] * m[10]) +
                m[9] * (m[2] * m[7] - m[3] * m[6])
            );
    
        // Return identity if matrix is singular (determinant is zero)
        if (Math.abs(determinant) < 1e-6) {
            console.warn('Matrix is singular, cannot invert. Returning identity matrix.');
            return Mat4.identity();
        }
    
        const invDet = 1.0 / determinant;
    
        // Calculate adjugate matrix * (1/determinant)
        result[0] = invDet * (
            m[5] * (m[10] * m[15] - m[11] * m[14]) -
            m[9] * (m[6] * m[15] - m[7] * m[14]) +
            m[13] * (m[6] * m[11] - m[7] * m[10])
        );
        result[1] = -invDet * (
            m[1] * (m[10] * m[15] - m[11] * m[14]) -
            m[9] * (m[2] * m[15] - m[3] * m[14]) +
            m[13] * (m[2] * m[11] - m[3] * m[10])
        );
        result[2] = invDet * (
            m[1] * (m[6] * m[15] - m[7] * m[14]) -
            m[5] * (m[2] * m[15] - m[3] * m[14]) +
            m[13] * (m[2] * m[7] - m[3] * m[6])
        );
        result[3] = -invDet * (
            m[1] * (m[6] * m[11] - m[7] * m[10]) -
            m[5] * (m[2] * m[11] - m[3] * m[10]) +
            m[9] * (m[2] * m[7] - m[3] * m[6])
        );
        result[4] = -invDet * (
            m[4] * (m[10] * m[15] - m[11] * m[14]) -
            m[8] * (m[6] * m[15] - m[7] * m[14]) +
            m[12] * (m[6] * m[11] - m[7] * m[10])
        );
        result[5] = invDet * (
            m[0] * (m[10] * m[15] - m[11] * m[14]) -
            m[8] * (m[2] * m[15] - m[3] * m[14]) +
            m[12] * (m[2] * m[11] - m[3] * m[10])
        );
        result[6] = -invDet * (
            m[0] * (m[6] * m[15] - m[7] * m[14]) -
            m[4] * (m[2] * m[15] - m[3] * m[14]) +
            m[12] * (m[2] * m[7] - m[3] * m[6])
        );
        result[7] = invDet * (
            m[0] * (m[6] * m[11] - m[7] * m[10]) -
            m[4] * (m[2] * m[11] - m[3] * m[10]) +
            m[8] * (m[2] * m[7] - m[3] * m[6])
        );
        result[8] = invDet * (
            m[4] * (m[9] * m[15] - m[11] * m[13]) -
            m[8] * (m[5] * m[15] - m[7] * m[13]) +
            m[12] * (m[5] * m[11] - m[7] * m[9])
        );
        result[9] = -invDet * (
            m[0] * (m[9] * m[15] - m[11] * m[13]) -
            m[8] * (m[1] * m[15] - m[3] * m[13]) +
            m[12] * (m[1] * m[11] - m[3] * m[9])
        );
        result[10] = invDet * (
            m[0] * (m[5] * m[15] - m[7] * m[13]) -
            m[4] * (m[1] * m[15] - m[3] * m[13]) +
            m[12] * (m[1] * m[7] - m[3] * m[5])
        );
        result[11] = -invDet * (
            m[0] * (m[5] * m[9] - m[7] * m[8]) -
            m[4] * (m[1] * m[9] - m[3] * m[8]) +
            m[8] * (m[1] * m[5] - m[3] * m[4])
        );
        result[12] = -invDet * (
            m[4] * (m[9] * m[14] - m[10] * m[13]) -
            m[8] * (m[5] * m[14] - m[6] * m[13]) +
            m[12] * (m[5] * m[10] - m[6] * m[9])
        );
        result[13] = invDet * (
            m[0] * (m[9] * m[14] - m[10] * m[13]) -
            m[8] * (m[1] * m[14] - m[2] * m[13]) +
            m[12] * (m[1] * m[10] - m[2] * m[9])
        );
        result[14] = -invDet * (
            m[0] * (m[5] * m[14] - m[6] * m[13]) -
            m[4] * (m[1] * m[14] - m[2] * m[13]) +
            m[12] * (m[1] * m[6] - m[2] * m[5])
        );
        result[15] = invDet * (
            m[0] * (m[5] * m[10] - m[6] * m[9]) -
            m[4] * (m[1] * m[10] - m[2] * m[9]) +
            m[8] * (m[1] * m[6] - m[2] * m[5])
        );
        return result;
    }
}

// Vector utility functions
function dot(a: number[], b: number[]): number {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function cross(a: number[], b: number[]): [number, number, number] {
    return [
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0]
    ];
}

function normalize(v: number[]): [number, number, number] {
    const length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    return [
        v[0] / length,
        v[1] / length,
        v[2] / length
    ];
}