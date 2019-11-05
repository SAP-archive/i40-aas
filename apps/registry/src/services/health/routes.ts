import { Request, Response } from 'express';

export default [
  {
    path: '/health',
    method: 'get',
    handler: async (req: Request, res: Response) => {
      res.send('Server Up!');
    }
  }
];
