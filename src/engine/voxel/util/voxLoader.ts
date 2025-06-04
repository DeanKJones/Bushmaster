export interface VoxColor {
    r: number;
    g: number;
    b: number;
    a: number;
}

export interface VoxVoxel {
    x: number;
    y: number;
    z: number;
    colorIndex: number;
}

export interface VoxModel {
    size: { x: number; y: number; z: number };
    voxels: VoxVoxel[];
    palette: VoxColor[];
}

function readString(view: DataView, offset: number, length: number): string {
    let str = '';
    for (let i = 0; i < length; i++) {
        str += String.fromCharCode(view.getUint8(offset + i));
    }
    return str;
}

function parseVox(buffer: ArrayBuffer): VoxModel {
    const view = new DataView(buffer);
    let offset = 0;

    const magic = readString(view, offset, 4); offset += 4;
    if (magic !== 'VOX ') {
        throw new Error('Invalid VOX file');
    }

    offset += 4; // version
    // MAIN chunk
    offset += 4; // chunk id 'MAIN'
    const mainSize = view.getUint32(offset, true); offset += 4;
    const mainChildren = view.getUint32(offset, true); offset += 4;
    offset += mainSize; // usually zero

    const end = offset + mainChildren;

    const model: VoxModel = {
        size: { x: 0, y: 0, z: 0 },
        voxels: [],
        palette: []
    };

    while (offset < end) {
        const id = readString(view, offset, 4); offset += 4;
        const chunkSize = view.getUint32(offset, true); offset += 4;
        const childSize = view.getUint32(offset, true); offset += 4;
        if (id === 'SIZE') {
            const x = view.getInt32(offset, true); offset += 4;
            const y = view.getInt32(offset, true); offset += 4;
            const z = view.getInt32(offset, true); offset += 4;
            model.size = { x, y, z };
        } else if (id === 'XYZI') {
            const num = view.getUint32(offset, true); offset += 4;
            for (let i = 0; i < num; i++) {
                const x = view.getUint8(offset++);
                const y = view.getUint8(offset++);
                const z = view.getUint8(offset++);
                const c = view.getUint8(offset++);
                model.voxels.push({ x, y, z, colorIndex: c });
            }
        } else if (id === 'RGBA') {
            model.palette = [];
            for (let i = 0; i < 256; i++) {
                const r = view.getUint8(offset++);
                const g = view.getUint8(offset++);
                const b = view.getUint8(offset++);
                const a = view.getUint8(offset++);
                model.palette.push({ r, g, b, a });
            }
        } else {
            // skip unknown chunk
            offset += chunkSize;
        }
        offset += childSize; // skip any children
    }

    return model;
}

export async function loadVox(url: string): Promise<VoxModel> {
    const res = await fetch(url);
    const buffer = await res.arrayBuffer();
    return parseVox(buffer);
}

