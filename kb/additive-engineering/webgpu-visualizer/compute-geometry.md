---
type: "Concept"
title: "Compute Geometry Kernels"
description: "Offloading heavy geometry processing (like prefix sum and sorting) to compute shaders."
resource: "WebGPU Unleashed"
tags: ["WebGPU", "compute", "prefix-sum"]
timestamp: "2026-07-24"
---

# Compute Geometry Kernels

While classical engines (see [Geometry Kernel](../agentic-architecture/geometry-kernel.md)) rely on C++ and WebAssembly, modern WebGPU Compute Shaders allow us to perform parallel geometric algorithms directly on the GPU.

## Architectural Guidance

Algorithms like Marching Cubes, Bounding Volume Hierarchy (BVH) generation, and geometry culling require parallel primitives like the **Prefix Sum (Scan)** and Radix Sort.

- **Workgroups and Shared Memory**: Use `@workgroup_size` to process data in chunks. Load data into fast `var<workgroup>` shared memory.
- **Bank Conflicts**: When accessing shared memory, stride your indices (e.g., `idx + idx / bank_size`) to avoid memory bank conflicts and maximize throughput.
- **Multi-pass Synchronization**: Since workgroups cannot easily synchronize globally, break algorithms into multiple compute passes (e.g., Up-sweep, Block Sum Scan, Down-sweep).

## SDLC Implementation

During the **Build phase**, when optimizing geometry generation:
- Write WGSL compute shaders (`@compute`).
- Allocate `storage` buffers for input and output data.
- Chain multiple `dispatchWorkgroups()` calls.

### Implementation Reference (Prefix Sum Pass)

```wgsl
@binding(0) @group(0) var<storage, read> input :array<f32>;
@binding(1) @group(0) var<storage, read_write> output :array<f32>;

const bank_size:u32 = 32;
var<workgroup> temp: array<f32, 532>;

fn bank_conflict_free_idx(idx: u32) -> u32 {
    return idx + (idx / bank_size);
}

@compute @workgroup_size(256)
fn main(@builtin(local_invocation_id) LocalInvocationID: vec3<u32>) {
    var thid = LocalInvocationID.x;
    // Load into shared memory with padding
    temp[bank_conflict_free_idx(2*thid)] = input[2*thid];
    temp[bank_conflict_free_idx(2*thid+1)] = input[2*thid+1];
    
    workgroupBarrier();
    
    // Bottom-up sweep
    var offset = 1u;
    for (var d = 256u; d > 0u; d >>= 1u) {
        if (thid < d) {
            var ai = offset * (2*thid+1) - 1u;
            var bi = offset * (2*thid+2) - 1u;
            temp[bank_conflict_free_idx(bi)] += temp[bank_conflict_free_idx(ai)];
        }
        offset *= 2u;
        workgroupBarrier();
    }
    
    // ... down-sweep and write back to output ...
}
```
