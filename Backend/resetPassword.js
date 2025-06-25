const bcrypt = require('bcrypt');
const db = require('./models');

async function resetPassword() {
  await db.sequelize.sync();

  const email = 'sophie.bluel@test.tld';
  const newPassword = 'S0phie!';
  const hashed = await bcrypt.hash(newPassword, 10);

  const user = await db.users.findOne({ where: { email } });
  if (!user) {
    console.log('❌ No user found to reset.');
  } else {
    await user.update({ password: hashed });
    console.log('✅ Password reset to S0phie!');
  }

  process.exit();
}

resetPassword();
