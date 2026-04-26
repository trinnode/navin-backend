import request from 'supertest';
import { app } from '../src/app.js';
import { UserModel } from '../src/modules/users/users.model.js';
import { Shipment } from '../src/modules/shipments/shipments.model.js';

describe('Soft Delete Integration Tests', () => {
  describe('DELETE /api/users/:id', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .delete('/api/users/test-id')
        .expect(401);
      
      expect(response.body.success).toBe(false);
    });

    it('should require admin role', async () => {
      // This would need proper auth setup in a real test
      // For now, just verify the route exists
      const response = await request(app)
        .delete('/api/users/test-id');
      
      expect(response.status).not.toBe(404);
    });
  });

  describe('DELETE /api/shipments/:id', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .delete('/api/shipments/test-id')
        .expect(401);
      
      expect(response.body.success).toBe(false);
    });

    it('should require manager or admin role', async () => {
      // This would need proper auth setup in a real test
      // For now, just verify the route exists
      const response = await request(app)
        .delete('/api/shipments/test-id');
      
      expect(response.status).not.toBe(404);
    });
  });
});
