export const productValidation = {
  name: {
    required: true,
    minLength: 3,
    maxLength: 100,
    validate: (value) => {
      if (!value) return 'Product name is required';
      if (value.length < 3) return 'Product name must be at least 3 characters';
      if (value.length > 100) return 'Product name must be less than 100 characters';
      return null;
    }
  },
  sku: {
    required: true,
    pattern: /^[A-Za-z0-9-]+$/,
    validate: (value) => {
      if (!value) return 'SKU is required';
      if (!/^[A-Za-z0-9-]+$/.test(value)) return 'SKU must contain only letters, numbers, and hyphens';
      return null;
    }
  },
  price: {
    required: true,
    min: 0,
    validate: (value) => {
      if (!value) return 'Price is required';
      if (value < 0) return 'Price cannot be negative';
      return null;
    }
  },
  quantity: {
    required: true,
    min: 0,
    validate: (value) => {
      if (!value) return 'Quantity is required';
      if (value < 0) return 'Quantity cannot be negative';
      return null;
    }
  }
};

export const validateProduct = (product) => {
  const errors = {};
  Object.keys(productValidation).forEach(field => {
    const error = productValidation[field].validate(product[field]);
    if (error) errors[field] = error;
  });
  return errors;
}; 