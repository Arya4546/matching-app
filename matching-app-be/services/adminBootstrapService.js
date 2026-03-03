const User = require('../models/User');

const getConfiguredAdminPhones = () => {
  const raw = process.env.ADMIN_PHONE_NUMBERS || process.env.ADMIN_PHONE || '';
  return raw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
};

const ensureAdminAccount = async () => {
  const existingAdminCount = await User.countDocuments({ role: 'admin' });
  if (existingAdminCount > 0) {
    console.log(`Admin bootstrap: found ${existingAdminCount} admin account(s).`);
    return;
  }

  const adminPhones = getConfiguredAdminPhones();
  const primaryAdminPhone = adminPhones[0];

  if (!primaryAdminPhone) {
    throw new Error(
      'Admin bootstrap: no ADMIN_PHONE/ADMIN_PHONE_NUMBERS configured while no admin user exists.'
    );
  }

  const seedName = process.env.ADMIN_SEED_NAME || 'Administrator';
  const seedGender = ['male', 'female', 'other'].includes(process.env.ADMIN_SEED_GENDER)
    ? process.env.ADMIN_SEED_GENDER
    : 'other';
  const seedAddress = process.env.ADMIN_SEED_ADDRESS || 'Admin account';

  let adminUser = await User.findOne({ phoneNumber: primaryAdminPhone });

  if (adminUser) {
    adminUser.role = 'admin';
    adminUser.isFrozen = false;
    adminUser.smsVerified = true;
    if (!adminUser.name) adminUser.name = seedName;
    if (!adminUser.gender) adminUser.gender = seedGender;
    if (!adminUser.address) adminUser.address = seedAddress;
    await adminUser.save();
    console.log(`Admin bootstrap: promoted existing user to admin (${primaryAdminPhone}).`);
    return;
  }

  adminUser = new User({
    name: seedName,
    phoneNumber: primaryAdminPhone,
    gender: seedGender,
    address: seedAddress,
    role: 'admin',
    isFrozen: false,
    isAvailable: true,
    isOnline: false,
    smsVerified: true,
    location: {
      type: 'Point',
      coordinates: [0, 0]
    }
  });

  await adminUser.save();
  console.log(`Admin bootstrap: created admin account (${primaryAdminPhone}).`);
};

module.exports = { ensureAdminAccount };
