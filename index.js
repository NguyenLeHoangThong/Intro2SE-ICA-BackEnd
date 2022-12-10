const express = require('express');
const router = express.Router();
const cors = require('cors');
require('dotenv').config();

const app = express();
const http = require('http');
const server = http.createServer(app);
const bodyParser = require('body-parser');
app.use(cors());
app.use(bodyParser.json());

app.use(
    bodyParser.urlencoded({
        extended: true,
    })
)

const bootDatabase = async () => {
    try {
        server.listen(process.env.BACKEND_PORT, () => {
            console.log(`App running on port ${process.env.BACKEND_PORT}`)
        }
        )

        const knex = require('knex')({
            client: 'pg',
            connection: process.env.PG_CONNECTION_STRING,
            searchPath: ['knex', 'public'],
        });

        app.post('/employees', async (req, res) => {
            // create 1 employee
            const name = req.body.name;
            const age = req.body.age;
            const country = req.body.country;
            const position = req.body.position;
            const wage = req.body.wage;

            const data = {
                name: name,
                age: age,
                country: country,
                position: position,
                wage: wage
            }

            return await knex.transaction(async (trx) => {
                try {
                    const results = await trx('employees')
                        .returning([
                            'id',
                            'name',
                            'age',
                            'country',
                            'position',
                            'wage'
                        ])
                        .insert(data)

                    return res.send(results && results.length ? results[0] : null);
                }
                catch (e) {
                    return res.send({
                        message: e?.message || e
                    })
                }
            })
        })

        app.get('/employees', async (req, res) => {
            //get all employees
            try {
                const getReturnObject = (data) => {
                    return ({
                        id: data?.id,
                        name: data?.name,
                        age: data?.age,
                        position: data?.position,
                        country: data?.country,
                        wage: data?.wage
                    })
                }

                const results = await knex.raw('SELECT * FROM employees');

                return res.send(results && results.rows && results.rows.length ? results.rows.map((item) => getReturnObject(item)) : []);
            }
            catch (e) {
                return res.send({
                    message: e?.message || e
                })
            }
        })
    }
    catch (err) {
        console.log("Boot database error: ", err);
    }
}

bootDatabase();