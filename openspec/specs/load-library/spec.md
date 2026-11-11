# load-library Specification

## Purpose
TBD - created by archiving change build-ballistics-visualizer. Update Purpose after archive.
## Requirements
### Requirement: Rifle profile
The app SHALL ship one rifle profile: Tikka T3x CTR, .308 Win, 16" barrel, 1:11" right-hand twist.
Every field SHALL be editable. The twist value SHALL show its source. Tikka's published figures
disagree (1:11" on the 2014 T3 CTR sheet, 1:10" on the current T3x CTR page, and no factory 16"
barrel is listed), so the app SHALL mark the default twist as "unconfirmed" and explain how to
measure it with a cleaning rod, until the user confirms a value.

#### Scenario: Twist is marked unconfirmed
- **WHEN** the user has not confirmed the twist
- **THEN** the twist field shows "unconfirmed", both published figures with their sources, and the
  steps to measure it

#### Scenario: Twist is editable
- **WHEN** the user changes twist from 11 to 10
- **THEN** stability and spin drift are solved again with the new value

### Requirement: Sourced load library
The app SHALL ship a small library of .308 match bullets and factory match loads in
`src/data/loads.json`. Each BC, bullet length, and muzzle velocity SHALL carry the URL of the
manufacturer page it came from and the date it was read. A value the manufacturer does not publish
SHALL be `null`. No value SHALL be estimated or taken from memory.

#### Scenario: Source shown next to the value
- **WHEN** the user selects a library load
- **THEN** each BC shows a "source" link to the manufacturer page

#### Scenario: Blank value stays blank
- **WHEN** a library bullet has no published G7 BC
- **THEN** the G7 field is empty, the G7 option says "not published", and the app does not solve
  with G7 until the user types a value

#### Scenario: Library data check
- **WHEN** the data test runs
- **THEN** every non-null BC, length, and velocity in `loads.json` has a source URL and a date

### Requirement: Custom loads
The user SHALL be able to type any bullet weight, diameter, length, G1 BC, and G7 BC, and save it
as a custom load. A value the user typed SHALL be labelled "your value".

#### Scenario: Save a handload
- **WHEN** the user enters a custom load and saves it
- **THEN** it appears in the load list after the page is reloaded

### Requirement: Muzzle velocity is an estimate until measured
Each library load SHALL show the manufacturer's published velocity with its test-barrel length. The
default velocity for the 16" barrel SHALL be labelled "estimate, not measured in your rifle", and
SHALL show how it was worked out. The app SHALL ask the user to replace it with a chronograph
average, and SHALL keep a visible "estimated velocity" mark on results and printouts until they do.

#### Scenario: Estimate is marked
- **WHEN** a library load is selected and no chronograph value is entered
- **THEN** the velocity field, the results panel, and the printed dope table each show "estimated
  velocity"

#### Scenario: Chronograph value replaces the estimate
- **WHEN** the user enters a velocity and marks it as a chronograph average
- **THEN** the "estimated velocity" marks are removed and the value is saved for that load

