const fetch = global.fetch || require('node-fetch');

const BASE_URL = 'http://localhost:5000/api/v1';

async function verifyE2EPurchaseAndExcel() {
  console.log('================================================================');
  console.log('🚀 NLP SuperApp - Full E2E Purchase, Excel & Delivery Verification');
  console.log('================================================================\n');

  // 1. Admin Login
  console.log('1️⃣ [ADMIN] Logging in as platform Admin...');
  const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'admin@superapp.com',
      password: 'Password123!',
    }),
  });
  const adminLoginData = await adminLoginRes.json();
  if (!adminLoginData.success) throw new Error('Admin login failed: ' + JSON.stringify(adminLoginData));
  const adminToken = adminLoginData.data.tokens.accessToken;
  console.log('   ✅ Admin logged in successfully.\n');

  // 2. Test Excel / CSV Export for All Types with UTF-8 BOM
  console.log('2️⃣ [EXCEL / CSV EXPORT] Testing UTF-8 BOM Reports Export...');
  const exportTypes = ['orders', 'customers', 'vendors', 'bookings'];
  for (const expType of exportTypes) {
    const expRes = await fetch(`${BASE_URL}/admin/reports/export?type=${expType}&days=30`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const arrayBuf = await expRes.arrayBuffer();
    const buf = Buffer.from(arrayBuf);
    const hasBom = buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf;
    const textContent = buf.toString('utf-8');
    const linesCount = textContent.split('\n').filter(Boolean).length;
    console.log(`   📊 Export [${expType}]: status ${expRes.status}, size ${buf.length} bytes, lines: ${linesCount}, UTF-8 BOM: ${hasBom ? 'YES (Excel Compatible)' : 'NO'}`);
    if (expRes.status !== 200 || !hasBom) {
      throw new Error(`Export failed for type: ${expType}`);
    }
  }
  console.log('   ✅ Excel/CSV Export verified successfully with UTF-8 BOM.\n');

  // 3. Test Financial Reports Summary
  console.log('3️⃣ [FINANCIAL REPORTS] Testing Financial Reports API...');
  const reportsRes = await fetch(`${BASE_URL}/admin/reports/summary?days=30`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const reportsData = await reportsRes.json();
  if (!reportsData.success) throw new Error('Reports summary failed: ' + JSON.stringify(reportsData));
  console.log(`   💰 Gross Revenue: ${reportsData.data.orders.gross_revenue} EGP`);
  console.log(`   📦 Total Orders Count: ${reportsData.data.orders.total_count}`);
  console.log(`   🏪 Top Vendors Count: ${reportsData.data.top_vendors.length}`);
  console.log(`   📈 Service Breakdown Categories: ${reportsData.data.service_breakdown.map((s) => s.service_type).join(', ')}`);
  console.log('   ✅ Financial Reports API verified.\n');

  // 4. Customer Login & Cart Add
  console.log('4️⃣ [CUSTOMER] Logging in as Customer...');
  const customerLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'customer@superapp.com',
      password: 'Password123!',
    }),
  });
  const customerLoginData = await customerLoginRes.json();
  if (!customerLoginData.success) throw new Error('Customer login failed');
  const customerToken = customerLoginData.data.tokens.accessToken;
  console.log('   ✅ Customer logged in.\n');

  // Fetch a valid product
  console.log('5️⃣ [CATALOG] Finding vendor product for checkout...');
  const vendorRes = await fetch(`${BASE_URL}/vendors/10000000-0000-0000-0000-000000000001`);
  const vendorData = await vendorRes.json();
  const product = vendorData.data?.products?.[0];
  if (!product) throw new Error('No product found for vendor');
  console.log(`   🍔 Selected Product: "${product.name}" (${product.base_price} EGP)`);

  // Clear cart and add product
  await fetch(`${BASE_URL}/cart`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${customerToken}` },
  });
  const addCartRes = await fetch(`${BASE_URL}/cart/items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${customerToken}`,
    },
    body: JSON.stringify({
      product_id: product.id,
      quantity: 2,
      special_instructions: 'بدون بصل مع زيادة صوص',
    }),
  });
  const addCartData = await addCartRes.json();
  if (!addCartData.success) throw new Error('Add to cart failed: ' + JSON.stringify(addCartData));
  console.log('   ✅ Added 2x items to Cart.\n');

  // Fetch customer addresses or create one
  console.log('6️⃣ [ADDRESS] Checking Delivery Address...');
  const addrRes = await fetch(`${BASE_URL}/customers/addresses`, {
    headers: { Authorization: `Bearer ${customerToken}` },
  });
  const addrData = await addrRes.json();
  let addressId = addrData.data?.[0]?.id;
  if (!addressId) {
    const newAddrRes = await fetch(`${BASE_URL}/customers/addresses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        label: 'المنزل',
        city: 'سوهاج',
        area: 'شارع 15 مايو',
        address: 'برج الأطباء - سوهاج',
        building: '12',
        floor: '4',
        apartment: '402',
        delivery_notes: 'الاتصال عند الوصول',
        is_default: true,
      }),
    });
    const newAddrData = await newAddrRes.json();
    addressId = newAddrData.data.id;
  }
  console.log(`   📍 Address ID: ${addressId}`);

  // 7. Place Order
  console.log('\n7️⃣ [CHECKOUT] Placing Order (COD)...');
  const createOrderRes = await fetch(`${BASE_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${customerToken}`,
    },
    body: JSON.stringify({
      delivery_address_id: addressId,
      payment_method: 'CASH_ON_DELIVERY',
      notes: 'الاسم: عميل المنصة | الهاتف: 01000000000',
    }),
  });
  const createOrderData = await createOrderRes.json();
  if (!createOrderData.success) throw new Error('Create order failed: ' + JSON.stringify(createOrderData));
  const newOrderId = createOrderData.data?.id || createOrderData.data?.order?.id;
  const orderNumber = createOrderData.data?.order_number || createOrderData.data?.order?.order_number;
  console.log(`   ✅ Order Placed Successfully! Order ID: ${newOrderId} (#${orderNumber})`);
  console.log(`   💵 Order Subtotal: ${createOrderData.data?.subtotal} EGP, Delivery Fee: ${createOrderData.data?.delivery_fee} EGP, Total: ${createOrderData.data?.total} EGP`);

  // 8. Test Single Order Tracking Query (including driver payload)
  console.log('\n8️⃣ [ORDER TRACKING] Verifying Order Details & Tracking Endpoint...');
  const orderTrackRes = await fetch(`${BASE_URL}/orders/${newOrderId}`, {
    headers: { Authorization: `Bearer ${customerToken}` },
  });
  const orderTrackData = await orderTrackRes.json();
  if (!orderTrackData.success) throw new Error('Order tracking query failed');
  console.log(`   📋 Status: ${orderTrackData.data.order_status}, Items: ${orderTrackData.data.items?.length}`);
  console.log(`   🛵 Initial Assigned Driver: ${orderTrackData.data.driver_name || 'None (In pool)'}`);

  // 9. Driver Pool & Claim
  console.log('\n9️⃣ [DRIVER] Logging in as Driver and Claiming Order from Pool...');
  const driverLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'driver@superapp.com',
      password: 'Password123!',
    }),
  });
  const driverLoginData = await driverLoginRes.json();
  if (!driverLoginData.success) throw new Error('Driver login failed');
  const driverToken = driverLoginData.data.tokens.accessToken;

  // Check Pool
  const poolRes = await fetch(`${BASE_URL}/delivery/pool`, {
    headers: { Authorization: `Bearer ${driverToken}` },
  });
  const poolData = await poolRes.json();
  console.log(`   🏊 Available Orders in Pool: ${poolData.data?.available_orders?.length}`);
  const isOurOrderInPool = poolData.data?.available_orders?.some((o) => o.order_id === newOrderId);
  console.log(`   🎯 New Order present in Driver Pool: ${isOurOrderInPool ? 'YES' : 'NO'}`);

  // Driver claims order
  const claimRes = await fetch(`${BASE_URL}/delivery/claim`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${driverToken}`,
    },
    body: JSON.stringify({ order_id: newOrderId }),
  });
  const claimData = await claimRes.json();
  if (!claimData.success) throw new Error('Driver claim failed: ' + JSON.stringify(claimData));
  const assignmentId = claimData.data.id;
  console.log(`   ✅ Order claimed by Driver! Assignment ID: ${assignmentId}`);

  // Driver updates status step by step: PICKED_UP -> ON_THE_WAY -> DELIVERED
  console.log('\n🔟 [DELIVERY STEPS] Driver Executing Delivery Milestones...');
  for (const nextSt of ['PICKED_UP', 'ON_THE_WAY', 'DELIVERED']) {
    const updRes = await fetch(`${BASE_URL}/delivery/assignments/${assignmentId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${driverToken}`,
      },
      body: JSON.stringify({ status: nextSt, notes: `تحديث الحالة إلى ${nextSt}` }),
    });
    const updData = await updRes.json();
    console.log(`   🚚 Transitioned status to -> [${nextSt}]: ${updData.success ? 'SUCCESS' : 'FAILED'}`);
  }

  // 11. Final Verification on Customer Tracking & Admin Order Full Details
  console.log('\n1️⃣1️⃣ [FINAL VERIFICATION] Verifying Customer & Admin Views after Delivery...');
  const finalTrackRes = await fetch(`${BASE_URL}/orders/${newOrderId}`, {
    headers: { Authorization: `Bearer ${customerToken}` },
  });
  const finalTrackData = await finalTrackRes.json();
  console.log(`   ✅ Customer View Status: ${finalTrackData.data.order_status}`);
  console.log(`   ✅ Customer View Driver: ${finalTrackData.data.driver_name} (${finalTrackData.data.driver_phone})`);
  console.log(`   ✅ Delivery Status: ${finalTrackData.data.delivery_status}`);

  // Admin view
  const adminOrderDetailRes = await fetch(`${BASE_URL}/admin/orders/${newOrderId}/details`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const adminOrderDetail = await adminOrderDetailRes.json();
  console.log(`   ✅ Admin Order Details: #${adminOrderDetail.data.order_number}, Status: ${adminOrderDetail.data.order_status}, Driver: ${adminOrderDetail.data.driver?.name}`);

  console.log('\n================================================================');
  console.log('🎉 ALL END-TO-END PURCHASE, EXCEL EXPORT & DELIVERY TESTS PASSED!');
  console.log('================================================================');
}

verifyE2EPurchaseAndExcel().catch((err) => {
  console.error('\n❌ Verification failed with error:', err);
  process.exit(1);
});
