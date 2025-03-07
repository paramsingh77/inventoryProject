const pool = require('./db.config');
const { hashPassword } = require('../utils/password.utils');

const initializeDatabase = async () => {
  try {
    // Create base tables first
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        reset_token VARCHAR(255),
        reset_token_expires TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create token blacklist table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS token_blacklist (
        id SERIAL PRIMARY KEY,
        token TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create roles table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL
      )
    `);

    // Create sites table with UNIQUE constraint on name
    await pool.query(`
      DROP TABLE IF EXISTS user_roles;
      DROP TABLE IF EXISTS sites;
      
      CREATE TABLE sites (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        location VARCHAR(100),
        image_url TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create user_roles table
    await pool.query(`
      DROP TABLE IF EXISTS user_roles;
      
      CREATE TABLE user_roles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        role_id INTEGER REFERENCES roles(id),
        site_id INTEGER REFERENCES sites(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT user_roles_unique UNIQUE(user_id, role_id)
      )
    `);

    console.log('All tables created successfully');

    // Insert basic roles
    await pool.query(`
      INSERT INTO roles (name)
      VALUES ('admin'), ('user')
      ON CONFLICT (name) DO NOTHING
    `);

    // Insert sites one by one to handle special characters properly
    const sitesData = [
      { name: 'Dameron Hospital', location: 'Stockton', image_url: 'https://stocktonia.org/wp-content/uploads/2024/12/DSC06271.jpg', is_active: true },
      { name: 'American Advance Management', location: 'Modesto', image_url: 'https://americanam.org/wp-content/uploads/2023/07/Central-Valley-Specialty-Hospital_Nero-AI_Photo_x4-scaled-e1690750874409.jpg', is_active: true },
      { name: 'Phoenix Specialty Hospital', location: 'Phoenix', image_url: 'https://lh3.googleusercontent.com/p/AF1QipOmz5HyLeSw43ZEL2Ouzn4cWtC_o5ZkUphutIrZ=s1360-w1360-h1020', is_active: true },
      { name: 'Central Valley Specialty Hospital', location: '', image_url: 'https://americanam.org/wp-content/uploads/2023/07/Central-Valley-Specialty-Hospital_Nero-AI_Photo_x4-scaled-e1690750874409.jpg', is_active: true },
      { name: 'Coalinga Regional Medical Center', location: 'Coalinga', image_url: 'https://americanam.org/wp-content/uploads/elementor/thumbs/Coalinga-Regional-Medical-Center_Nero-AI_Photo_x4-scaled-qa0jah66x6mj1mximu2kgyjzhntocced96046wjzhc.jpg', is_active: true },
      { name: 'Orchard Hospital', location: '', image_url: 'https://americanam.org/wp-content/uploads/elementor/thumbs/Orchard-Hospital_Nero-AI_Photo_x4-qa0h6gy0agku8rc1ghblcn1690g6xfnqgyxo6f90m8.jpg', is_active: true },
      { name: 'Glenn Medical Center', location: 'Willows', image_url: 'https://americanam.org/wp-content/uploads/2023/07/Glenn-Medical-Center_Nero-AI_Photo_x4-scaled.jpg', is_active: true },
      { name: 'Sonoma Specialty Hospital', location: 'Sonoma', image_url: 'https://americanam.org/wp-content/uploads/2023/07/DSC08734-1-550x632.jpg', is_active: true },
      { name: 'Kentfield San Francisco', location: 'San Francisco', image_url: 'https://s3-media0.fl.yelpcdn.com/bphoto/iQ1h4GLOvcPGHK6rm7ta0w/ls.jpg', is_active: true },
      { name: 'Kentfield Marin', location: 'Marin', image_url: 'https://americanam.org/wp-content/uploads/2023/11/Kentfield-Placeholder-500x400-1.jpg', is_active: false },
      { name: 'Aurora', location: 'San Diego', image_url: 'https://s3-media0.fl.yelpcdn.com/bphoto/JgntefB3ZUXQdfBr1b798g/l.jpg', is_active: true },
      { name: 'Salt Lake Specialty Hospital', location: 'Salt Lake', image_url: 'https://slspecialty.org/wp-content/uploads/2024/11/KPC-Promise-7-scaled.jpg', is_active: true },
      { name: 'Baton Rouge Specialty Hospital', location: 'Louisiana', image_url: 'https://americanam.org/wp-content/uploads/2024/06/Boutne-Rouge-Placeholder-500x400-1.jpg', is_active: false },
      { name: 'Madera Community Hospital', location: 'Madera', image_url: 'https://www.fresnobee.com/latest-news/6khf7g/picture297774203/alternates/FREE_1140/Madera%20Community%20Hospital_12302024_2', is_active: true },
      { name: 'Colusa Medical Center', location: 'Colusa', image_url: 'https://americanam.org/wp-content/uploads/elementor/thumbs/Colusa-Medical-Center_Nero-AI_Photo_x4-scaled-e1690430420567-qa0hb80mub30xsfjpj9oyfv2d50zucivsho1is7d5s.jpg', is_active: true },
      { name: 'Williams', location: '', image_url: 'https://stocktonia.org/wp-content/uploads/2024/12/DSC06271.jpg', is_active: true },
      { name: 'West Huschle', location: '', image_url: 'https://stocktonia.org/wp-content/uploads/2024/12/DSC06271.jpg', is_active: true },
      { name: 'Amarillo Specialty Hospital', location: 'Amarillo', image_url: 'https://americanam.org/wp-content/uploads/2024/06/Amarillo-Placeholder-500x400-1.jpg', is_active: false }
    ];

    // Insert sites using parameterized queries
    for (const site of sitesData) {
      await pool.query(`
        INSERT INTO sites (name, location, image_url, is_active)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (name) DO UPDATE 
        SET location = EXCLUDED.location, 
            image_url = EXCLUDED.image_url, 
            is_active = EXCLUDED.is_active
      `, [site.name, site.location, site.image_url, site.is_active]);
    }

    console.log('Sites data inserted successfully');

    // Create default admin user
    const hashedPassword = await hashPassword('admin123');
    await pool.query(`
      INSERT INTO users (username, email, password_hash)
      VALUES ($1, $2, $3)
      ON CONFLICT (username) DO NOTHING
    `, ['admin', 'admin@example.com', hashedPassword]);

    // Get admin user and role IDs
    const adminUser = await pool.query('SELECT id FROM users WHERE username = $1', ['admin']);
    const adminRole = await pool.query('SELECT id FROM roles WHERE name = $1', ['admin']);

    if (adminUser.rows.length > 0 && adminRole.rows.length > 0) {
      await pool.query(`
        INSERT INTO user_roles (user_id, role_id)
        VALUES ($1, $2)
        ON CONFLICT (user_id, role_id) DO NOTHING
      `, [adminUser.rows[0].id, adminRole.rows[0].id]);
    }

    console.log('Database initialization completed successfully');
    return true;
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
};

// Function to clean up expired tokens (can be called manually or scheduled)
const cleanupExpiredTokens = async () => {
  try {
    await pool.query('DELETE FROM token_blacklist WHERE expires_at < NOW()');
    console.log('Expired tokens cleaned up');
  } catch (error) {
    console.error('Token cleanup error:', error);
  }
};

module.exports = {
  initializeDatabase,
  cleanupExpiredTokens
}; 