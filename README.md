# Bushmaster Voxel Engine

A lightweight WebGPU-based voxel engine written in TypeScript. The project serves as a sandbox for experimenting with real-time rendering techniques, physics interactions, and user interface overlays.

## Table of Contents
- [Introduction](#introduction)
- [Features](#features)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)

## Introduction
This repository contains a small demo engine built with **WebGPU** and **TypeScript**. It allows you to load voxel data, render it in the browser and tweak the scene with built in UI controls. The code is intentionally modular to make experimenting with different render pipelines and voxel generators straightforward.

## Features
- **WebGPU renderer** with a basic pipeline setup
- **Voxel engine** supporting simple generation and updates
- **BVH-based raytracing** shaders for efficient rendering
- **UI overlays** powered by a small UI manager
- **Camera controls** via an event system and controller classes

## Project Structure
```
assets/       Static textures and models
src/engine/   Core engine source code
    render/   Rendering system and pipeline descriptions
    voxel/    Voxel data structures and generation utilities
    ui/       Basic HTML/CSS based UI controls
    events/   Input handling and camera controller
```

## Installation
1. Clone the repository
   ```sh
   git clone https://github.com/DeanKJones/Bushmaster.git
   cd Bushmaster
   ```
2. Install dependencies
   ```sh
   npm install
   ```

## Usage
Build the project and start a development server:
```sh
npm run build
npm run dev
```
Open `http://localhost:5173` in your browser to see the demo. The entry point is `index.html` which loads the compiled script from `dist/entryPoint.js`.

## Contributing
Pull requests are welcome. Feel free to open issues or discuss enhancements in the issue tracker.

## License
Licensed under the MIT License.
