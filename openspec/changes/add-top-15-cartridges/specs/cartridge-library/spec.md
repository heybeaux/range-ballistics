## MODIFIED Requirements

### Requirement: Shipped cartridges
The library SHALL ship loads for .22 Long Rifle, .223 Remington, 5.56x45 NATO, .308 Winchester,
6.5 Creedmoor, 7mm PRC, 6.5 PRC, .30-06 Springfield, .300 Winchester Magnum, .270 Winchester,
.450 Bushmaster, .243 Winchester, 7mm Remington Magnum, 7mm-08 Remington, and .300 PRC.
.223 Remington and 5.56x45 NATO SHALL remain separate cartridges with separate loads. Each
cartridge added after the first four SHALL ship with at least 3 library loads.

#### Scenario: Fifteen cartridges offered
- **WHEN** the user adds a rifle
- **THEN** the cartridge list offers all fifteen cartridges and "other"

#### Scenario: Sourcing applies to every new cartridge
- **WHEN** the data test runs over a newly added cartridge
- **THEN** every non-null BC, bullet length, and velocity has a manufacturer source URL and a
  read date, and the cartridge's bullet diameter has a SAAMI source

#### Scenario: Short-range cartridge keeps its caveat
- **WHEN** the user selects .450 Bushmaster
- **THEN** the app shows its note that published data covers short range only
