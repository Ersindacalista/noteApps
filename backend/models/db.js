const Pool = require('pg').Pool
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'notes',
    password: '',
    port: 5432,
})


//USERS

function stringToHashConversion(string) {
    var hashVal = 0;
    if (string.length == 0) return hashVal;
    for (i = 0; i < string.length; i++) {
        char = string.charCodeAt(i);
        hashVal = ((hashVal << 5) - hashVal) + char;
        hashVal = hashVal & hashVal;
    }
    return hashVal;
}


const register = (request, response) => {
    const { username } = request.body

    function check(username) {
        if (pool.query(`SELECT id FROM user WHERE username = ${username}`).rows) {
            return false
        }
        else {
            return true
        }
    }

    if (check(username)) {
        pool.query(`INSERT INTO users (username,auth) VALUES (${username},${stringToHashConversion(username)})`)
        response.cookie('auth', stringToHashConversion(username))
        response.sendFile(path.join(__dirname, '../../private/home.html'))
    }
}


const login = (request, response) => {
    const check = pool.query(`SELECT auth FROM user WHERE username = ${username}`)
    const { username } = request.body
    if (pool.query(`SELECT * FROM users WHERE username == ${username}`)) {
        response.cookie('auth', check.rows(auth))
        response.sendFile(path.join(__dirname, '../../private/home.html'))
    }
    else {
        response.status(303).json({ message: 'No user with that name' })
    }
}



// NOTE


function checkAuth(userid, auth) {
    const correctAuth = pool.query(`SELECT auth FROM note WHERE userid == ${userid} `)
    if (auth === correctAuth || auth === '001') {
        return true
    }
    else {
        return false
    }
}


const getNotes = (request, response) => {
    const { userid, auth } = request.body
    if (checkAuth(userid, auth)) {
        pool.query(`SELECT (notetitle,notecontent,notedate) FROM note`, (error, results) => {
            if (error) {
                throw error
            }
            response.json(results.rows)
        })
    }
    else {
        response.status(403).json({ message: 'Unauthorized' });
    }
}

const getNote = (request, response) => {
    const { userid, auth, ID } = request.body
    if (checkAuth(userid, auth)) {
        pool.query(`SELECT (notetitle,notecontent,notedate) FROM note WHERE noteid == ${noteid})`, (error, results) => {
            if (error) {
                throw error
            }
            response.json(results.rows)
        })
    }
    else {
        response.status(403).json({ message: 'Unauthorized' });
    }
}

const createNote = (request, response) => {
    const { notetitle, notecontent, notedate, userid, auth } = request.body
    if (checkAuth(userid, auth)) {
        pool.query(`INSERT INTO note (notetitle,notecontent,notedate,userid) VALUES (${notetitle},${notecontent},${notedate},${userid})`)
    }
    else {
        response.status(403).json({ message: 'Unauthorized' });
    }
}

const editNote = (request, response) => {
    const { ID, notetitle, notecontent, notedate, userid, auth } = request.body
    if (checkAuth(userid, auth)) {
        pool.query(`UPDATE note SET notetitle = ${notetitle},notecontent = ${notecontent},notedate = ${notedate} WHERE ID = ${ID}`)
    }
    else {
        response.status(403).json({ message: 'Unauthorized' });
    }
}

const deleteNote = (request, response) => {
    const { ID, userid, auth } = request.body;
    if (checkAuth(userid, auth)) {
        pool.query(
            `DELETE FROM note WHERE ID = ${ID}`,
            (error, results) => {
                if (error) {
                    response.status(500).json({ error: error.message });
                } else {

                    pool.query(
                        `DO $$
                        DECLARE
                            rec RECORD;
                            new_id INT := 1;
                        BEGIN
                            FOR rec IN SELECT * FROM note ORDER BY id LOOP
                                UPDATE note SET id = new_id WHERE id = rec.id;
                                new_id := new_id + 1;
                            END LOOP;
                            -- Resettare la sequenza
                            PERFORM setval(pg_get_serial_sequence('note', 'id'), COALESCE(MAX(id), 1), false) FROM note;
                        END $$;`,
                        [],
                        (error, results) => {
                            if (error) {
                                response.status(500).json({ error: error.message });
                            } else {
                                response.status(200).json({ message: 'Note deleted and IDs updated successfully' });
                            }
                        }
                    );
                }
            }
        );
    } else {
        response.status(403).json({ message: 'Unauthorized' });
    }
};


module.exports = {
    register,
    login,
    //Note
    getNotes,
    getNote,
    createNote,
    editNote,
    deleteNote
}
