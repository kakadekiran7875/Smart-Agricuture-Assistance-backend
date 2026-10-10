import mongoose from 'mongoose';

const marketPriceSchema = new mongoose.Schema({
  commodity: {
    type: String,
    required: true
  },
  modal_price: {
    type: Number,
    required: true
  },
  min_price: {
    type: Number,
    default: 0
  },
  max_price: {
    type: Number,
    default: 0
  },
  market: {
    type: String,
    required: true
  },
  district: {
    type: String
  },
  state: {
    type: String,
    default: 'Maharashtra'
  },
  arrival_date: {
    type: String
  },
  source: {
    type: String,
    default: 'data.gov.in'
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

marketPriceSchema.index({ commodity: 1, state: 1 });
marketPriceSchema.index({ updated_at: -1 });

const MarketPrice = mongoose.model('MarketPrice', marketPriceSchema);

export default MarketPrice;
