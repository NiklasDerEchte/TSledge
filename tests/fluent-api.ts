import express from 'express';
import { FluentExpressRequest, FluentExpressResponse, FluentPatternExecutor, QueryBuilder } from '../src';
import mongoose from 'mongoose';

const router = express.Router();

// collection is the route of collectionOptions
router.get(
  '/:collection',
  async (
    req: FluentExpressRequest,
    res: FluentExpressResponse
  ) => {
    let collectionName = req.params.collection;
    try {
      if (!collectionName) {
        console.log(`[ERROR] Collection name is required in the route parameter`);
        res.status(400).json({});
        return;
      }
      let model: mongoose.Model<any> | undefined;
      for (const modelName in mongoose.models) {
        let searchModel: mongoose.Model<any> | undefined = mongoose.models[modelName];
        if (!searchModel) {
          continue;
        }
        if (searchModel.collection.name === collectionName) {
          model = searchModel;
          break;
        }
      }
      if (!model) {
        console.log(`[ERROR] No model found for collection: ${collectionName}`);
        res.status(400).json({});
        return;
      }
      let queryBuilder = new QueryBuilder({
        model: model
      });
      let codec = await FluentPatternExecutor.getInstance().exec(req, queryBuilder);

      codec.sendToClient(res);
    } catch (e) {
      console.log(e);
      res.status(500).json();
    }
  }
);

export default router;
