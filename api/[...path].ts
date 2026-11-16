import 'dotenv/config';
import express from 'express';
import { createApiApp } from '../server/createApp.ts';

const app = express();

app.use((req, _res, next) => {
  if (!req.url.startsWith('/api/')) {
    req.url = `/api${req.url.startsWith('/') ? req.url : `/${req.url}`}`;
  }
  next();
});

app.use(createApiApp());

export default app;
