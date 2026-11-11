## ADDED Requirements

### Requirement: Scope profile
Each rifle SHALL have a scope profile: name, magnification range, focal plane (first or second),
field of view at lowest and highest magnification, adjustment unit, click value, maximum elevation
and windage travel, and reticle. The app SHALL ship the Vortex Venom 5-25x56 FFP with the EBR-7C
MRAD reticle, with each value carrying its Vortex source, and a "generic scope" the user can edit.

#### Scenario: Pick the shipped scope
- **WHEN** the user picks the Venom 5-25x56 FFP
- **THEN** the click value is 0.1 MRAD, the unit is MIL, the magnification range is 5 to 25, and
  each value shows a link to its Vortex page

#### Scenario: Scope not in the list
- **WHEN** the user picks "generic scope"
- **THEN** they can type the magnification range, field of view, click value, unit, and travel, and
  the scope view uses the generic MIL or MOA crosshair

### Requirement: Scope view matches the scope
The scope view SHALL have a magnification control limited to the scope's range. The field of view
SHALL follow the scope's published field of view, scaled by magnification. The reticle SHALL be the
scope's reticle.

#### Scenario: Field of view at the ends of the range
- **WHEN** the Venom is selected and magnification is 5
- **THEN** the view across the lens covers 21.2 ft at 100 yd (70.7 MRAD), and at 25 it covers
  4.7 ft (15.7 MRAD)

#### Scenario: First focal plane
- **WHEN** a first-focal-plane scope is zoomed
- **THEN** the reticle grows and shrinks with the target, and one MRAD on the reticle covers one
  MRAD of the scene at every magnification

#### Scenario: Second focal plane
- **WHEN** a second-focal-plane scope is zoomed away from its true-subtension magnification
- **THEN** the reticle stays the same size on screen and the view says the hash values are only
  true at the stated magnification

#### Scenario: Hold is readable
- **WHEN** the correction is not dialled and the shot needs 4.75 MIL up and 1.5 MIL right
- **THEN** the impact mark sits on the reticle at 4.75 below centre and 1.5 left of centre, within
  0.05 MIL

### Requirement: EBR-7C MRAD reticle
The app SHALL draw the EBR-7C MRAD reticle from Vortex's published subtensions: 0.03 line, 0.04
centre dot, 0.5 / 0.3 / 0.2 hash widths, 0.2 and 0.1 tick spacings, 0.06 and 0.09 wind dots, and
the thick post from 11. The hash and dot positions, which Vortex publishes only as a drawing marked
"for representation only", SHALL be drawn as measured from that drawing, and the view SHALL say so.

#### Scenario: Wind dots
- **WHEN** the EBR-7C is drawn
- **THEN** each whole MRAD below centre has a row of dots every 0.2 MRAD, starting 0.4 from the
  centre line, with a larger dot on each whole MRAD

#### Scenario: Honest label
- **WHEN** the EBR-7C is on screen
- **THEN** a note says the layout is drawn from Vortex's subtension diagram and links to it

### Requirement: Dial limit
The app SHALL warn when a correction is more than the scope can dial from its zero. The available
elevation SHALL be editable, because it depends on the mount and on where the zero sits.

#### Scenario: Past the turret
- **WHEN** the elevation correction is larger than the available elevation
- **THEN** the results panel says the scope cannot dial it, shows how much is left to hold, and the
  dope table marks those rows
