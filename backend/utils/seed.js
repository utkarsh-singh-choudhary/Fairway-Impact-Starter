require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Charity = require('../models/Charity');

const run = async () => {
  await connectDB();

  const adminEmail = 'admin@golfcharity.test';
  const existingAdmin = await User.findOne({ email: adminEmail });
  if (!existingAdmin) {
    await User.create({
      name: 'Platform Admin',
      email: adminEmail,
      password: 'ChangeMe123!',
      role: 'admin',
    });
    console.log(`Admin created: ${adminEmail} / ChangeMe123!`);
  } else {
    console.log('Admin already exists, skipping');
  }

  const demoEmail = 'demo.subscriber@golfcharity.test';
  const existingDemo = await User.findOne({ email: demoEmail });
  if (!existingDemo) {
    await User.create({
      name: 'Demo Subscriber',
      email: demoEmail,
      password: 'ChangeMe123!',
      role: 'subscriber',
    });
    console.log(`Demo subscriber created: ${demoEmail} / ChangeMe123!`);
  }

  const charities = [
    {
      name: 'First Tee Foundation',
      slug: 'first-tee-foundation',
      description: 'Empowering youth through golf and character education programs.',
      category: 'Youth Development',
      isFeatured: true,
    },
    {
      name: 'Green Fields Relief',
      slug: 'green-fields-relief',
      description: 'Providing disaster relief and rebuilding support to affected communities.',
      category: 'Disaster Relief',
      isFeatured: true,
    },
    {
      name: 'Ocean Guard Trust',
      slug: 'ocean-guard-trust',
      description: 'Protecting marine ecosystems through conservation and cleanup initiatives.',
      category: 'Environment',
      isFeatured: false,
    },
  ];

  for (const c of charities) {
    const exists = await Charity.findOne({ slug: c.slug });
    if (!exists) {
      await Charity.create(c);
      console.log(`Charity created: ${c.name}`);
    }
  }

  console.log('Seeding complete');
  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
