const knex   = require('knex');
const bcrypt = require('bcryptjs');
const path   = require('path');

const db = knex({
  client: 'sqlite3',
  connection: { filename: path.join(__dirname, 'evoting.db') },
  useNullAsDefault: true,
});

async function initDB() {
  // Voters
  const hasVoters = await db.schema.hasTable('voters');
  if (!hasVoters) {
    await db.schema.createTable('voters', t => {
      t.increments('id').primary();
      t.string('unique_id').notNullable().unique();
      t.string('full_name').notNullable();
      t.string('email').notNullable().unique();
      t.string('password_hash').notNullable();
      t.integer('has_voted').notNullable().defaultTo(0);
      t.timestamp('created_at').defaultTo(db.fn.now());
    });
    console.log('✅ voters table created');
  }

  // Candidates — add new columns if missing
  const hasCandidates = await db.schema.hasTable('candidates');
  if (!hasCandidates) {
    await db.schema.createTable('candidates', t => {
      t.increments('id').primary();
      t.string('name').notNullable();
      t.string('party');
      t.string('position');
      t.text('bio');
      t.string('photo');
      t.integer('vote_count').notNullable().defaultTo(0);
      t.timestamp('created_at').defaultTo(db.fn.now());
    });
    console.log('✅ candidates table created');
  } else {
    // Add missing columns to existing table
    const hasPosition = await db.schema.hasColumn('candidates', 'position');
    if (!hasPosition) await db.schema.table('candidates', t => { t.string('position'); });
    const hasBio = await db.schema.hasColumn('candidates', 'bio');
    if (!hasBio) await db.schema.table('candidates', t => { t.text('bio'); });
    const hasPhoto = await db.schema.hasColumn('candidates', 'photo');
    if (!hasPhoto) await db.schema.table('candidates', t => { t.string('photo'); });
  }

  // Votes
  const hasVotes = await db.schema.hasTable('votes');
  if (!hasVotes) {
    await db.schema.createTable('votes', t => {
      t.increments('id').primary();
      t.integer('voter_id').notNullable().references('id').inTable('voters');
      t.integer('candidate_id').notNullable().references('id').inTable('candidates');
      t.string('vote_hash').notNullable().unique();
      t.string('tx_hash');
      t.timestamp('created_at').defaultTo(db.fn.now());
    });
    console.log('✅ votes table created');
  }

  // Admins
  const hasAdmins = await db.schema.hasTable('admins');
  if (!hasAdmins) {
    await db.schema.createTable('admins', t => {
      t.increments('id').primary();
      t.string('username').notNullable().unique();
      t.string('password_hash').notNullable();
      t.timestamp('created_at').defaultTo(db.fn.now());
    });
    console.log('✅ admins table created');
  }

  // Password resets
  const hasResets = await db.schema.hasTable('password_resets');
  if (!hasResets) {
    await db.schema.createTable('password_resets', t => {
      t.increments('id').primary();
      t.integer('voter_id').notNullable().references('id').inTable('voters');
      t.string('token').notNullable().unique();
      t.string('expires_at').notNullable();
      t.timestamp('created_at').defaultTo(db.fn.now());
    });
    console.log('✅ password_resets table created');
  }

  // Seed admin
  const adminExists = await db('admins').where('username', process.env.ADMIN_USERNAME || 'admin').first();
  if (!adminExists) {
    const hash = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'admin123', 10);
    await db('admins').insert({ username: process.env.ADMIN_USERNAME || 'admin', password_hash: hash });
    console.log('✅ Admin account seeded');
  }

  // Seed candidates only if empty
  const count = await db('candidates').count('id as c').first();
  if (count.c === 0) {
    await db('candidates').insert([
      { name: 'Alice Johnson',  party: 'Progressive Party', position: 'President' },
      { name: 'Bob Williams',   party: 'Liberty Alliance',  position: 'President' },
      { name: 'Carol Davis',    party: 'United Front',      position: 'President' },
      { name: 'David Martinez', party: 'New Horizons',      position: 'President' },
    ]);
    console.log('✅ Sample candidates seeded');
  }

  console.log('✅ Database ready');
}

module.exports = { db, initDB };
