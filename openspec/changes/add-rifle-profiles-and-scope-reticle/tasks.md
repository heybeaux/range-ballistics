## 1. Contracts and data (Scout)

- [x] 1.1 State version 2 types and the migration contract
- [x] 1.2 `cartridges.json` and `cartridgeId` on loads, generated; data tests
- [x] 1.3 `scopes.json` with the Venom from Vortex sources; data tests
- [x] 1.4 Reference cases for each added cartridge
- [x] 1.5 RA4 drag table (generated, checksum) and `'RA4'` in the solver contract

## 2. Rifle profiles (Qwen writes, Scout verifies)

- [x] 2.1 Barrel length and bullet diameter fields
- [x] 2.2 State version 2 storage and migration, with tests on a version 1 snapshot
- [x] 2.3 Rifle picker: add, rename, duplicate, select, delete
- [x] 2.4 Setup for a new rifle, starting with cartridge and barrel

## 3. Cartridge library (Scout sources, Qwen writes)

- [x] 3.1 Load picker filtered by cartridge
- [x] 3.2 Per-cartridge velocity estimate and the "no correction" wording
- [x] 3.3 Source and verify loads for .22 LR, .223 Remington, and 5.56x45 NATO
- [x] 3.4 Subsonic and transonic wording and scene colour; .22 LR default distances
- [x] 3.5 5.56 NATO in a .223 chamber: sourced safety note

## 4. Scope (Qwen writes, Scout verifies)

- [x] 4.1 Scope fields and scope picker
- [x] 4.2 Field of view from scope and magnification; magnification control
- [x] 4.3 Reticle shapes for EBR-7C MRAD and the generic crosshair, with subtension tests
- [x] 4.4 Reticle drawing in the scope view, first and second focal plane
- [x] 4.5 Dial-limit warning in results and dope table

## 5. Acceptance (Scout)

- [x] 5.1 Version 1 browser profile opens with nothing lost
- [ ] 5.2 Hold read off the EBR-7C matches the panel within 0.05 MIL at three distances (checked by eye at 600 yd only: impact sits just above the 5 MRAD row, 1.5 left; not measured to 0.05 MIL, and not at three distances)
- [x] 5.3 Screenshots at 5x, 15x, 25x
- [x] 5.4 README and screenshots updated

## Not done, or done differently from the spec

- [ ] Measured velocity after a barrel change: the velocity is left alone, as specified, but the
      app does not ask the user to confirm or re-enter it. It shows a standing note instead.
- [ ] Second-focal-plane scopes and the generic MOA reticle are covered by unit tests only; they
      were not looked at in the browser.
- [ ] Delete-rifle and duplicate-rifle were not exercised in the browser (add and switch were).
- [ ] .223 and 5.56 barrel-length correction: none is applied. Beaux was asked and did not
      choose, so the lead's recommendation stands until he says otherwise.
