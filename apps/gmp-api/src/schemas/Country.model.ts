import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CountryDocument = HydratedDocument<Country>;

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Country {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true, unique: true, uppercase: true, length: 2 })
  code: string;

  @Prop({ uppercase: true, length: 3 })
  code3?: string;

  @Prop()
  isoNumeric?: number;

  @Prop()
  region?: string;

  @Prop()
  subregion?: string;

  @Prop()
  flag?: string;

  @Prop()
  flagUrl?: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const CountrySchema = SchemaFactory.createForClass(Country);

// code and name already indexed via unique: true in @Prop
CountrySchema.index({ region: 1 });
CountrySchema.index({ isActive: 1 });
