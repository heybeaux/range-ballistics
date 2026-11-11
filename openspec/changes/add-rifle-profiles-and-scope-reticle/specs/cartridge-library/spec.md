## ADDED Requirements

### Requirement: Loads belong to a cartridge
Every library load SHALL name its cartridge. The load picker SHALL list the loads for the selected
rifle's cartridge, then the user's own loads for that rifle. A cartridge SHALL carry its name, its
bullet diameter, and its source.

#### Scenario: Picker follows the rifle
- **WHEN** the selected rifle is chambered in 6.5 Creedmoor
- **THEN** the load picker shows only 6.5 Creedmoor loads and that rifle's own loads

#### Scenario: Cartridge with no library loads
- **WHEN** the user picks a cartridge that has no library loads, or types their own cartridge name
- **THEN** the app asks for bullet weight, diameter, BC, and muzzle velocity, and solves once they
  are entered

### Requirement: Sourcing rule for every cartridge
Each added cartridge SHALL follow the .308 rule: every BC, bullet length, and muzzle velocity comes
from a manufacturer page, carries its URL and read date, is checked a second time against the page
text, and is `null` when the manufacturer does not publish it.

#### Scenario: Data check covers all cartridges
- **WHEN** the data test runs
- **THEN** every non-null value in every cartridge has a source URL and a date, and every load's
  diameter equals its cartridge's diameter

### Requirement: Velocity estimate per cartridge
The barrel-length velocity figure SHALL be stored per cartridge with its source. A cartridge with
no sourced figure SHALL have no estimate: the app shows the published velocity, says no correction
was made, and asks for a chronograph average.

#### Scenario: No figure, no estimate
- **WHEN** a load is selected for a cartridge with no sourced per-inch figure and the rifle's
  barrel is shorter than the test barrel
- **THEN** the velocity shown is the published figure, marked "no barrel-length correction", and
  the .308 figure is not applied

### Requirement: Reference check per cartridge
For each cartridge in the library, the reference set SHALL include at least two loads compared
with the independent solver at ten distances, to the existing tolerance (0.05 MIL or 1%).

#### Scenario: New cartridge is checked
- **WHEN** a cartridge is added to the library
- **THEN** the test run includes its reference cases and they pass

### Requirement: First-pass cartridges
The library SHALL ship loads for .22 Long Rifle, .223 Remington, 5.56x45 NATO, and .308
Winchester. .223 Remington and 5.56x45 NATO SHALL be separate cartridges with separate loads.

#### Scenario: Four cartridges offered
- **WHEN** the user adds a rifle
- **THEN** the cartridge list offers .22 LR, .223 Remington, 5.56x45 NATO, .308 Winchester, and
  "other"

#### Scenario: 5.56 in a .223 chamber
- **WHEN** the rifle's cartridge is .223 Remington, or the user looks at 5.56x45 NATO loads
- **THEN** the app shows the published safety statement about firing 5.56 NATO ammunition in a
  .223 Remington chamber, in the source's own words, with a link to the source

### Requirement: Subsonic and transonic loads
A load that leaves the muzzle below Mach 1.2 SHALL be solved and shown without the "target is past
the transonic range" warning that applies to supersonic loads. The results SHALL say plainly which
case applies.

#### Scenario: Subsonic match load
- **WHEN** the load's muzzle velocity is below the speed of sound in the entered air
- **THEN** the results say "subsonic from the muzzle", show no transonic warning, and the scene
  draws the whole path in the subsonic colour

#### Scenario: High-velocity rimfire
- **WHEN** the load leaves the muzzle between Mach 1.0 and Mach 1.2
- **THEN** the results say the bullet starts in the transonic range and give the distance where it
  goes subsonic

#### Scenario: Short-range defaults
- **WHEN** the selected rifle is chambered in .22 LR and has no saved conditions
- **THEN** the default target is 50 yd, the default zero is 50 yd, and the dope table runs from 25
  to 200 yd in 25 yd steps
