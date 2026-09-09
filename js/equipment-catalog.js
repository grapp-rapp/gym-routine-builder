// Exact product references extracted from the user-supplied equipment PDF.
// See assets/equipment/inventory.json and EQUIPMENT.md for provenance and gaps.
const EQUIPMENT_ASSETS = {
  "machine": {
    "src": "./assets/equipment/machine.svg",
    "kind": "drawing"
  },
  "dumbbell": {
    "src": "./assets/equipment/dumbbell.svg",
    "kind": "drawing"
  },
  "bench": {
    "src": "./assets/equipment/bench.svg",
    "kind": "drawing"
  },
  "bodyweight": {
    "src": "./assets/equipment/bodyweight.svg",
    "kind": "drawing"
  },
  "box": {
    "src": "./assets/equipment/box.svg",
    "kind": "drawing"
  },
  "cable": {
    "src": "./assets/equipment/cable.svg",
    "kind": "drawing"
  },
  "bike": {
    "src": "./assets/equipment/bike.svg",
    "kind": "drawing"
  },
  "treadmill": {
    "src": "./assets/equipment/treadmill.svg",
    "kind": "drawing"
  },
  "elliptical": {
    "src": "./assets/equipment/elliptical.svg",
    "kind": "drawing"
  },
  "rower": {
    "src": "./assets/equipment/rower.svg",
    "kind": "drawing"
  }
};

EQUIPMENT_ASSETS["treadmill"] = {"src":"./assets/equipment/treadmill.jpg","kind":"photo","model":"VISION T600E Treadmill","inventoryId":"treadmill","sourcePage":1};
EQUIPMENT_ASSETS["elliptical"] = {"src":"./assets/equipment/elliptical.jpg","kind":"photo","model":"VISION S600E Suspension Elliptical","inventoryId":"elliptical","sourcePage":1};
EQUIPMENT_ASSETS["legPress"] = {"src":"./assets/equipment/leg-press.jpg","kind":"photo","model":"VISION Keystone Leg Press / Calf Press","inventoryId":"leg-press","sourcePage":2};
EQUIPMENT_ASSETS["chestPress"] = {"src":"./assets/equipment/chest-press.jpg","kind":"photo","model":"VISION Keystone Converging Chest Press","inventoryId":"chest-press","sourcePage":1};
EQUIPMENT_ASSETS["row"] = {"src":"./assets/equipment/seated-row.jpg","kind":"photo","model":"VISION Keystone Diverging Seated Row","inventoryId":"seated-row","sourcePage":1};
EQUIPMENT_ASSETS["pulldown"] = {"src":"./assets/equipment/lat-pulldown.jpg","kind":"photo","model":"VISION Keystone Diverging Lat Pulldown","inventoryId":"lat-pulldown","sourcePage":1};
EQUIPMENT_ASSETS["pulldownWide"] = {"src":"./assets/equipment/lat-pulldown.jpg","kind":"photo","model":"VISION Keystone Diverging Lat Pulldown","inventoryId":"lat-pulldown","sourcePage":1};
EQUIPMENT_ASSETS["reverseFly"] = {"src":"./assets/equipment/pec-fly.jpg","kind":"photo","model":"VISION Keystone Pec Fly / Rear Delt","inventoryId":"pec-fly","sourcePage":1};
EQUIPMENT_ASSETS["shoulderPress"] = {"src":"./assets/equipment/shoulder-press.jpg","kind":"photo","model":"VISION Keystone Converging Shoulder Press","inventoryId":"shoulder-press","sourcePage":1};
EQUIPMENT_ASSETS["cable"] = {"src":"./assets/equipment/functional-trainer.jpg","kind":"photo","model":"VISION FT Functional Trainer","inventoryId":"functional-trainer","sourcePage":2};
EQUIPMENT_ASSETS["dumbbell"] = {"src":"./assets/equipment/dumbbells.jpg","kind":"photo","model":"ZIVA Performance Hexagon Dumbbell Set 2.5–25 kg","inventoryId":"dumbbells","sourcePage":3};
EQUIPMENT_ASSETS["bench"] = {"src":"./assets/equipment/adjustable-bench.jpg","kind":"photo","model":"VISION VF Adjustable Bench FW82","inventoryId":"adjustable-bench","sourcePage":2};
