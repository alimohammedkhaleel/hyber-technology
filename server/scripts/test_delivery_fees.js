const { calculateDeliveryFeeFromSohag } = require('../dist/utils/deliveryFee.util');

const testCases = [
  'سوهاج',
  'أسيوط',
  'قنا',
  'الأقصر',
  'المنيا',
  'بني سويف',
  'الجيزة',
  'القاهرة',
  'الإسكندرية',
  'مطروح',
  'شمال سيناء',
  'السعودية',
  'الرياض',
  'دبي',
  'مدينة غير مسجلة'
];

console.log('=== TESTING DISTANCE-BASED DELIVERY FEES FROM SOHAG ===\n');
for (const city of testCases) {
  const res = calculateDeliveryFeeFromSohag(city);
  console.log(`${city.padEnd(18)} -> ${res.governorate.padEnd(25)} | المسافة: ~${String(res.distanceKm).padStart(4)} كم | الرسوم: ${String(res.fee).padStart(3)} ج.م | المدة: ${res.estimatedTime} | (>= 100: ${res.fee >= 100})`);
  if (res.fee < 100) {
    throw new Error(`Fee for ${city} cannot be less than 100 EGP!`);
  }
}
console.log('\n✅ ALL SOHAG DELIVERY FEE CALCULATIONS VERIFIED SUCCESSFULLY (MIN >= 100 EGP)!');
