import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Country, CountryDocument } from '../../schemas/Country.model';
import { CreateCountryInput, CountryFilterInput } from '../../libs/dto/country/country.input';

@Injectable()
export class CountryService {
  constructor(@InjectModel(Country.name) private countryModel: Model<CountryDocument>) {}

  async findAll(filter?: CountryFilterInput): Promise<CountryDocument[]> {
    const query: any = {};

    if (filter?.isActive !== undefined) query.isActive = filter.isActive;
    if (filter?.region) query.region = filter.region;
    if (filter?.search) {
      query.$or = [
        { name: { $regex: filter.search, $options: 'i' } },
        { code: { $regex: filter.search, $options: 'i' } },
      ];
    }

    return this.countryModel.find(query).sort({ name: 1 }).exec();
  }

  async findById(id: string): Promise<CountryDocument | null> {
    return this.countryModel.findById(id).exec();
  }

  async findByCode(code: string): Promise<CountryDocument | null> {
    return this.countryModel.findOne({ code: code.toUpperCase() }).exec();
  }

  async create(input: CreateCountryInput): Promise<CountryDocument> {
    const country = new this.countryModel(input);
    return country.save();
  }

  async update(id: string, data: Partial<CreateCountryInput>): Promise<CountryDocument | null> {
    return this.countryModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async toggleActive(id: string): Promise<CountryDocument | null> {
    const country = await this.countryModel.findById(id).exec();
    if (!country) return null;
    country.isActive = !country.isActive;
    return country.save();
  }
}
