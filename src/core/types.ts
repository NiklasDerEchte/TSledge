import mongoose from "mongoose";

export interface DefaultResponseBody extends Record<string, any> {
  data?: any[] | any;
  meta?: { total?: number };
  error?: string;
}

export class Codec<T = any> {
  content: T;
  returnCode: number;

  constructor(content: T, code: number = 202) {
    this.content = content;
    this.returnCode = code;
  }

  sendToClient(res: any) {
    if (this.content == null) {
      res.status(404).json({});
    }
    res.status(this.returnCode).json(this.content);
  }

  is1xx() {
    return this.returnCode >= 100 && this.returnCode <= 199;
  }
  is2xx() {
    return this.returnCode >= 200 && this.returnCode <= 299;
  }
  is3xx() {
    return this.returnCode >= 300 && this.returnCode <= 399;
  }
  is4xx() {
    return this.returnCode >= 400 && this.returnCode <= 499;
  }
}

export type DefaultCodec = Codec<DefaultResponseBody>;
export type PromiseDefaultCodec = Promise<Codec<DefaultResponseBody>>;

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