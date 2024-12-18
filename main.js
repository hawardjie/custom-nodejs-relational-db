const Database = require('./database');

async function main() {
  // Initialize database
  const db = new Database('myDB');
  await db.init();

  // Create users table
  await db.createTable('users', {
    name: { type: 'string', required: true },
    email: { type: 'string', required: true },
    age: { type: 'number', required: false },
  });

  // Create posts table
  await db.createTable('posts', {
    title: { type: 'string', required: true },
    content: { type: 'string', required: true },
    userId: { type: 'number', required: true },
  });

  // Insert user
  const user = await db.insert('users', {
    name: 'John Doe',
    email: 'john@example.com',
    age: 30,
  });

  // Insert post
  await db.insert('posts', {
    title: 'My First Post',
    content: 'Hello, world',
    userId: user.id,
  });

  // Select users
  const users = db.select('users', { name: 'John Doe' });
  console.log('Users: ', users);

  // Join users and posts
  const postsWithUsers = db.join('posts', 'users', 'userId');
  console.log('Posts with users: ', postsWithUsers);

  // Update user
  await db.update('users', user.id, { age: 31 });

  // Delete user
  await db.delete('users', user.id);
}

main().catch(console.error);
