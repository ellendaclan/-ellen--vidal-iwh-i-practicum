require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const HUBSPOT_ACCESS_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN;
const OBJECT_TYPE = process.env.CUSTOM_OBJECT_TYPE;
const PROPERTIES = (process.env.CUSTOM_OBJECT_PROPERTIES || 'name').split(',');

const hubspot = axios.create({
  baseURL: 'https://api.hubapi.com',
  headers: {
    Authorization: `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
  },
});

// 1) Homepage: list custom object records
app.get('/', async (req, res) => {
  try {
    const params = new URLSearchParams();
    params.append('properties', PROPERTIES.join(','));
    params.append('limit', '100');

    const { data } = await hubspot.get(`/crm/v3/objects/${OBJECT_TYPE}?${params.toString()}`);
    const records = data.results || [];
    res.render('homepage', {
      title: 'Custom Object List | Integrating With HubSpot I Practicum',
      properties: PROPERTIES,
      records,
    });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).send('Error fetching records from HubSpot.');
  }
});

// 2) Render the HTML form (updates.pug)
app.get('/update-cobj', (req, res) => {
  res.render('updates', {
    title: 'Update Custom Object Form | Integrating With HubSpot I Practicum',
    properties: PROPERTIES,
  });
});

// 3) Handle form POST, create a new record, then redirect home
app.post('/update-cobj', async (req, res) => {
  try {
    const props = {};
    PROPERTIES.forEach((p) => (props[p] = req.body[p] || ''));
    await hubspot.post(`/crm/v3/objects/${OBJECT_TYPE}`, { properties: props });
    res.redirect('/');
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).send('Error creating record in HubSpot.');
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`App running on http://localhost:${port}`));
