export interface FoodItem {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
  active: boolean;
}

export interface CartItem {
  food: FoodItem;
  quantity: number;
}

export interface BillItem {
  foodId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface Bill {
  id: string;
  billNumber: string;
  items: BillItem[];
  subtotal: number;
  grandTotal: number;
  createdAt: string;
  updatedAt: string;
}

export interface PrinterSettings {
  connectionType: 'bluetooth' | 'usb';
  paperWidth: '58mm' | '80mm';
  connectedDeviceName?: string;
  connectedDeviceId?: string;
}

export interface DiscoveredPrinter {
  id: string;
  name: string;
  type: 'bluetooth' | 'usb';
  paired: boolean;
  device?: any; // BluetoothDevice or USBDevice reference
}

export interface ShopDetails {
  shopName: string;
  address: string;
  phone: string;
}

export interface TopSellingItem {
  name: string;
  image: string;
  sold: number;
  revenue: number;
}
