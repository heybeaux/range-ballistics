## ADDED Requirements

### Requirement: Shot inputs
The app SHALL accept: target distance, wind speed, wind clock direction, temperature, station
pressure or altitude, humidity, shot angle, zero distance, sight height, muzzle velocity, bullet
weight, G1 BC, G7 BC, drag model, bullet length, twist rate, twist direction, and scope click value
with its unit (MOA or MIL). Each input SHALL have a plain-language label and a short help text.

#### Scenario: Result follows the inputs
- **WHEN** the user changes any input to a valid value
- **THEN** the results panel, dope table, and 3D scene update without a page reload

#### Scenario: Bad input
- **WHEN** the user clears a required field or types a value outside its limits
- **THEN** the field shows what is wrong, and the last good result is marked "out of date"

#### Scenario: Pressure or altitude
- **WHEN** the user picks "altitude" in place of "station pressure"
- **THEN** the app shows the pressure it will use and says it is a standard-atmosphere estimate

### Requirement: Imperial and metric
The user SHALL be able to switch between imperial and metric. Distance (yards or metres), velocity,
temperature, pressure, sight height, wind speed, and energy SHALL all follow the choice. Switching
SHALL convert the entered values and SHALL NOT change the physical shot.

#### Scenario: Switch keeps the shot
- **WHEN** the user switches from imperial to metric and back
- **THEN** every input shows its starting value and the correction in MIL is unchanged

### Requirement: Results panel
For the chosen distance the app SHALL show: elevation correction and windage correction, each in
MOA, MIL, inches, and centimetres, each with a direction word (up, left, right); scope clicks for
each, rounded to whole clicks, next to the unrounded value; time of flight; remaining velocity;
remaining energy; spin drift and stability factor, or "not available"; and the transonic and
subsonic ranges, or "stays supersonic to <distance>". MOA SHALL be true MOA (1.047 in at 100 yd).

#### Scenario: Clicks follow the click value
- **WHEN** the elevation correction is 3.2 MIL and the click value is 0.1 MIL
- **THEN** the panel shows 32 clicks up

#### Scenario: Target is past the transonic range
- **WHEN** the target distance is beyond the Mach 1.2 range
- **THEN** the panel warns that predictions past that range are less reliable

### Requirement: Dope table
The app SHALL build a table from a start distance to an end distance at a set step. Each row SHALL
show distance, elevation (in the user's scope unit and in clicks), windage for the entered wind,
time of flight, and velocity. The table SHALL be exportable as CSV and printable.

#### Scenario: Table rows
- **WHEN** the range is 100 to 600 at a step of 50
- **THEN** the table has 11 rows

#### Scenario: CSV export
- **WHEN** the user selects "Export CSV"
- **THEN** a CSV file downloads with a header row, one row per distance, and comment lines that give
  the load, velocity (with "estimated" when it is), zero, atmosphere, and the planning-aid notice

#### Scenario: Print card
- **WHEN** the user prints the table
- **THEN** the printout contains only the card (no 3D scene or input forms), in a width that fits a
  rifle stock, with the load, zero, conditions, date, and the planning-aid notice

### Requirement: First-run setup
On first use the app SHALL guide the user through four steps: confirm the rifle, pick a load, set
the muzzle velocity, and set the zero. Each step SHALL explain in plain language what the value is
and where to find it. The user SHALL be able to skip setup and run it again later.

#### Scenario: New user gets a result
- **WHEN** a person opens the app with empty browser storage and accepts the defaults in each step
- **THEN** they reach a solved shot with the 3D scene and results visible

#### Scenario: Setup does not repeat
- **WHEN** a user who finished setup reloads the page
- **THEN** the planner opens with their saved rifle, load, and conditions

### Requirement: Planning-aid notice
The app SHALL state, in the results panel and on every export and printout, that it is a planning
aid and that real impacts and the shooter's own recorded dope are the authority.

#### Scenario: Notice is always visible
- **WHEN** any result is on screen
- **THEN** the notice is visible without scrolling the results panel

### Requirement: Saved state
The app SHALL save the rifle, loads, units, and last conditions in browser local storage. It SHALL
NOT send any data over the network.

#### Scenario: Works offline
- **WHEN** the built app is opened with the network off
- **THEN** every feature works
