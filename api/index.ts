import 'dotenv/config';
import express from 'express';
import { createApiApp } from '../server/createApp.ts';

const app = express();

app.use((req, _res, next) => {
  const path = req.url.split('?')[0];

  if (path.startsWith('/api/index/uploads')) {
    req.url = `/uploads${req.url.slice('/api/index/uploads'.length) || '/'}`;
  } else if (path.startsWith('/api/index')) {
    req.url = `/api${req.url.slice('/api/index'.length) || '/'}`;
  } else if (!path.startsWith('/api/')) {
    req.url = `/api${req.url.startsWith('/') ? req.url : `/${req.url}`}`;
  }

  next();
});

app.use(createApiApp());

export default app;
