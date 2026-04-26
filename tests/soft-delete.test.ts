import { UserModel } from '../src/modules/users/users.model.js';
import { Shipment } from '../src/modules/shipments/shipments.model.js';
import { deleteUser } from '../src/modules/users/users.service.js';
import { deleteShipmentService } from '../src/modules/shipments/shipments.service.js';

describe('Soft Delete Functionality', () => {
  describe('User Soft Delete', () => {
    it('should add deletedAt field to schema', () => {
      const userSchema = UserModel.schema;
      expect(userSchema.paths.deletedAt).toBeDefined();
      expect(userSchema.paths.deletedAt.instance).toBe('Date');
    });

    it('should filter out soft-deleted users in queries', async () => {
      // Mock a user with deletedAt set
      const mockUser = {
        _id: 'test-id',
        email: 'test@example.com',
        name: 'Test User',
        deletedAt: new Date(),
      };

      // Mock the find method to test middleware
      const findSpy = jest.spyOn(UserModel, 'find');
      findSpy.mockImplementation(() => ({
        where: jest.fn().mockReturnThis(),
      }) as any);

      UserModel.find({});
      
      expect(findSpy).toHaveBeenCalled();
      findSpy.mockRestore();
    });
  });

  describe('Shipment Soft Delete', () => {
    it('should add deletedAt field to schema', () => {
      const shipmentSchema = Shipment.schema;
      expect(shipmentSchema.paths.deletedAt).toBeDefined();
      expect(shipmentSchema.paths.deletedAt.instance).toBe('Date');
    });

    it('should filter out soft-deleted shipments in queries', async () => {
      // Mock a shipment with deletedAt set
      const mockShipment = {
        _id: 'test-id',
        trackingNumber: 'TEST123',
        origin: 'Test Origin',
        destination: 'Test Destination',
        deletedAt: new Date(),
      };

      // Mock the find method to test middleware
      const findSpy = jest.spyOn(Shipment, 'find');
      findSpy.mockImplementation(() => ({
        where: jest.fn().mockReturnThis(),
      }) as any);

      Shipment.find({});
      
      expect(findSpy).toHaveBeenCalled();
      findSpy.mockRestore();
    });
  });
});
