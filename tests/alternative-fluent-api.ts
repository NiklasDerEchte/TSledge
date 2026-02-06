import express, { Request, Response } from 'express';
import mongoose, { Collection } from 'mongoose';

const router = express.Router();

router.get(
  '/:collection',
  async (req: Request<{ collection: string }>, res: Response<any>) => {
    // TODO: In this route, it still needs to be checked whether the collection may be queried at all (by this user?).
    // TODO: In this route, it must be checked whether the dataset belongs to an instance that the user is allowed to query (UserGroup)
    // TODO: Eventuell sind hier sachen wie EOL Joins und generelle aggregationen hier zu kompliziert für
    const {
      filter = undefined,
      offset = undefined,
      limit = undefined,
      order = undefined,
    } = req.body || {};

    let collection = req.params.collection;
    try {
      if (!collection) {
        res.status(400).json({ error: 'Collection name is required' });
        return;
      }
      let accessCollections = ['users'];
      if (!accessCollections.includes(collection)) {
        res.status(403).json({ error: 'Access to this collection is not allowed' });
        return;
      }
      if (mongoose.connection.db) {
        const data = await mongoose.connection.db
          .collection(collection)
          .find(filter || {})
          .skip(Number(offset) || 0)
          .limit(Number(limit) || 100)
          .sort(order || {})
          .toArray();
        res.json(data);
      } else {
        res.status(500).json({ error: 'Database connection not established' });
      }
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch data' });
    }
  }
);

export default router;
