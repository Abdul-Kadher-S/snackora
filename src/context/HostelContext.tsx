'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { DeliverySettings, HOSTEL_BLOCKS_CONFIG } from '@/types';

export const HOSTEL_BLOCKS = HOSTEL_BLOCKS_CONFIG.map(
  (b) => `${b.name} — ${b.timing}`
);

export const HOSTEL_NAMES = HOSTEL_BLOCKS_CONFIG.map((b) => b.name);

export interface CustomerProfile {
  id: string;
  phone: string;
  name: string;
  block: string | null;
  roomNumber: string | null;
  availableSnackpoints: number;
  hasPin?: boolean;
}

interface HostelContextType {
  selectedHostel: string;
  setSelectedHostel: (hostel: string) => void;
  savedRoom: string;
  setSavedRoom: (room: string) => void;
  savedName: string;
  setSavedName: (name: string) => void;
  savedPhone: string;
  setSavedPhone: (phone: string) => void;
  customer: CustomerProfile | null;
  isCustomerLoggedIn: boolean;
  customerLogin: (phone: string, pin: string) => Promise<{ success: boolean; error?: string; needPinSetup?: boolean }>;
  customerSetupPin: (payload: { phone: string; pin: string; confirmPin: string; name?: string; block?: string; roomNumber?: string }) => Promise<{ success: boolean; error?: string }>;
  customerLogout: () => Promise<void>;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;
  isOpen: boolean;
  operatingHours: string;
  bannerNotice: string;
  deliverySettings: DeliverySettings;
  whatsappGroupUrl: string;
  isDeliveryAvailable: (hostelName: string) => boolean;
  getDeliveryFee: (subtotal: number) => number;
  getFreeDeliveryRemaining: (subtotal: number) => number;
  refreshSettings: () => Promise<void>;
}

const HostelContext = createContext<HostelContextType | undefined>(undefined);

const DEFAULT_DELIVERY_SETTINGS: DeliverySettings = {
  deliveryCharge: 20,
  freeDeliveryThreshold: 200,
  annexDeliveryEnabled: true,
  noyyalNewDeliveryEnabled: true,
  noyyalOldDeliveryEnabled: true,
  noyyalDeliveryEnabled: true,
};

const DEFAULT_WHATSAPP_URL = 'https://chat.whatsapp.com/IwYuJsn8xTF5UDL1uk8hqb?s=cl&p=a&mlu=4&ilr=4';

