// =============================================
// EcoTwin AI – models/Company.js
// =============================================
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const EquipmentSchema = new mongoose.Schema({
  name:      { type: String, required: true },
  type:      { type: String, enum: ['Boiler','Motor','Generator','Furnace','Compressor','Pump','Other'], default: 'Other' },
  capacity:  { type: Number },
  fuelType:  { type: String },
  threshold: { type: Number, default: 30 },    // kg/hr
}, { _id: true });

const ThresholdSchema = new mongoose.Schema({
  co2Safe:  { type: Number, default: 30 },     // kg/hr
  co2Warn:  { type: Number, default: 25 },
  co2Daily: { type: Number, default: 500 },    // kg/day
  noxLimit: { type: Number, default: 200 },    // mg/m³
  soxLimit: { type: Number, default: 350 },
  pm25:     { type: Number, default: 60 },
  pm10:     { type: Number, default: 100 },
}, { _id: false });

const AlertContactSchema = new mongoose.Schema({
  name:  { type: String },
  email: { type: String },
  phone: { type: String },
  role:  { type: String },
}, { _id: false });

const CompanySchema = new mongoose.Schema({
  accountId:    { type: String, default: () => 'ECO-' + uuidv4().slice(0,8).toUpperCase(), unique: true },
  companyName:  { type: String, required: true, trim: true },
  facilityName: { type: String },
  industryType: { type: String },
  employeeCount:{ type: String },
  city:         { type: String },
  country:      { type: String, default: 'India' },
  factoryArea:  { type: Number },
  prodCapacity: { type: String },
  facilityDesc: { type: String },
  gstNumber:    { type: String },
  // Equipment
  equipment:    [EquipmentSchema],
  shiftsPerDay: { type: String, default: '2 Shifts (16 hrs)' },
  workingDays:  { type: String, default: '6 days' },
  // Thresholds
  thresholds:   { type: ThresholdSchema, default: () => ({}) },
  // Alert contacts
  alertContacts: [AlertContactSchema],
  alertChannels: {
    emailAlerts: { type: Boolean, default: true },
    smsAlerts:   { type: Boolean, default: false },
    pushAlerts:  { type: Boolean, default: true },
  },
  // Compliance
  frameworks:   [{ type: String }],   // e.g. ['CPCB','ISO 14001']
  netZeroYear:  { type: Number },
  sustainNotes: { type: String },
  // Linked admin user
  adminUser:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Company', CompanySchema);
