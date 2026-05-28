import { Schema, Types, model } from 'mongoose';
import { isoDatePlugin } from '../../shared/plugins/isoDatePlugin.js';
import { IAnomaly, ANOMALY_SEVERITIES, ANOMALY_TYPES } from '../../shared/types/anomaly.js';

const AnomalySchema = new Schema(
  {
    shipmentId: { type: Types.ObjectId, ref: 'Shipment', required: true },
    type: { type: String, enum: ANOMALY_TYPES, required: true },
    severity: { type: String, enum: ANOMALY_SEVERITIES, required: true },
    message: { type: String, required: true },
    timestamp: { type: Date, required: true },
    resolved: { type: Boolean, default: false, required: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, strict: true }
);

AnomalySchema.plugin(isoDatePlugin);

AnomalySchema.index({ shipmentId: 1, timestamp: -1, _id: -1 });
AnomalySchema.index({ resolved: 1, timestamp: -1, _id: -1 });
AnomalySchema.index({ severity: 1, timestamp: -1, _id: -1 });
AnomalySchema.index({ severity: 1, shipmentId: 1, timestamp: -1, _id: -1 });

AnomalySchema.pre(['find', 'findOne', 'findOneAndUpdate', 'countDocuments'], function () {
  this.where({ deletedAt: null });
});

AnomalySchema.pre('aggregate', function () {
  this.pipeline().unshift({ $match: { deletedAt: null } });
});

export const Anomaly = model<IAnomaly>('Anomaly', AnomalySchema);
