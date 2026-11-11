## 1. Contracts and data (Scout)

- [ ] 1.1 State version 2 types and the migration contract
- [ ] 1.2 `cartridges.json` and `cartridgeId` on loads, generated; data tests
- [ ] 1.3 `scopes.json` with the Venom from Vortex sources; data tests
- [ ] 1.4 Reference cases for each added cartridge

## 2. Rifle profiles (Qwen writes, Scout verifies)

- [ ] 2.1 Barrel length and bullet diameter fields
- [ ] 2.2 State version 2 storage and migration, with tests on a version 1 snapshot
- [ ] 2.3 Rifle picker: add, rename, duplicate, select, delete
- [ ] 2.4 Setup for a new rifle, starting with cartridge and barrel

## 3. Cartridge library (Scout sources, Qwen writes)

- [ ] 3.1 Load picker filtered by cartridge
- [ ] 3.2 Per-cartridge velocity estimate and the "no correction" wording
- [ ] 3.3 Source and verify loads for .22 LR, .223 Remington, and 5.56x45 NATO
- [ ] 3.4 Subsonic and transonic wording and scene colour; .22 LR default distances
- [ ] 3.5 5.56 NATO in a .223 chamber: sourced safety note

## 4. Scope (Qwen writes, Scout verifies)

- [ ] 4.1 Scope fields and scope picker
- [ ] 4.2 Field of view from scope and magnification; magnification control
- [ ] 4.3 Reticle shapes for EBR-7C MRAD and the generic crosshair, with subtension tests
- [ ] 4.4 Reticle drawing in the scope view, first and second focal plane
- [ ] 4.5 Dial-limit warning in results and dope table

## 5. Acceptance (Scout)

- [ ] 5.1 Version 1 browser profile opens with nothing lost
- [ ] 5.2 Hold read off the EBR-7C matches the panel within 0.05 MIL at three distances
- [ ] 5.3 Screenshots at 5x, 15x, 25x
- [ ] 5.4 README and screenshots updated
