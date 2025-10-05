# Top-Down Action RPG — Engine Seed


### upcoming
allow "new map" in selecting edge where to go
indicate issue when a map is a neighbor to another map twice (will break atlas, hence "teleport" would be a more fitting name probably)









## Goals
- Deterministic, data-driven core with a tiny level spec.
- Simple physics (AABB, axis-separated) that scales from 1×1 to N×N actors.
- Tool-first workflow: editor produces spec, engine consumes spec.

## Architecture (current)
- **engine/** — frame loop, input
- **world/** — level I/O, atlas (multi-map)
- **physics/** — collision & movement
- **actors/** — player & behaviors
- **view/** — renderer (HTML5 canvas)

### Dependency direction (high-level)
```mermaid
flowchart LR
  subgraph Engine
    Loop[engine/loop] --> Update[actors/*]
    Input[engine/input] --> Update
  end

  subgraph Domain
    Level[world/level] --> Physics[physics/collision]
    Update --> Physics
    Update --> Level
  end

  subgraph View
    Render[view/render] -->|reads| Level
    Render -->|reads| Update
  end

  Main[main.js] --> Loop
  Main --> Input
  Main --> Level
  Main --> Update
  Main --> Render


## Edge exits (v0.3)

**Format:** In each level TOML, add `[exits]` with any of `left|right|top|bottom = "<target UUID>"`.

**Runtime rule:** If the player is touching an edge **and** presses toward that edge:
- If an exit is defined → switch to the target map and place the player just inside the opposite edge, preserving their orthogonal ratio.
- If not defined → the edge acts as a wall (OOB is solid).

**Editor owns validation:** Spawn `{x,y,w,h}` must be clear; engine only warns.
