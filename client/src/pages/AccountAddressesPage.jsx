import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Check, Trash2, Edit2, X, AlertCircle } from 'lucide-react';
import { addressService } from '../services/addressService';

export const AccountAddressesPage = () => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    apartment: '',
    city: '',
    state: '',
    country: 'India',
    postalCode: '',
    landmark: '',
    isDefault: false,
  });

  const loadAddresses = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await addressService.getAddresses();
      setAddresses(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load delivery addresses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      name: '',
      phone: '',
      address: '',
      apartment: '',
      city: '',
      state: '',
      country: 'India',
      postalCode: '',
      landmark: '',
      isDefault: addresses.length === 0,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (addr) => {
    setEditingId(addr._id);
    setFormData({
      name: addr.name,
      phone: addr.phone,
      address: addr.address,
      apartment: addr.apartment || '',
      city: addr.city,
      state: addr.state,
      country: addr.country || 'India',
      postalCode: addr.postalCode,
      landmark: addr.landmark || '',
      isDefault: addr.isDefault || false,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this dispatch address?')) return;
    try {
      await addressService.deleteAddress(id);
      loadAddresses();
    } catch (err) {
      alert(err.message || 'Failed to remove address');
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await addressService.setDefault(id);
      loadAddresses();
    } catch (err) {
      alert(err.message || 'Failed to update default address');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await addressService.updateAddress(editingId, formData);
      } else {
        await addressService.createAddress(formData);
      }
      setShowModal(false);
      loadAddresses();
    } catch (err) {
      alert(err.message || 'Failed to save dispatch address');
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-urban-border pb-4 flex justify-between items-center">
        <div>
          <h2 className="font-serif text-2xl font-normal text-urban-black">Delivery Addresses</h2>
          <p className="text-xs text-urban-warm-grey mt-1">
            Manage your personal dispatch locations for seamless boutique acquisitions.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center space-x-1.5 px-4 py-2 bg-urban-black text-white text-xs uppercase tracking-editorial hover:bg-urban-teal transition-colors"
        >
          <Plus size={14} />
          <span>Add Address</span>
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-pulse">
          <div className="h-36 bg-urban-light-grey border border-urban-border" />
          <div className="h-36 bg-urban-light-grey border border-urban-border" />
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-900 border border-red-200 text-xs flex items-center space-x-2">
          <AlertCircle size={16} className="text-red-600" />
          <span>{error}</span>
        </div>
      ) : addresses.length === 0 ? (
        <div className="p-12 text-center bg-urban-light-grey border border-urban-border">
          <MapPin size={36} className="mx-auto text-urban-warm-grey mb-3" />
          <h3 className="font-serif text-base text-urban-black">No dispatch locations recorded</h3>
          <p className="text-xs text-urban-warm-grey mt-1 mb-4">
            Add your primary residence or atelier office for swift checkout.
          </p>
          <button
            onClick={handleOpenAdd}
            className="px-5 py-2 bg-urban-black hover:bg-urban-teal text-white text-xs uppercase tracking-editorial"
          >
            Add Address Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div
              key={addr._id}
              className={`p-5 border bg-white relative flex flex-col justify-between transition-all ${
                addr.isDefault ? 'border-urban-teal ring-1 ring-urban-teal/20 shadow-sm' : 'border-urban-border'
              }`}
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-serif text-base font-semibold text-urban-black">
                    {addr.name}
                  </h4>
                  {addr.isDefault && (
                    <span className="inline-flex items-center space-x-1 text-[10px] uppercase tracking-widest text-urban-teal font-semibold">
                      <Check size={12} />
                      <span>Primary Destination</span>
                    </span>
                  )}
                </div>

                <p className="text-xs text-urban-warm-grey leading-relaxed">
                  {addr.address}
                  {addr.apartment ? `, ${addr.apartment}` : ''}
                  <br />
                  {addr.city}, {addr.state} - {addr.postalCode}
                  <br />
                  {addr.country}
                  <br />
                  Phone: {addr.phone}
                </p>
              </div>

              {/* Address Actions */}
              <div className="pt-4 mt-4 border-t border-urban-border/60 flex items-center justify-between text-xs">
                <div>
                  {!addr.isDefault && (
                    <button
                      onClick={() => handleSetDefault(addr._id)}
                      className="text-urban-warm-grey hover:text-urban-teal uppercase tracking-widest text-[10px] font-medium"
                    >
                      Set As Default
                    </button>
                  )}
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleOpenEdit(addr)}
                    className="text-urban-warm-grey hover:text-urban-black p-1"
                    title="Edit"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(addr._id)}
                    className="text-urban-warm-grey hover:text-red-600 p-1"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Address Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white border border-urban-border max-w-lg w-full p-6 space-y-4 my-8">
            <div className="flex justify-between items-center border-b border-urban-border pb-3">
              <h3 className="font-serif text-lg font-semibold text-urban-black">
                {editingId ? 'Edit Dispatch Location' : 'New Dispatch Location'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-urban-warm-grey hover:text-urban-black"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-urban-warm-grey uppercase tracking-widest text-[10px] mb-1">
                    Recipient Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-white border border-urban-border px-3 py-2 text-xs focus:outline-none focus:border-urban-teal"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-urban-warm-grey uppercase tracking-widest text-[10px] mb-1">
                    Contact Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-white border border-urban-border px-3 py-2 text-xs focus:outline-none focus:border-urban-teal"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-urban-warm-grey uppercase tracking-widest text-[10px] mb-1">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full bg-white border border-urban-border px-3 py-2 text-xs focus:outline-none focus:border-urban-teal"
                  />
                </div>

                <div>
                  <label className="block text-urban-warm-grey uppercase tracking-widest text-[10px] mb-1">
                    Apartment / Suite
                  </label>
                  <input
                    type="text"
                    value={formData.apartment}
                    onChange={(e) => setFormData({ ...formData, apartment: e.target.value })}
                    className="w-full bg-white border border-urban-border px-3 py-2 text-xs focus:outline-none focus:border-urban-teal"
                  />
                </div>

                <div>
                  <label className="block text-urban-warm-grey uppercase tracking-widest text-[10px] mb-1">
                    Landmark
                  </label>
                  <input
                    type="text"
                    value={formData.landmark}
                    onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                    className="w-full bg-white border border-urban-border px-3 py-2 text-xs focus:outline-none focus:border-urban-teal"
                  />
                </div>

                <div>
                  <label className="block text-urban-warm-grey uppercase tracking-widest text-[10px] mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full bg-white border border-urban-border px-3 py-2 text-xs focus:outline-none focus:border-urban-teal"
                  />
                </div>

                <div>
                  <label className="block text-urban-warm-grey uppercase tracking-widest text-[10px] mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full bg-white border border-urban-border px-3 py-2 text-xs focus:outline-none focus:border-urban-teal"
                  />
                </div>

                <div>
                  <label className="block text-urban-warm-grey uppercase tracking-widest text-[10px] mb-1">
                    PIN / Postal Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    className="w-full bg-white border border-urban-border px-3 py-2 text-xs focus:outline-none focus:border-urban-teal"
                  />
                </div>

                <div>
                  <label className="block text-urban-warm-grey uppercase tracking-widest text-[10px] mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    disabled
                    value={formData.country}
                    className="w-full bg-urban-light-grey/80 border border-urban-border px-3 py-2 text-xs text-urban-warm-grey"
                  />
                </div>

                <div className="sm:col-span-2 pt-2">
                  <label className="flex items-center space-x-2 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isDefault}
                      onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                      className="accent-urban-teal"
                    />
                    <span>Set as primary default dispatch address</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-urban-border">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-urban-border text-xs uppercase tracking-widest text-urban-black hover:bg-urban-light-grey"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-urban-black hover:bg-urban-teal text-white text-xs uppercase tracking-widest font-semibold transition-colors"
                >
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
