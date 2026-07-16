import { Types } from 'mongoose';
import { ViewService } from './view.service';
import { ViewTargetType } from '../../libs/enums';

describe('ViewService', () => {
  const targetId = new Types.ObjectId().toString();
  const viewerId = new Types.ObjectId().toString();

  function createService(upsertedCount: number) {
    const exec = jest.fn().mockResolvedValue({ upsertedCount });
    const updateOne = jest.fn().mockReturnValue({ exec });
    const countExec = jest.fn().mockResolvedValue(1);
    const countDocuments = jest.fn().mockReturnValue({ exec: countExec });
    const findByIdAndUpdateExec = jest.fn().mockResolvedValue(null);
    const findByIdAndUpdate = jest
      .fn()
      .mockReturnValue({ exec: findByIdAndUpdateExec });

    const viewModel = {
      updateOne,
      countDocuments,
      create: jest.fn(),
    };
    const agencyModel = { findByIdAndUpdate };
    const serviceModel = { findByIdAndUpdate };
    const photoModel = { findByIdAndUpdate };
    const analyticsService = {
      recordAgencyProfileView: jest.fn(),
      recordServiceView: jest.fn(),
    };

    return {
      service: new ViewService(
        viewModel as any,
        agencyModel as any,
        serviceModel as any,
        photoModel as any,
        analyticsService as any,
      ),
      viewModel,
      serviceModel,
      analyticsService,
    };
  }

  it('does not increment when the registered viewer already viewed the target', async () => {
    const { service, serviceModel, analyticsService } = createService(0);

    await expect(
      service.recordView(targetId, ViewTargetType.SERVICE, viewerId),
    ).resolves.toBe(1);

    expect(serviceModel.findByIdAndUpdate).not.toHaveBeenCalled();
    expect(analyticsService.recordServiceView).not.toHaveBeenCalled();
  });

  it('increments only when upsert creates the registered viewer view', async () => {
    const { service, viewModel, serviceModel, analyticsService } =
      createService(1);

    await expect(
      service.recordView(targetId, ViewTargetType.SERVICE, viewerId),
    ).resolves.toBe(1);

    expect(viewModel.updateOne).toHaveBeenCalledWith(
      expect.objectContaining({
        viewer: expect.any(Types.ObjectId),
        targetId: expect.any(Types.ObjectId),
        targetType: ViewTargetType.SERVICE,
      }),
      expect.objectContaining({ $setOnInsert: expect.any(Object) }),
      { upsert: true },
    );
    expect(serviceModel.findByIdAndUpdate).toHaveBeenCalledTimes(1);
    expect(analyticsService.recordServiceView).toHaveBeenCalledTimes(1);
  });

  it('does not increment when a parallel upsert loses the unique-index race', async () => {
    const { service, viewModel, serviceModel, analyticsService } =
      createService(1);
    viewModel.updateOne.mockReturnValue({
      exec: jest.fn().mockRejectedValue({ code: 11000 }),
    });

    await expect(
      service.recordView(targetId, ViewTargetType.SERVICE, viewerId),
    ).resolves.toBe(1);

    expect(serviceModel.findByIdAndUpdate).not.toHaveBeenCalled();
    expect(analyticsService.recordServiceView).not.toHaveBeenCalled();
  });
});
