export const GLUCOSE_CATEGORIES = [
  { code: 'morning_fasting', label: 'Morning (Fasting)' },
  { code: 'after_breakfast', label: 'After Breakfast' },
  { code: 'after_lunch', label: 'After Lunch' },
  { code: 'after_dinner', label: 'After Dinner' },
]

export const GLUCOSE_RANGE_CONFIG = {
  disclaimer: 'Illustrative only, not medical advice.',
  unit: 'mg/dL',
  ranges: [
    { label: 'Below illustrative range', min: null, max: 69 },
    { label: 'Illustrative range', min: 70, max: 180 },
    { label: 'Above illustrative range', min: 181, max: null },
  ],
}
