import mongoose from 'mongoose';

export class JoinRelation<T = any> {
  ref: mongoose.Model<T>;
  localField: string;
  alias: string;

  constructor(localField: string, ref: mongoose.Model<T>, alias: string | undefined = undefined) {
    this.ref = ref;
    this.localField = localField;
    this.alias = alias ? alias : ref.collection.name;
  }
}

export interface QueryBuilderConfig<T = any> {
  model: mongoose.Model<T>;
  select?: string[] | undefined; //TODO Eventuell den namen überarbeiten
  eachFunc?: (doc: any) => any;
  asyncEachFunc?: (doc: any) => Promise<any>;
}