import { Types } from 'mongoose';

export interface T {
  [key: string]: any;
}

export interface StatisticModifier {
  _id: string | Types.ObjectId;
  targetKey: string;
  modifier: number;
}
