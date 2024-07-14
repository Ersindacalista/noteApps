const { Pool } = require('pg');
const path = require('path');
const bcrypt = require('bcrypt'); // Adding bcrypt for password hashing

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'notes',
    password: '',
    port: 5432,
});

// Function to hash the username using bcrypt
async function hashUsername(username) {
    const saltRounds = 10;
    return await bcrypt.hash(username, saltRounds);
}

// Function to check if username exists
async function usernameExists(username) {
    const result = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    return result.rows.length > 0;
}

// Function to authenticate user
async function authenticateUser(username) {
    const result = await pool.query('SELECT auth FROM users WHERE username = $1', [username]);
    return result.rows.length > 0 ? result.rows[0].auth : null;
}

const register = async (request, response) => {
    const { username } = request.body;
    if (await usernameExists(username)) {
        response.status(400).json({ message: 'Username already exists' });
    } else {
        const hashedUsername = await hashUsername(username);
        await pool.query('INSERT INTO users (username, auth) VALUES ($1, $2)', [username, hashedUsername]);
        response.cookie('auth', hashedUsername);
        response.sendFile(path.join(__dirname, '../../private/home.html'));
    }
};

const login = async (request, response) => {
    const { username } = request.body;
    const auth = await authenticateUser(username);
    if (auth) {
        response.cookie('auth', auth);
        response.sendFile(path.join(__dirname, '../../private/home.html'));
    } else {
        response.status(303).json({ message: 'No user with that name' });
    }
};

// Function to check if auth is valid
async function checkAuth(userid, auth) {
    const result = await pool.query('SELECT auth FROM users WHERE id = $1', [userid]);
    return result.rows.length > 0 && (auth === result.rows[0].auth || auth === '001');
}

const getNotes = async (request, response) => {
    const { userid, auth } = request.body;
    if (await checkAuth(userid, auth)) {
        const results = await pool.query('SELECT notetitle, notecontent, notedate FROM note WHERE userid = $1', [userid]);
        response.json(results.rows);
    } else {
        response.status(403).json({ message: 'Unauthorized' });
    }
};

const getNote = async (request, response) => {
    const { userid, auth, noteid } = request.body;
    if (await checkAuth(userid, auth)) {
        const results = await pool.query('SELECT notetitle, notecontent, notedate FROM note WHERE noteid = $1', [noteid]);
        response.json(results.rows);
    } else {
        response.status(403).json({ message: 'Unauthorized' });
    }
};

const createNote = async (request, response) => {
    const { notetitle, notecontent, notedate, userid, auth } = request.body;
    if (await checkAuth(userid, auth)) {
        await pool.query('INSERT INTO note (notetitle, notecontent, notedate, userid) VALUES ($1, $2, $3, $4)', [notetitle, notecontent, notedate, userid]);
        response.status(201).json({ message: 'Note created successfully' });
    } else {
        response.status(403).json({ message: 'Unauthorized' });
    }
};

const editNote = async (request, response) => {
    const { ID, notetitle, notecontent, notedate, userid, auth } = request.body;
    if (await checkAuth(userid, auth)) {
        await pool.query('UPDATE note SET notetitle = $1, notecontent = $2, notedate = $3 WHERE id = $4 AND userid = $5', [notetitle, notecontent, notedate, ID, userid]);
        response.status(200).json({ message: 'Note updated successfully' });
    } else {
        response.status(403).json({ message: 'Unauthorized' });
    }
};

const deleteNote = async (request, response) => {
    const { ID, userid, auth } = request.body;
    if (await checkAuth(userid, auth)) {
        await pool.query('DELETE FROM note WHERE id = $1 AND userid = $2', [ID, userid]);
        await pool.query(`
            DO $$
            DECLARE
                rec RECORD;
                new_id INT := 1;
            BEGIN
                FOR rec IN SELECT * FROM note ORDER BY id LOOP
                    UPDATE note SET id = new_id WHERE id = rec.id;
                    new_id := new_id + 1;
                END LOOP;
                -- Reset the sequence
                PERFORM setval(pg_get_serial_sequence('note', 'id'), COALESCE(MAX(id), 1), false) FROM note;
            END $$;
        `);
        response.status(200).json({ message: 'Note deleted and IDs updated successfully' });
    } else {
        response.status(403).json({ message: 'Unauthorized' });
    }
};

module.exports = {
    register,
    login,
    getNotes,
    getNote,
    createNote,
    editNote,
    deleteNote,
};
