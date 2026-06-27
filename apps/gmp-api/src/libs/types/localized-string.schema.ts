import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class LocalizedString {
  @Prop({ required: true })
  uz: string;

  @Prop()
  ru?: string;

  @Prop()
  en?: string;

  @Prop()
  ko?: string;
}

export const LocalizedStringSchema = SchemaFactory.createForClass(LocalizedString);
