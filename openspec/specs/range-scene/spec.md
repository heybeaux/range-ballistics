# range-scene Specification

## Purpose
TBD - created by archiving change build-ballistics-visualizer. Update Purpose after archive.
## Requirements
### Requirement: Range scene
The app SHALL show a 3D range: ground, a firing line with a shooting position, distance markers at
regular intervals with readable labels in the user's distance unit, and a target at the chosen
distance. The user SHALL be able to pick a steel plate or a paper target.

#### Scenario: Target follows the distance
- **WHEN** the user changes the distance from 300 to 600
- **THEN** the target moves to 600 and markers cover the full distance

### Requirement: Wind flags
The scene SHALL show wind flags along the range. Each flag SHALL point downwind. The flag SHALL
hang limp at 0 wind and lift toward level as the wind speed rises to 20 mph or more.

#### Scenario: Direction
- **WHEN** the wind is from 3 o'clock
- **THEN** the flags stream toward the shooter's left

#### Scenario: Speed
- **WHEN** the wind speed changes from 2 mph to 15 mph
- **THEN** the flags lift visibly higher and move faster

### Requirement: Trajectory path
The scene SHALL draw the solved bullet path as a 3D line from muzzle to target, and SHALL draw the
line of sight. The path SHALL come from the solver output and SHALL NOT be computed again in the
scene code. The path colour SHALL change where the bullet goes transonic and subsonic.

#### Scenario: True scale by default
- **WHEN** the scene first loads
- **THEN** drop and drift are drawn at true scale

#### Scenario: Exaggeration is labelled
- **WHEN** the user raises the drop/drift exaggeration above 1×
- **THEN** the scene shows a label with the factor, and the numbers in the results panel do not change

### Requirement: Animated round
The scene SHALL animate a round along the path in step with time of flight. The user SHALL be able
to play, pause, replay, pick a playback speed, and scrub a timeline. While scrubbing, the scene
SHALL show the time, distance, velocity, and drop at that point.

#### Scenario: Scrub to a time
- **WHEN** the user drags the timeline to the half-way time
- **THEN** the round sits at the position the solver gives for that time, and the readout matches

#### Scenario: Replay after a change
- **WHEN** the user changes an input while the animation is part-way
- **THEN** the path redraws and the animation restarts from the muzzle

### Requirement: Camera
The user SHALL be able to orbit, pan, and zoom. The scene SHALL offer presets: shooter's view (from
behind the rifle along the line of sight), side view (shows drop), top-down view (shows drift), and
a reset.

#### Scenario: Presets
- **WHEN** the user selects "side view"
- **THEN** the camera moves to look across the range with the whole path in frame

### Requirement: Runs smoothly
The scene SHALL hold 50 frames per second or more on Beaux's Mac at a 1000-yard distance.

#### Scenario: Frame rate
- **WHEN** the animation plays at 1000 yards
- **THEN** the measured frame rate is 50 or more

