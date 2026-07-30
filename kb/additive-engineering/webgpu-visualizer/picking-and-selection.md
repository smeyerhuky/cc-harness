---
type: "Concept"
title: "Picking and Selection"
description: "Hardware-accelerated color coding and raycasting for UI topological mapping."
resource: "WebGPU Unleashed"
tags: ["WebGPU", "selection", "picking", "UI"]
timestamp: "2026-07-24"
---

# WebGPU Picking and Selection

To solve the Topological Naming Problem and link UI clicks to code (see [UI/UX & Topological Mapping](../agentic-architecture/ui-topological-mapping.md)), we must perform hardware-accelerated picking.

## Architectural Guidance

When a user clicks on a 3D feature, we need to map that pixel to an exact geometry ID. Instead of performing complex math (Ray Casting) on the CPU, we use **Color Picking**.

- **Color Coding**: Every distinct CAD feature (face, edge, vertex) is assigned a unique RGBA color ID. 
- **Off-screen Rendering**: During a pick operation, we render the scene to an off-screen `rgba8uint` texture using these IDs instead of lighting/materials.
- **Buffer Mapping**: We copy the exact pixel at the mouse coordinate from the texture to a GPU buffer, map it back to the CPU, and read the ID.

## SDLC Implementation

During the **Build phase**, when implementing selection mapping:
1. Create a `colorCodeBuffer` mapping instance IDs to colors.
2. Render to a `GPUTexture` with `usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC`.
3. Use `commandEncoder.copyTextureToBuffer()` to read just the 1x1 or 2x2 pixel area under the cursor.

### Implementation Reference

```javascript
// 1. Assign Color Codes
let colorCodes = new Uint8Array(instanceCount * 4);
for (let i = 0; i < instanceCount; ++i) {
    colorCodes.set([
        i & 0xff, 
        (i >> 8) & 0xff, 
        (i >> 16) & 0xff, 
        (i >> 24) & 0xff
    ], i * 4);
}
this.colorCodeBuffer = createGPUBuffer(device, colorCodes, GPUBufferUsage.VERTEX);

// 2. Off-screen Pick Routine
const renderPassDescColorCode = { colorAttachments: [colorCodeAttachment], depthStencilAttachment: depthAttachment };
passEncoder = commandEncoder.beginRenderPass(renderPassDescColorCode);
// ... bind pipelines ...
passEncoder.end();

// 3. Copy Pixel to CPU Buffer
commandEncoder.copyTextureToBuffer(
    { texture: colorCodeTexture, origin: { x: mouseX, y: mouseY } }, 
    { buffer: copiedBuffer, bytesPerRow: bufferWidth }, 
    { width: 2, height: 2 }
);
device.queue.submit([commandEncoder.finish()]);
await device.queue.onSubmittedWorkDone();

// 4. Read ID
await copiedBuffer.mapAsync(GPUMapMode.READ, 0, bufferWidth * 2);
const pickedData = new Uint8ClampedArray(copiedBuffer.getMappedRange());
const pickedID = pickedData[0]; // Resolves to instance/feature ID
copiedBuffer.unmap();
```