export function HostelProvider({ children }: { children: React.ReactNode }) {
  const [selectedHostel, setSelectedHostelState] = useState(HOSTEL_BLOCKS[0]);
  const [savedRoom, setSavedRoomState] = useState('');
  const [savedName, setSavedNameState] = useState('');
  const [savedPhone, setSavedPhoneState] = useState('');
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const [isOpen, setIsOpen] = useState(true);
  const [operatingHours, setOperatingHours] = useState('6:00 PM – 3:30 AM');
  const [bannerNotice, setBannerNotice] = useState('⚡ Snackora is LIVE! Order snacks delivered to your room!');
  const [deliverySettings, setDeliverySettings] = useState<DeliverySettings>(DEFAULT_DELIVERY_SETTINGS);
  const [whatsappGroupUrl, setWhatsappGroupUrl] = useState(DEFAULT_WHATSAPP_URL);

  // Load preferences from localStorage
  useEffect(() => {
    try {
      const h = localStorage.getItem('snackora_selected_hostel');
      if (h) {
        // Map old names to new standard names
        if (h.includes('Noyyal New')) {
          setSelectedHostelState(HOSTEL_BLOCKS[0]);
        } else if (h.includes('Noyyal Old') || h.trim() === 'Noyyal' || h.startsWith('Noyyal —')) {
          setSelectedHostelState(HOSTEL_BLOCKS[1]);
        } else if (h.includes('Annex')) {
          setSelectedHostelState(HOSTEL_BLOCKS[2]);
        } else {
          const match = HOSTEL_BLOCKS.find((b) => b.startsWith(h.split(' — ')[0]));
          if (match) setSelectedHostelState(match);
          else setSelectedHostelState(HOSTEL_BLOCKS[0]);
        }
      } else {
        setSelectedHostelState(HOSTEL_BLOCKS[0]);
      }
      const r = localStorage.getItem('snackora_saved_room');
      if (r) setSavedRoomState(r);
      const n = localStorage.getItem('snackora_saved_name');
      if (n) setSavedNameState(n);
      const p =
        localStorage.getItem('snackora_saved_phone') ||
        localStorage.getItem('snackora_phone') ||
        localStorage.getItem('hb_user_phone');
      if (p) setSavedPhoneState(p);
    } catch {}
  }, []);

  const setSelectedHostel = (hostel: string) => {
    setSelectedHostelState(hostel);
    try {
      localStorage.setItem('snackora_selected_hostel', hostel);
    } catch {}
  };

  const setSavedRoom = (room: string) => {
    setSavedRoomState(room);
    try {
      localStorage.setItem('snackora_saved_room', room);
    } catch {}
  };

  const setSavedName = (name: string) => {
    setSavedNameState(name);
    try {
      localStorage.setItem('snackora_saved_name', name);
    } catch {}
  };

  const setSavedPhone = (phone: string) => {
    setSavedPhoneState(phone);
    try {
      localStorage.setItem('snackora_saved_phone', phone);
      localStorage.setItem('snackora_phone', phone);
      window.dispatchEvent(new Event('snackpoints_updated'));
    } catch {}
  };

  const isDeliveryAvailable = (hostelName: string): boolean => {
    const name = hostelName.split(' — ')[0].trim();
    if (name === 'Annex') {
      return deliverySettings.annexDeliveryEnabled !== false;
    }
    if (name === 'Noyyal New Block' || name === 'Noyyal New') {
      return deliverySettings.noyyalNewDeliveryEnabled !== false;
    }
    if (name === 'Noyyal Old Block' || name === 'Noyyal Old' || name === 'Noyyal') {
      return deliverySettings.noyyalOldDeliveryEnabled !== false && deliverySettings.noyyalDeliveryEnabled !== false;
    }
    return true;
  };

  const getDeliveryFee = (subtotal: number): number => {
    if (subtotal >= deliverySettings.freeDeliveryThreshold) return 0;
    return deliverySettings.deliveryCharge;
  };

  const getFreeDeliveryRemaining = (subtotal: number): number => {
    const remaining = deliverySettings.freeDeliveryThreshold - subtotal;
    return remaining > 0 ? remaining : 0;
  };

  // Fetch live store settings from API
  const refreshSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.isOpen !== undefined) {
          setIsOpen(data.isOpen === 'true');
        }
        if (data.operatingHours) {
          setOperatingHours(data.operatingHours);
        }
        if (data.announcement) {
          setBannerNotice(data.announcement);
        }
        // Delivery settings
        setDeliverySettings({
          deliveryCharge: data.delivery_charge ? parseFloat(data.delivery_charge) : DEFAULT_DELIVERY_SETTINGS.deliveryCharge,
          freeDeliveryThreshold: data.free_delivery_threshold ? parseFloat(data.free_delivery_threshold) : DEFAULT_DELIVERY_SETTINGS.freeDeliveryThreshold,
          annexDeliveryEnabled: data.annex_delivery_enabled !== 'false',
          noyyalNewDeliveryEnabled: data.noyyal_new_delivery_enabled !== 'false',
          noyyalOldDeliveryEnabled: (data.noyyal_old_delivery_enabled !== 'false' && data.noyyal_delivery_enabled !== 'false'),
          noyyalDeliveryEnabled: (data.noyyal_old_delivery_enabled !== 'false' && data.noyyal_delivery_enabled !== 'false'),
        });
        if (data.whatsapp_group_url) {
          setWhatsappGroupUrl(data.whatsapp_group_url);
        }
      }
    } catch (e) {
      console.error('Failed to fetch settings:', e);
    }
  };

  // Check customer session on mount
  useEffect(() => {
    fetch('/api/customer/auth')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.authenticated && data.customer) {
          setCustomer(data.customer);
          if (data.customer.name) setSavedNameState(data.customer.name);
          if (data.customer.phone) setSavedPhoneState(data.customer.phone);
          if (data.customer.roomNumber) setSavedRoomState(data.customer.roomNumber);
          if (data.customer.block) {
            const match = HOSTEL_BLOCKS.find((b) => b.startsWith(data.customer.block));
            if (match) setSelectedHostelState(match);
          }
        }
      })
      .catch(() => {});
  }, []);

  const customerLogin = async (phone: string, pin: string) => {
    try {
      const res = await fetch('/api/customer/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', phone, pin }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Login failed', needPinSetup: data.needPinSetup };
      }
      if (data.customer) {
        setCustomer(data.customer);
        if (data.customer.name) setSavedName(data.customer.name);
        if (data.customer.phone) setSavedPhone(data.customer.phone);
        if (data.customer.roomNumber) setSavedRoom(data.customer.roomNumber);
        if (data.customer.block) {
          const match = HOSTEL_BLOCKS.find((b) => b.startsWith(data.customer.block));
          if (match) setSelectedHostel(match);
        }
        try {
          window.dispatchEvent(new Event('snackpoints_updated'));
        } catch {}
      }
      return { success: true, needPinSetup: data.needPinSetup };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  };

  const customerSetupPin = async (payload: {
    phone: string;
    pin: string;
    confirmPin: string;
    name?: string;
    block?: string;
    roomNumber?: string;
  }) => {
    try {
      const res = await fetch('/api/customer/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'setup_pin', ...payload }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to setup PIN' };
      }
      if (data.customer) {
        setCustomer(data.customer);
        if (data.customer.name) setSavedName(data.customer.name);
        if (data.customer.phone) setSavedPhone(data.customer.phone);
        if (data.customer.roomNumber) setSavedRoom(data.customer.roomNumber);
        if (data.customer.block) {
          const match = HOSTEL_BLOCKS.find((b) => b.startsWith(data.customer.block));
          if (match) setSelectedHostel(match);
        }
        try {
          window.dispatchEvent(new Event('snackpoints_updated'));
        } catch {}
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  };

  const customerLogout = async () => {
    try {
      await fetch('/api/customer/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' }),
      });
    } catch {}
    setCustomer(null);
    setSavedPhone('');
    setSavedName('');
    setSavedRoom('');
    try {
      localStorage.removeItem('snackora_phone');
      localStorage.removeItem('snackora_saved_phone');
      localStorage.removeItem('snackora_saved_name');
      localStorage.removeItem('snackora_saved_room');
      window.dispatchEvent(new Event('snackpoints_updated'));
    } catch {}
  };

  useEffect(() => {
    refreshSettings();
  }, []);

  return (
    <HostelContext.Provider
      value={{
        selectedHostel,
        setSelectedHostel,
        savedRoom,
        setSavedRoom,
        savedName,
        setSavedName,
        savedPhone,
        setSavedPhone,
        customer,
        isCustomerLoggedIn: Boolean(customer),
        customerLogin,
        customerSetupPin,
        customerLogout,
        isLoginModalOpen,
        setIsLoginModalOpen,
        isOpen,
        operatingHours,
        bannerNotice,
        deliverySettings,
        whatsappGroupUrl,
        isDeliveryAvailable,
        getDeliveryFee,
        getFreeDeliveryRemaining,
        refreshSettings,
      }}
    >
      {children}
    </HostelContext.Provider>
  );
}

export function useHostel() {
  const context = useContext(HostelContext);
  if (!context) {
    throw new Error('useHostel must be used within a HostelProvider');
  }
  return context;
}
