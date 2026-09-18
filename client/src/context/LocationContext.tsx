import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { customerService } from '../services/api/customerService';
import { CustomerAddress } from '../types';
import { useAuth } from './AuthContext';

interface LocationContextType {
  selectedAddress: CustomerAddress | null;
  addresses: CustomerAddress[];
  isLoadingAddresses: boolean;
  isAddressModalOpen: boolean;
  selectAddress: (address: CustomerAddress) => void;
  openAddressModal: () => void;
  closeAddressModal: () => void;
  refreshAddresses: () => Promise<void>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<CustomerAddress | null>(null);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState<boolean>(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState<boolean>(false);

  const refreshAddresses = useCallback(async () => {
    if (!isAuthenticated) {
      setAddresses([]);
      setSelectedAddress(null);
      return;
    }

    try {
      setIsLoadingAddresses(true);
      const list = await customerService.getAddresses();
      setAddresses(list);

      // Default to the address marked is_default or the first address
      if (list.length > 0) {
        const defaultAddr = list.find((a) => a.is_default) || list[0];
        setSelectedAddress(defaultAddr);
      } else {
        setSelectedAddress(null);
      }
    } catch (err) {
      console.error('Error fetching addresses:', err);
    } finally {
      setIsLoadingAddresses(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshAddresses();
  }, [refreshAddresses]);

  const selectAddress = (address: CustomerAddress) => {
    setSelectedAddress(address);
    setIsAddressModalOpen(false);
  };

  const openAddressModal = () => setIsAddressModalOpen(true);
  const closeAddressModal = () => setIsAddressModalOpen(false);

  return (
    <LocationContext.Provider
      value={{
        selectedAddress,
        addresses,
        isLoadingAddresses,
        isAddressModalOpen,
        selectAddress,
        openAddressModal,
        closeAddressModal,
        refreshAddresses,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = (): LocationContextType => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};
