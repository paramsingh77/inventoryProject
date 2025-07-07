// When selecting a vendor
const handleVendorSelect = (vendorId) => {
  console.log('Selected vendor ID:', vendorId);
  setFormData(prev => ({
    ...prev,
    supplier: vendorId
  }));
};