// db/database.js
const knex    = require('knex');
const bcrypt  = require('bcryptjs');
const path    = require('path');

const db = knex({
  client: 'sqlite3',
  connection: {
    filename: path.join(__dirname, 'evoting.db'),
  },
  useNullAsDefault: true,
});

// ── Run migrations (create tables if they don't exist) ────────────────────
async function initDB() {
  // Voters
  const hasVoters = await db.schema.hasTable('voters');
  if (!hasVoters) {
    await db.schema.createTable('voters', (t) => {
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

  // Candidates
  const hasCandidates = await db.schema.hasTable('candidates');
  if (!hasCandidates) {
    await db.schema.createTable('candidates', (t) => {
      t.increments('id').primary();
      t.string('name').notNullable();
      t.string('party');
      t.integer('vote_count').notNullable().defaultTo(0);
      t.timestamp('created_at').defaultTo(db.fn.now());
    });
    console.log('✅ candidates table created');
  }

  // Votes
  const hasVotes = await db.schema.hasTable('votes');
  if (!hasVotes) {
    await db.schema.createTable('votes', (t) => {
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
    await db.schema.createTable('admins', (t) => {
      t.increments('id').primary();
      t.string('username').notNullable().unique();
      t.string('password_hash').notNullable();
      t.timestamp('created_at').defaultTo(db.fn.now());
    });
    console.log('✅ admins table created');
  }

  // ── Seed admin ──────────────────────────────────────────────────────────
  const adminExists = await db('admins')
    .where('username', process.env.ADMIN_USERNAME || 'admin')
    .first();

  if (!adminExists) {
    const hash = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'admin123', 10);
    await db('admins').insert({
      username:      process.env.ADMIN_USERNAME || 'admin',
      password_hash: hash,
    });
    console.log('✅ Admin account seeded');
  }

  // ── Seed sample candidates ──────────────────────────────────────────────
  const count = await db('candidates').count('id as c').first();
  if (count.c === 0) {
    await db('candidates').insert([
      { name: 'Alice Johnson',  party: 'Progressive Party' },
      { name: 'Bob Williams',   party: 'Liberty Alliance'  },
      { name: 'Carol Davis',    party: 'United Front'      },
      { name: 'David Martinez', party: 'New Horizons'      },
    ]);
    console.log('✅ Sample candidates seeded');
  }

  console.log('✅ Database ready');
}

module.exports = { db, initDB };
