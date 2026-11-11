## ADDED Requirements

### Requirement: Editable barrel length and bullet diameter
The app SHALL let the user edit the barrel length and the bullet diameter, with the same label,
help text, limits, and error handling as every other input.

#### Scenario: Barrel length changes the velocity estimate
- **WHEN** the user changes the barrel length from 16 to 20 inches on a load that has a published
  velocity, a stated test barrel, and a sourced per-inch figure
- **THEN** the estimated velocity is worked out again for 20 inches, and the explanation shows the
  new figure

#### Scenario: Measured velocity is not touched
- **WHEN** the user changes the barrel length on a load marked as a chronograph average
- **THEN** the velocity does not change, and the app says the measured value no longer matches the
  barrel and asks the user to confirm or re-enter it

#### Scenario: Diameter drives stability
- **WHEN** the user changes the bullet diameter
- **THEN** the stability factor and spin drift are solved again with the new diameter

### Requirement: Several rifles
The user SHALL be able to add, name, duplicate, select, and delete rifle profiles. Each profile
SHALL hold its own cartridge, barrel length, twist, twist direction, sight height, zero, scope,
selected load, custom loads, and last conditions. The app SHALL always have at least one rifle.

#### Scenario: Switch rifle
- **WHEN** the user selects another rifle
- **THEN** the inputs, results, dope table, scene, and load list all change to that rifle's values

#### Scenario: New rifle starts with setup
- **WHEN** the user adds a rifle
- **THEN** the four-step setup runs for it, starting with cartridge and barrel length

#### Scenario: Delete needs confirmation
- **WHEN** the user deletes a rifle
- **THEN** the app asks for confirmation and names the rifle, and refuses if it is the only one

### Requirement: Saved state moves to version 2
The app SHALL read version 1 saved state and convert it to version 2 without losing the rifle,
the selected load, custom loads, units, or last conditions.

#### Scenario: Existing user keeps everything
- **WHEN** a browser holding version 1 state opens the new app
- **THEN** one rifle exists with the same values as before, setup does not run again, and the first
  result shown equals the last result under version 1

#### Scenario: Damaged state
- **WHEN** saved state cannot be read as version 1 or version 2
- **THEN** the app starts with the default rifle and runs setup
