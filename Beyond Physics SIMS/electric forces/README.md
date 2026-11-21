# Electric Force Lab

Open `Electric Force Lab.html` directly in a browser, or use the Electrostatics card in the main catalog. No build, internet access, or dependencies are required.

The default scene reproduces the supplied 3–4–5 m triangle: q₁ = +6 nC, q₂ = −2 nC, q₃ = +5 nC. The electric force on q₃ is (3.01083, 6.47104) nN, magnitude 7.13719 nN at 65.0485° counterclockwise from +x. Each particle has an adjustable inertial mass, initially 10 µg.

- Drag particles or use their coordinate inputs. A focused particle also supports arrow keys (Shift for larger steps).
- Select a particle to inspect its two pair forces and resultant. In **Move selected only** mode, selecting another charge automatically frees that charge and holds the other two. **All free** lets all three move. The line and all-positive presets start in All free mode. The reference triangle, balanced, and dipole presets start with only the selected charge free.
- The three Held/Free buttons above the workspace toggle individual constraints and enter a custom configuration. Selecting a charge in this custom configuration only inspects it. P toggles the selected pin; Space plays or pauses from the workspace.
- Playback starts at 1×. The workspace displays the selected charge’s speed and displacement so gradual initial acceleration is visible. Each charge carries a Held/Free label. Motion trails include a launch-position marker.
- Parameter, position, and pin edits start a new experiment from rest. Rewind restores your latest launch arrangement; Reset restores the reference question. View options are retained.
- Force vectors use one common linear scale, automatically reduced when necessary. Velocity arrows use their own displayed scale. Field arrows show direction; the movable field probe reports magnitude and direction.

`coulomb-physics.js` computes unsoftened Coulomb forces in SI units and integrates motion with adaptive velocity Verlet. Pins provide an external constraint, not an electrostatic force cancellation. There is no damping, gravity, or wall force. The camera fits particles that approach the view edges. At a separation below 0.18 m, the simulation pauses at its last valid state rather than inventing collision behavior for ideal point charges.

`electric-force-lab.js` handles the canvas, controls, head-to-tail vector diagram, bounded trails, field probe, and PNG export. The page supports desktop and mobile layouts and pauses when hidden.

Run the physics checks from the simulation suite root:

```sh
node --test "electric forces/physics.test.cjs"
```
