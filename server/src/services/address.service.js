import { Address } from '../models/Address.js';

export class AddressService {
  /**
   * Retrieves all dispatch addresses for a customer, default first
   */
  static async getUserAddresses(userId) {
    return Address.find({ user: userId }).sort({ isDefault: -1, createdAt: -1 });
  }

  /**
   * Creates a new dispatch address
   */
  static async createAddress(userId, data) {
    const count = await Address.countDocuments({ user: userId });

    // If this is the user's first address, make it default automatically
    let shouldBeDefault = data.isDefault === true || count === 0;

    if (shouldBeDefault) {
      await Address.updateMany({ user: userId }, { isDefault: false });
    }

    const address = await Address.create({
      user: userId,
      name: data.name,
      phone: data.phone,
      address: data.address,
      apartment: data.apartment || '',
      city: data.city,
      state: data.state,
      country: data.country || 'India',
      postalCode: data.postalCode,
      landmark: data.landmark || '',
      isDefault: shouldBeDefault,
    });

    return address;
  }

  /**
   * Updates an existing address
   */
  static async updateAddress(userId, addressId, data) {
    const address = await Address.findOne({ _id: addressId, user: userId });
    if (!address) {
      throw new Error('Address not found');
    }

    if (data.isDefault === true && !address.isDefault) {
      await Address.updateMany({ user: userId }, { isDefault: false });
      address.isDefault = true;
    }

    const fields = [
      'name',
      'phone',
      'address',
      'apartment',
      'city',
      'state',
      'country',
      'postalCode',
      'landmark',
    ];

    fields.forEach((field) => {
      if (data[field] !== undefined) {
        address[field] = data[field];
      }
    });

    await address.save();
    return address;
  }

  /**
   * Deletes an address
   */
  static async deleteAddress(userId, addressId) {
    const address = await Address.findOneAndDelete({ _id: addressId, user: userId });
    if (!address) {
      throw new Error('Address not found');
    }

    // If the deleted address was default, promote the newest remaining address to default
    if (address.isDefault) {
      const nextDefault = await Address.findOne({ user: userId }).sort({ createdAt: -1 });
      if (nextDefault) {
        nextDefault.isDefault = true;
        await nextDefault.save();
      }
    }

    return { message: 'Address removed successfully' };
  }

  /**
   * Marks an address as primary / default
   */
  static async setDefaultAddress(userId, addressId) {
    await Address.updateMany({ user: userId }, { isDefault: false });
    const address = await Address.findOneAndUpdate(
      { _id: addressId, user: userId },
      { isDefault: true },
      { new: true }
    );
    if (!address) {
      throw new Error('Address not found');
    }
    return address;
  }
}
