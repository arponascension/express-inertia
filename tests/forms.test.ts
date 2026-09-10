import { describe, it, expect, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { inertia } from '../src/index.js';

describe('Form Helpers', () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(inertia());
  });

  it('supports postForm as semantic alias for inertia()', async () => {
    app.post('/login', (req, res) => {
      res.inertia.postForm('Login', { email: req.body.email });
    });

    const res = await request(app)
      .post('/login')
      .send({ email: 'user@example.com' })
      .set('X-Inertia', 'true');

    expect(res.status).toBe(200);
    expect(res.body.component).toBe('Login');
    expect(res.body.props.email).toBe('user@example.com');
  });

  it('supports putForm, patchForm, deleteForm', async () => {
    app.put('/update', (req, res) => {
      res.inertia.putForm('Profile', { name: req.body.name });
    });

    app.patch('/update', (req, res) => {
      res.inertia.patchForm('Profile', { name: req.body.name });
    });

    app.delete('/delete', (req, res) => {
      res.inertia.deleteForm('Profile', { id: req.body.id });
    });

    const putRes = await request(app)
      .put('/update')
      .send({ name: 'Alice' })
      .set('X-Inertia', 'true');
    expect(putRes.body.component).toBe('Profile');
    expect(putRes.body.props.name).toBe('Alice');

    const patchRes = await request(app)
      .patch('/update')
      .send({ name: 'Bob' })
      .set('X-Inertia', 'true');
    expect(patchRes.body.component).toBe('Profile');
    expect(patchRes.body.props.name).toBe('Bob');

    const deleteRes = await request(app)
      .delete('/delete')
      .send({ id: 123 })
      .set('X-Inertia', 'true');
    expect(deleteRes.body.component).toBe('Profile');
    expect(deleteRes.body.props.id).toBe(123);
  });

  it('supports withFlash for attaching flash messages', async () => {
    app.post('/message', (req, res) => {
      res.inertia.withFlash('success', 'Profile updated!');
      res.inertia('Dashboard');
    });

    const res = await request(app)
      .post('/message')
      .set('X-Inertia', 'true');

    expect(res.status).toBe(200);
    expect(res.body.props.flash).toEqual({ success: 'Profile updated!' });
  });

  it('supports chaining withFlash before inertia()', async () => {
    app.post('/chain', (req, res) => {
      res.inertia
        .withFlash('success', 'Saved!')
        .withFlash('error', 'Warning')
        .inertia('Dashboard');
    });

    const res = await request(app)
      .post('/chain')
      .set('X-Inertia', 'true');

    expect(res.status).toBe(200);
    expect(res.body).toBeDefined();
    expect(res.body.props).toBeDefined();
    expect(res.body.props.flash).toEqual({
      success: 'Saved!',
      error: 'Warning',
    });
  });

  it('merges with existing shared props', async () => {
    app.use(
      inertia({
        shared: { appName: 'MyApp' },
      })
    );

    app.post('/merge', (req, res) => {
      res.inertia.withFlash('success', 'Done!');
      res.inertia('Dashboard');
    });

    const res = await request(app)
      .post('/merge')
      .set('X-Inertia', 'true');

    expect(res.body.props.appName).toBe('MyApp');
    expect(res.body.props.flash).toEqual({ success: 'Done!' });
  });
});
