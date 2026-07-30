---
type: "Reference"
title: "Bambu Lab 3MF File Specification"
description: "Internal ZIP structure, required XML namespaces, and Bambu-specific extension fields for generating .3mf project files compatible with Bambu Studio."
resource: "https://github.com/3MFConsortium/spec_core/blob/master/3MF%20Core%20Specification.md"
tags: ["3mf", "bambu", "file-format", "export", "bambu-studio"]
timestamp: "2026-07-30"
---

# Bambu Lab 3MF File Specification

A `.3mf` file is a ZIP archive with a specific internal directory layout. Bambu Studio extends the base [3MF Core Specification v1.3](https://github.com/3MFConsortium/spec_core) with proprietary XML namespaces for plate layout, print settings, and support configuration.

## ZIP Archive Layout

```
build.3mf (ZIP)
├── [Content_Types].xml          # MIME type declarations
├── _rels/
│   └── .rels                    # Root relationship file
├── 3D/
│   ├── 3dmodel.model            # Geometry + materials (core spec)
│   └── _rels/
│       └── 3dmodel.model.rels   # Relationships for 3dmodel.model
├── Metadata/
│   ├── model_settings.config    # Bambu per-object print settings (XML)
│   ├── project_settings.config  # Bambu global filament/process settings (XML)
│   ├── slice_info.config        # Slice metadata written post-slice
│   └── custom_gcode_per_layer.xml  # Optional layer-change G-code
└── Thumbnail/
    └── thumbnail.png            # 256×256 px preview image (optional but recommended)
```

## [Content_Types].xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
  <Override PartName="/Metadata/model_settings.config"
            ContentType="application/xml"/>
  <Override PartName="/Metadata/project_settings.config"
            ContentType="application/xml"/>
  <Override PartName="/Thumbnail/thumbnail.png"
            ContentType="image/png"/>
</Types>
```

## _rels/.rels

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"
                Target="/3D/3dmodel.model"/>
  <Relationship Id="rel1" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/thumbnail"
                Target="/Thumbnail/thumbnail.png"/>
</Relationships>
```

## 3D/3dmodel.model — Core Geometry

The core `3dmodel.model` follows the 3MF Core Specification. Key requirements:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US"
       xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02"
       xmlns:p="http://schemas.microsoft.com/3dmanufacturing/production/2015/06">
  <resources>
    <object id="1" type="model" name="my_part" p:UUID="...">
      <mesh>
        <vertices>
          <vertex x="0" y="0" z="0"/>
          <!-- ... -->
        </vertices>
        <triangles>
          <triangle v1="0" v2="1" v3="2"/>
          <!-- ... -->
        </triangles>
      </mesh>
    </object>
  </resources>
  <build>
    <item objectid="1" transform="1 0 0 0 1 0 0 0 1 0 0 0"/>
  </build>
</model>
```

**Units**: Always `millimeter`. Bambu Studio will reject files with `inch` units.

**Transform**: A 4×3 column-major matrix `[r00 r10 r20 r01 r11 r21 r02 r12 r22 tx ty tz]`. Identity = `1 0 0 0 1 0 0 0 1 0 0 0`.

**Mesh requirements**: Same as watertight STL — every edge shared by exactly two triangles, consistent outward normals, no self-intersections.

## Bambu Extension: Metadata/model_settings.config

This XML file tells Bambu Studio per-object print settings (supports, modifier meshes, process overrides):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<config>
  <object id="1">
    <metadata key="name" value="my_part"/>
    <metadata key="extruder" value="1"/>
    <!-- Support settings -->
    <metadata key="support" value="0"/>
    <!-- Layer height override (mm) -->
    <metadata key="layer_height" value="0.2"/>
  </object>
</config>
```

Valid `extruder` values: `1`–`4` for AMS slots; `0` = inherit from global.

## Bambu Extension: Metadata/project_settings.config

Global filament profiles and process settings. Structure mirrors Bambu Studio's `.json` export:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<config>
  <plate id="1">
    <metadata key="name" value="Plate 1"/>
    <!-- List of object IDs on this plate -->
    <objects>
      <object id="1"/>
    </objects>
  </plate>
  <filament id="1">
    <metadata key="type" value="PLA"/>
    <metadata key="brand" value="Bambu"/>
    <metadata key="color" value="#FFFFFF"/>
  </filament>
</config>
```

## Generating a .3mf Programmatically

Use Python's `zipfile` stdlib module — no third-party package required:

```python
import zipfile, pathlib

def write_3mf(output_path: str, model_xml: str, settings_xml: str | None = None):
    content_types = '...'   # see above
    rels = '...'            # see above
    with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as z:
        z.writestr('[Content_Types].xml', content_types)
        z.writestr('_rels/.rels', rels)
        z.writestr('3D/3dmodel.model', model_xml)
        if settings_xml:
            z.writestr('Metadata/model_settings.config', settings_xml)
```

## Generating a Bambu build.3mf from STL Parts

Preferred workflow (no Bambu SDK required):

1. Export each part as binary STL via `openscad -o stl/<part>.stl`.
2. Convert STL → 3MF mesh XML using `trimesh` or `numpy-stl`.
3. Assemble the ZIP with the above structure.
4. Open in Bambu Studio to verify plate layout and per-object settings.

For simple single-plate projects, Bambu Studio's **Import** → **Import 3D Files** → select all STLs, then **File → Export → Export plate as 3MF** is faster than handcrafting the XML.

## Compatibility Notes

- Bambu Studio reads the 3MF spec plus its own extensions.
- PrusaSlicer and OrcaSlicer also read standard 3MF core without Bambu extensions.
- Cura reads standard 3MF but ignores Bambu `model_settings.config`.
- Always open the generated `.3mf` in Bambu Studio and visually verify plate layout before sending to printer.

## Related

- [`scad-syntax-gotchas.md`](scad-syntax-gotchas.md) — export commands from OpenSCAD to STL/DXF.
- [`../../../kb/platforms/openscad/materials.md`](../../../kb/platforms/openscad/materials.md) — filament type guidance for setting metadata.
