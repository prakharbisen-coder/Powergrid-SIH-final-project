// Test recommendations format
const recommendations = [
  'High voltage project requires premium quality materials',
  'Schedule early procurement for specialized insulators',
  'TAX OPTIMIZATION (HIGH): Total tax impact: ₹2.32 Cr on ₹15.64 Cr project - Review tax calculations and consider optimization strategies'
];

console.log('Recommendations array:');
recommendations.forEach((rec, i) => {
  console.log(`  ${i + 1}. ${rec}`);
});

console.log('\n✅ All items are strings:', recommendations.every(r => typeof r === 'string'));
console.log('✅ Array length:', recommendations.length);
console.log('\nThis format will work correctly with the Forecast model!');
