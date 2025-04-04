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

    static translate(out: number[], a: number[], v: [number, number, number]): number[] {
        const x = v[0], y = v[1], z = v[2];
        
        out[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
        out[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
        out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
        out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
        
        return out;
    };
    
    static scale(out: number[], a: number[], v: [number, number, number]): number[] {
        const x = v[0], y = v[1], z = v[2];
        
        out[0] = a[0] * x;
        out[1] = a[1] * x;
        out[2] = a[2] * x;
        out[3] = a[3] * x;
        out[4] = a[4] * y;
        out[5] = a[5] * y;
        out[6] = a[6] * y;
        out[7] = a[7] * y;
        out[8] = a[8] * z;
        out[9] = a[9] * z;
        out[10] = a[10] * z;
        out[11] = a[11] * z;
        out[12] = a[12];
        out[13] = a[13];
        out[14] = a[14];
        out[15] = a[15];
        
        return out;
    };
    
    static rotateX(out: number[], a: number[], rad: number): number[] {
        const s = Math.sin(rad);
        const c = Math.cos(rad);
        const a10 = a[4];
        const a11 = a[5];
        const a12 = a[6];
        const a13 = a[7];
        const a20 = a[8];
        const a21 = a[9];
        const a22 = a[10];
        const a23 = a[11];
    
        // Perform axis-specific matrix multiplication
        out[4] = a10 * c + a20 * s;
        out[5] = a11 * c + a21 * s;
        out[6] = a12 * c + a22 * s;
        out[7] = a13 * c + a23 * s;
        out[8] = a20 * c - a10 * s;
        out[9] = a21 * c - a11 * s;
        out[10] = a22 * c - a12 * s;
        out[11] = a23 * c - a13 * s;
        
        // Copy the rest
        out[0] = a[0];
        out[1] = a[1];
        out[2] = a[2];
        out[3] = a[3];
        out[12] = a[12];
        out[13] = a[13];
        out[14] = a[14];
        out[15] = a[15];
        
        return out;
    };
    
    
    static rotateY(out: number[], a: number[], rad: number): number[] {
        const s = Math.sin(rad);
        const c = Math.cos(rad);
        const a00 = a[0];
        const a01 = a[1];
        const a02 = a[2];
        const a03 = a[3];
        const a20 = a[8];
        const a21 = a[9];
        const a22 = a[10];
        const a23 = a[11];
    
        // Perform axis-specific matrix multiplication
        out[0] = a00 * c - a20 * s;
        out[1] = a01 * c - a21 * s;
        out[2] = a02 * c - a22 * s;
        out[3] = a03 * c - a23 * s;
        out[8] = a00 * s + a20 * c;
        out[9] = a01 * s + a21 * c;
        out[10] = a02 * s + a22 * c;
        out[11] = a03 * s + a23 * c;
        
        // Copy the rest
        out[4] = a[4];
        out[5] = a[5];
        out[6] = a[6];
        out[7] = a[7];
        out[12] = a[12];
        out[13] = a[13];
        out[14] = a[14];
        out[15] = a[15];
        
        return out;
    };
    
    static rotateZ(out: number[], a: number[], rad: number): number[] {
        const s = Math.sin(rad);
        const c = Math.cos(rad);
        const a00 = a[0];
        const a01 = a[1];
        const a02 = a[2];
        const a03 = a[3];
        const a10 = a[4];
        const a11 = a[5];
        const a12 = a[6];
        const a13 = a[7];
    
        // Perform axis-specific matrix multiplication
        out[0] = a00 * c + a10 * s;
        out[1] = a01 * c + a11 * s;
        out[2] = a02 * c + a12 * s;
        out[3] = a03 * c + a13 * s;
        out[4] = a10 * c - a00 * s;
        out[5] = a11 * c - a01 * s;
        out[6] = a12 * c - a02 * s;
        out[7] = a13 * c - a03 * s;
        
        // Copy the rest
        out[8] = a[8];
        out[9] = a[9];
        out[10] = a[10];
        out[11] = a[11];
        out[12] = a[12];
        out[13] = a[13];
        out[14] = a[14];
        out[15] = a[15];
        
        return out;
    };
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