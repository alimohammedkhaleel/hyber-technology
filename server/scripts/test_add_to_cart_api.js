const http = require('http');

async function loginAndAddToCart() {
  // 1. Login as customer
  const loginBody = JSON.stringify({
    identifier: 'customer@superapp.com',
    password: 'Password123!'
  });

  console.log('Sending login request...');
  const t0 = Date.now();
  const loginRes = await fetch('http://localhost:5000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: loginBody
  });
  const loginJson = await loginRes.json();
  console.log(`Login response (${Date.now() - t0}ms):`, loginJson.success ? 'SUCCESS' : loginJson);

  if (!loginJson.success) return;

  const token = loginJson.data.tokens.accessToken;

  // 2. Try adding to cart
  const payload = {
    vendor_id: '10000000-0000-0000-0000-000000000001',
    product_id: 'ea000001-0000-0000-0000-000000000001',
    variant_id: 'aa000001-0000-0000-0000-000000000001',
    quantity: 2,
    selected_addons: [
      { id: 'ab000001-0000-0000-0000-000000000001', name: 'إضافة جبن جودا معتقة إضافية', price: 25 }
    ],
    special_instructions: 'بدون بصل'
  };

  console.log('Sending addToCart request...');
  const t1 = Date.now();
  const cartRes = await fetch('http://localhost:5000/api/v1/cart/items', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  const cartJson = await cartRes.json();
  console.log(`AddToCart response (${Date.now() - t1}ms):`, cartJson);

  // 3. Try getting cart
  console.log('Fetching cart...');
  const getCartRes = await fetch('http://localhost:5000/api/v1/cart', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const getCartJson = await getCartRes.json();
  console.log('GetCart response:', JSON.stringify(getCartJson, null, 2));
}

loginAndAddToCart().catch(console.error);
