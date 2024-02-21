require('dotenv').config();

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import api from './api';

const app = express();
const port = process.env.PORT;

app.use(cors());
app.use(bodyParser.json());
app.use('/api', api);

app.listen(port, () => {
  console.log(`Server is listening at http://localhost:${port}`);
});