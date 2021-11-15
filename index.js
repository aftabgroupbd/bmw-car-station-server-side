const express = require('express')
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
const cors = require('cors');
const admin = require("firebase-admin");
require('dotenv').config()


const app = express()
const port = process.env.PORT || 5000

// doctors-portal-firebase-adminsdk.json

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});


//middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wp4tf.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {

    try {
        await client.connect();
        const database = client.db('bmw_car_station');
        const productsCollection = database.collection('products');
        const ordersCollection = database.collection('orders');
        const reviewsCollection = database.collection('reviews');
        const usersCollection = database.collection('users');
        const subscribesCollection = database.collection('subscribes');

        // ADD USER 
        app.post('/users', async (req, res) => {
            let user = req.body;
            user.role = 'user';
            const result = await usersCollection.insertOne(user);
            res.json(result);
        })
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            let isAdmin = false;
            if (user.role === 'admin') {
                isAdmin = true;
            }
            res.json({ admin: isAdmin });
        });
        app.put('/users', async (req, res) => {
            let user = req.body;
            user.role = 'user';
            const filter = { email: user.email };
            const options = { upsert: true };
            const updateDoc = { $set: user }
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.json(result);
        });
        app.put('/make-admin', async (req, res) => {
            const email = req.body.email;
            const filter = { email: email };
            const updateDoc = {
                $set: {
                    role: "admin"
                }
            }
            const result = await usersCollection.updateOne(filter, updateDoc);
            res.json(result);

        })
        // GET HOME PAGE FEATURE PRODUCTS 
        app.get('/feature-products', async (req, res) => {
            const cursor = productsCollection.find().limit(6);
            const products = await cursor.toArray();
            res.json(products);
        });

        // GET ALL PRODUCTS 
        app.get('/products', async (req, res) => {
            const cursor = productsCollection.find({});
            const products = await cursor.toArray();
            res.json(products);
        });
        // GET SINGLE PRODUCTS 
        app.get('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const product = await productsCollection.findOne(query);
            res.json(product);
        });
        app.post('/products', async (req, res) => {
            const product = req.body;
            const result = await productsCollection.insertOne(product);
            res.json(result);
        });
        // subscribe by email api 
        app.post('/subscribe', async (req, res) => {
            const subscribe = req.body;
            const result = await subscribesCollection.insertOne(subscribe);
            res.json(result);
        });

        // GET USER ORDERS 
        app.get('/orders', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const cursor = ordersCollection.find(query);
            const orders = await cursor.toArray();
            res.json(orders);
        });
        //UPDATE API
        app.put('/orders/:id', async (req, res) => {
            const id = req.params.id
            const updateOrder = req.body;
            const filter = { _id: ObjectId(id) };
            const updateDoc = {
                $set: {
                    status: updateOrder.status
                },
            };
            const result = await ordersCollection.updateOne(filter, updateDoc)
            res.json(result);
        })
        // GET ALL ORDERS 
        app.get('/all-orders', async (req, res) => {
            const cursor = ordersCollection.find({});
            const orders = await cursor.toArray();
            res.json(orders);
        });
        // GET ALL REVIEWS 
        app.get('/reviews', async (req, res) => {
            const cursor = reviewsCollection.find({});
            const reviews = await cursor.toArray();
            res.json(reviews);
        });
        // REVIEW POST 
        app.post('/reviews', async (req, res) => {
            const review = req.body;
            const result = await reviewsCollection.insertOne(review);
            res.json(result);
        });

        // ORDER POST 
        app.post('/orders', async (req, res) => {
            const order = req.body;
            const result = await ordersCollection.insertOne(order);
            res.json(result);
        });

        // DELETE ORDER 
        app.delete('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await ordersCollection.deleteOne(query);
            res.json(result);
        })
    } finally {
        // await client.close();
    }
}
run().catch(console.dir);





app.get('/', (req, res) => {
    res.send('Hello doctor client server!')
})

app.listen(port, () => {
    console.log(`listening at ${port}`)
})