'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { DeliverySettings, HOSTEL_BLOCKS_CONFIG } from '@/types';

export const HOSTEL_BLOCKS = HOSTEL_BLOCKS_CONFIG.map(
  (b) => `${b.name} — ${b.timing}`
);

export const HOSTEL_NAMES = HOSTEL_BLOCKS_CONFIG.map((b) => b.name);

interface HostelContextType {
  selectedHostel: string;
  setSelectedHostel: (hostel: string) => void;
  savedRoom: string;
  setSavedRoom: (room: string) => void;
  savedName: string;
  setSavedName: (name: string) => void;
  savedPhone: string;
  setSavedPhone: (phone: string) => void;
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
  noyyalDeliveryEnabled: true,
};

const DEFAULT_WHATSAPP_URL = 'https://chat.whatsapp.com/IwYuJsn8xTF5UDL1uk8hqb?s=cl&p=a&mlu=4&ilr=4';

export function HostelProvider({ children }: { children: React.ReactNode }) {
  const [selectedHostel, setSelectedHostelState] = useState(HOSTEL_BLOCKS[0]);
  const [savedRoom, setSavedRoomState] = useState('');
  const [savedName, setSavedNameState] = useState('');
  const [savedPhone, setSavedPhoneState] = useState('');

  const [isOpen, setIsOpen] = useState(true);
  const [operatingHours, setOperatingHours] = useState('6:00 PM – 3:30 AM');
  const [bannerNotice, setBannerNotice] = useState('⚡ Snackora is LIVE! Order snacks delivered to your room!');
  const [deliverySettings, setDeliverySettings] = useState<DeliverySettings>(DEFAULT_DELIVERY_SETTINGS);
  const [whatsappGroupUrl, setWhatsappGroupUrl] = useState(DEFAULT_WHATSAPP_URL);

  // Load preferences from localStorage
  useEffect(() => {
    try {
      const h = localStorage.getItem('snackora_selected_hostel');
      if (h) setSelectedHostelState(h);
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
    switch (name) {
      case 'Annex':
        return deliverySettings.annexDeliveryEnabled;
      case 'Noyyal New':
        return deliverySettings.noyyalNewDeliveryEnabled;
      case 'Noyyal':
        return deliverySettings.noyyalDeliveryEnabled;
      default:
        return false;
    }
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
          noyyalDeliveryEnabled: data.noyyal_delivery_enabled !== 'false',
        });
        if (data.whatsapp_group_url) {
          setWhatsappGroupUrl(data.whatsapp_group_url);
        }
      }
    } catch (e) {
      console.error('Failed to fetch settings:', e);
    }
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
