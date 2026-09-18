const API_URL = 'http://localhost:5000/api/v1';

async function runTests() {
  console.log('=== STARTING ADMIN & LOCATION FEATURES TEST ===');

  // 1. Admin Login
  console.log('\n1. Testing Admin Login...');
  const loginRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'admin@superapp.com',
      password: 'Password123!',
    }),
  });
  const loginJson = await loginRes.json();
  if (!loginJson.success) {
    throw new Error(`Admin login failed: ${JSON.stringify(loginJson)}`);
  }
  const token = loginJson.data.tokens.accessToken;
  console.log('-> Admin login successful!');

  // 2. Test Platform Settings GET & PUT
  console.log('\n2. Testing Platform Business Settings...');
  const settingsRes = await fetch(`${API_URL}/admin/settings`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const settingsJson = await settingsRes.json();
  console.log(`-> Settings count: ${settingsJson.data?.settings?.length}`);

  const updateSettingRes = await fetch(`${API_URL}/admin/settings`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      key: 'test_delivery_sla_minutes',
      value: '35',
      description: 'زمن التوصيل القياسي بالدقائق',
    }),
  });
  const updateSettingJson = await updateSettingRes.json();
  console.log(`-> Update setting response: ${updateSettingJson.message}`);

  // 3. Test Drivers List & Creation
  console.log('\n3. Testing Delivery Captains (CRUD)...');
  const driversRes = await fetch(`${API_URL}/admin/drivers`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const driversJson = await driversRes.json();
  console.log(`-> Existing drivers count: ${driversJson.data?.drivers?.length}`);

  const testPhone = `+201099${Math.floor(100000 + Math.random() * 900000)}`;
  const createDriverRes = await fetch(`${API_URL}/admin/drivers`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      full_name: 'كابتن طارق السعيد التجريبي',
      phone: testPhone,
      email: `captain_${Date.now()}@superapp.com`,
      password: 'CaptainPassword123!',
      status: 'ACTIVE',
    }),
  });
  const createDriverJson = await createDriverRes.json();
  console.log(`-> Create driver status: ${createDriverRes.status}, Message: ${createDriverJson.message}`);
  if (!createDriverJson.success) {
    throw new Error(`Create driver failed: ${JSON.stringify(createDriverJson)}`);
  }
  const newDriverId = createDriverJson.data.driver.id;

  // 4. Test Update Driver
  console.log('\n4. Testing Update Driver...');
  const updateDriverRes = await fetch(`${API_URL}/admin/drivers/${newDriverId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      full_name: 'كابتن طارق السعيد (محدث)',
      status: 'ACTIVE',
    }),
  });
  const updateDriverJson = await updateDriverRes.json();
  console.log(`-> Update driver message: ${updateDriverJson.message}`);

  // 5. Test Delete / Deactivate Driver
  console.log('\n5. Testing Deactivate Driver...');
  const deleteDriverRes = await fetch(`${API_URL}/admin/drivers/${newDriverId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  const deleteDriverJson = await deleteDriverRes.json();
  console.log(`-> Delete driver message: ${deleteDriverJson.message}`);

  // 6. Test CSV Export for All Types with UTF-8 BOM
  console.log('\n6. Testing CSV Reports Export...');
  const types = ['orders', 'customers', 'vendors', 'bookings'];
  for (const t of types) {
    const csvRes = await fetch(`${API_URL}/admin/reports/export?type=${t}&days=30`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const arrayBuf = await csvRes.arrayBuffer();
    const buf = Buffer.from(arrayBuf);
    const hasBom = buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf;
    console.log(`-> Export [${t}]: status ${csvRes.status}, length: ${buf.length} bytes, has UTF-8 BOM: ${hasBom}`);
    if (csvRes.status !== 200 || !hasBom) {
      throw new Error(`Export failed for type: ${t}`);
    }
  }

  console.log('\n=== ALL ADMIN AND DRIVER FEATURES VERIFIED SUCCESSFULLY! ===');
}

runTests().catch((err) => {
  console.error('\n❌ Test failed with error:', err);
  process.exit(1);
});
