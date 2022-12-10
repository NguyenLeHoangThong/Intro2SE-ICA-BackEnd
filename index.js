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

        app.post('/create', async (req, res) => {
            console.log("request: ", req)
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
                console.log("data: ", data)
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

                    console.log("Results: ", results)
                    return await res.send(results && results.length ? results[0] : null);
                }
                catch (e) {
                    console.log("/create error: ", e);
                    return await res.send({
                        status: 500,
                        message: e?.message || e
                    })
                }
            })
        })


    }
    catch (err) {
        console.log("Boot database error: ", err);
    }
}

bootDatabase();