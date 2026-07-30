---
type: "Concept"
title: "WebGPU Basic Rendering pipeline"
description: "Setting up a modern WebGPU rendering pipeline for CAD canvas initialization."
resource: "WebGPU Unleashed"
tags: ["WebGPU", "rendering", "pipeline"]
timestamp: "2026-07-24"
---

# WebGPU Basic Rendering Pipeline

When initializing a new agentic CAD project using the SpecKit SDLC Build phase, the initial viewer canvas should be built on WebGPU, avoiding legacy WebGL code. 

## Architectural Guidance

A WebGPU pipeline requires explicit creation of adapter, device, context, and shaders. Unlike WebGL, states like blend modes, cull modes, and layouts are baked into deterministic `RenderPipeline` objects, matching the immutable nature of agentic code generation.

1. **Adapter & Device**: Request an adapter (physical GPU) and device (logical connection).
2. **Shader Module**: Compile WGSL code.
3. **Pipeline Layout**: Define binding groups for uniforms.
4. **Render Pipeline**: Bake the shader, layout, and primitive topology into a single state object.
5. **Command Encoding**: Record commands before submitting to the device queue.

## SDLC Implementation

During the **Build phase**, when the agent implements the initial canvas setup:
- Always use `@vertex` and `@fragment` WGSL entry points.
- Structure the pipeline layout early.

### Implementation Reference

```javascript
// Request adapter and device
const adapter = await navigator.gpu.requestAdapter();
let device = await adapter.requestDevice();
const context = configContext(device, canvas);

// Load Shader
let code = document.getElementById('shader').innerText;
let shaderModule = device.createShaderModule({ code: code });

// Define Pipeline
const pipelineLayoutDesc = { bindGroupLayouts: [] };
const layout = device.createPipelineLayout(pipelineLayoutDesc);

const colorState = { format: 'bgra8unorm' };
const pipelineDesc = {
    layout,
    vertex: { module: shaderModule, entryPoint: 'vs_main', buffers: [] },
    fragment: { module: shaderModule, entryPoint: 'fs_main', targets: [colorState] },
    primitive: { topology: 'triangle-list', frontFace: 'ccw', cullMode: 'back' }
};
const pipeline = device.createRenderPipeline(pipelineDesc);

// Execute Render Pass
let commandEncoder = device.createCommandEncoder();
let passEncoder = commandEncoder.beginRenderPass(renderPassDesc);
passEncoder.setPipeline(pipeline);
passEncoder.draw(3, 1);
passEncoder.end();
device.queue.submit([commandEncoder.finish()]);
```
