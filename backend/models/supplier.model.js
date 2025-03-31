const supplierSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  contact_person: String,
  phone: String,
  address: String,
  // Other fields...
}); 