import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  SupportTicket,
  SupportTicketDocument,
} from '../../schemas/SupportTicket.model';
import {
  CreateSupportTicketInput,
  SupportTicketsInquiryInput,
  UpdateSupportTicketStatusInput,
} from '../../libs/dto/support/support.input';
import { SupportTicketsResult } from '../../libs/dto/support/support.type';
import { Message, SupportTicketStatus } from '../../libs/enums';

@Injectable()
export class SupportService {
  constructor(
    @InjectModel(SupportTicket.name)
    private readonly supportTicketModel: Model<SupportTicketDocument>,
  ) {}

  async create(
    input: CreateSupportTicketInput,
    user?: any,
  ): Promise<SupportTicketDocument> {
    try {
      return await this.supportTicketModel.create({
        ...input,
        user: user?._id ? new Types.ObjectId(user._id) : undefined,
        phoneNumber: user?.phoneNumber,
        role: user?.role,
      });
    } catch (err: any) {
      console.log('Error, SupportService.create:', err.message);
      throw new BadRequestException(Message.CREATE_FAILED);
    }
  }

  async getTickets(
    input: SupportTicketsInquiryInput,
  ): Promise<SupportTicketsResult> {
    const { status, text, page, limit } = input;
    const match: Record<string, any> = {};

    if (status) match.status = status;
    if (text) {
      match.$or = [
        { name: { $regex: text, $options: 'i' } },
        { email: { $regex: text, $options: 'i' } },
        { message: { $regex: text, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const result =
      await this.supportTicketModel.aggregate<SupportTicketsResult>([
        { $match: match },
        { $sort: { createdAt: -1 } },
        {
          $facet: {
            list: [{ $skip: skip }, { $limit: limit }],
            metaCounter: [{ $count: 'total' }],
          },
        },
      ]);

    return result[0] ?? { list: [], metaCounter: [] };
  }

  async updateStatus(
    input: UpdateSupportTicketStatusInput,
  ): Promise<SupportTicketDocument> {
    if (
      !Object.values(SupportTicketStatus).includes(
        input.status as SupportTicketStatus,
      )
    ) {
      throw new BadRequestException(Message.BAD_REQUEST);
    }

    const ticket = await this.supportTicketModel
      .findByIdAndUpdate(
        input.ticketId,
        { status: input.status },
        { new: true },
      )
      .exec();
    if (!ticket) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
    return ticket;
  }
}
