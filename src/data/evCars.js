// Popular Indian EVs with real-world range, battery capacity, and connector type
// range_km = realistic highway range (not claimed ARAI range)

export const EV_CARS = [
  // Tata Motors
  { id: 'nexon-ev-max',     name: 'Tata Nexon EV Max',        range_km: 300, battery_kwh: 40.5, connector: 'CCS2' },
  { id: 'nexon-ev',         name: 'Tata Nexon EV (Standard)', range_km: 250, battery_kwh: 30.2, connector: 'CCS2' },
  { id: 'tiago-ev',         name: 'Tata Tiago EV',            range_km: 200, battery_kwh: 24.0, connector: 'CCS2' },
  { id: 'tigor-ev',         name: 'Tata Tigor EV',            range_km: 220, battery_kwh: 26.0, connector: 'CCS2' },
  { id: 'punch-ev',         name: 'Tata Punch EV',            range_km: 280, battery_kwh: 35.0, connector: 'CCS2' },
  { id: 'curvv-ev',         name: 'Tata Curvv EV',            range_km: 420, battery_kwh: 55.0, connector: 'CCS2' },

  // MG Motor
  { id: 'zs-ev',            name: 'MG ZS EV',                 range_km: 340, battery_kwh: 50.3, connector: 'CCS2' },
  { id: 'comet-ev',         name: 'MG Comet EV',              range_km: 180, battery_kwh: 17.3, connector: 'CCS2' },
  { id: 'windsor-ev',       name: 'MG Windsor EV',            range_km: 320, battery_kwh: 38.0, connector: 'CCS2' },

  // Hyundai / Kia
  { id: 'ioniq5',           name: 'Hyundai Ioniq 5',          range_km: 480, battery_kwh: 72.6, connector: 'CCS2' },
  { id: 'kona-ev',          name: 'Hyundai Kona Electric',    range_km: 350, battery_kwh: 39.2, connector: 'CCS2' },
  { id: 'ev6',              name: 'Kia EV6',                  range_km: 500, battery_kwh: 77.4, connector: 'CCS2' },
  { id: 'ev9',              name: 'Kia EV9',                  range_km: 480, battery_kwh: 99.8, connector: 'CCS2' },

  // BYD
  { id: 'byd-atto3',        name: 'BYD Atto 3',               range_km: 420, battery_kwh: 60.5, connector: 'CCS2' },
  { id: 'byd-seal',         name: 'BYD Seal',                 range_km: 500, battery_kwh: 82.5, connector: 'CCS2' },
  { id: 'byd-e6',           name: 'BYD e6',                   range_km: 415, battery_kwh: 71.7, connector: 'CCS2' },

  // Volvo / BMW / Mercedes
  { id: 'volvo-xc40',       name: 'Volvo XC40 Recharge',      range_km: 400, battery_kwh: 78.0, connector: 'CCS2' },
  { id: 'bmw-i4',           name: 'BMW i4',                   range_km: 510, battery_kwh: 83.9, connector: 'CCS2' },
  { id: 'bmw-ix',           name: 'BMW iX',                   range_km: 600, battery_kwh: 111.5, connector: 'CCS2' },
  { id: 'eqb',              name: 'Mercedes EQB',             range_km: 419, battery_kwh: 66.5, connector: 'CCS2' },
  { id: 'eqs',              name: 'Mercedes EQS',             range_km: 770, battery_kwh: 107.8, connector: 'CCS2' },

  // Audi
  { id: 'etron',            name: 'Audi e-tron',              range_km: 360, battery_kwh: 95.0, connector: 'CCS2' },
  { id: 'etron-gt',         name: 'Audi e-tron GT',           range_km: 450, battery_kwh: 93.4, connector: 'CCS2' },

  // Others
  { id: 'mini-electric',    name: 'Mini Electric',            range_km: 230, battery_kwh: 32.6, connector: 'CCS2' },
  { id: 'ola-s1-pro',       name: 'Ola S1 Pro (Scooter)',     range_km: 135, battery_kwh: 3.97, connector: 'Type 2' },
];

// Group by brand for the dropdown
export const EV_CARS_BY_BRAND = [
  { brand: 'Tata Motors',   cars: EV_CARS.filter(c => c.id.startsWith('nexon') || c.id.startsWith('tiago') || c.id.startsWith('tigor') || c.id.startsWith('punch') || c.id.startsWith('curvv')) },
  { brand: 'MG Motor',      cars: EV_CARS.filter(c => c.id.startsWith('zs') || c.id.startsWith('comet') || c.id.startsWith('windsor')) },
  { brand: 'Hyundai / Kia', cars: EV_CARS.filter(c => ['ioniq5','kona-ev','ev6','ev9'].includes(c.id)) },
  { brand: 'BYD',           cars: EV_CARS.filter(c => c.id.startsWith('byd')) },
  { brand: 'Volvo / BMW / Mercedes', cars: EV_CARS.filter(c => ['volvo-xc40','bmw-i4','bmw-ix','eqb','eqs'].includes(c.id)) },
  { brand: 'Audi',          cars: EV_CARS.filter(c => c.id.startsWith('etron')) },
  { brand: 'Others',        cars: EV_CARS.filter(c => ['mini-electric','ola-s1-pro'].includes(c.id)) },
];