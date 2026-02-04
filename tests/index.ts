import User from "./User";
import { CollectionOption } from '../src/types'
import { setup } from "./server";

export const collectionOptions: CollectionOption = {
  employee: {
    collectionFilter: ['firstName', 'lastName'],
    model: User,
  },
};

setup();