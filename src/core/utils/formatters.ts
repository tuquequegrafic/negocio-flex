export function formatCurrency(amount: number, currency: string = 'S/'): string {
  return `${currency} ${amount.toFixed(2)}`;
}

export function formatDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('es-PE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateString;
  }
}

export function formatTime(timeString: string): string {
  return timeString;
}

export function generateWhatsAppLink(phone: string, message: string): string {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encoded}`;
}

export function isBusinessOpenNow(businessHours: Array<{ day_of_week: number; open_time: string; close_time: string; is_closed: boolean }>): { isOpen: boolean; text: string; details?: string } {
  if (!businessHours || businessHours.length === 0) {
    return { isOpen: true, text: 'Abierto hoy' };
  }

  const now = new Date();
  const currentDayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const todayHours = businessHours.find(h => h.day_of_week === currentDayOfWeek);

  if (!todayHours || todayHours.is_closed) {
    return { isOpen: false, text: 'Cerrado hoy' };
  }

  const [openH, openM] = todayHours.open_time.split(':').map(Number);
  const [closeH, closeM] = todayHours.close_time.split(':').map(Number);

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  if (currentMinutes >= openMinutes && currentMinutes <= closeMinutes) {
    return { 
      isOpen: true, 
      text: 'Abierto ahora', 
      details: `Cierra a las ${todayHours.close_time}` 
    };
  } else if (currentMinutes < openMinutes) {
    return { 
      isOpen: false, 
      text: 'Cerrado por ahora', 
      details: `Abre hoy a las ${todayHours.open_time}` 
    };
  } else {
    return { 
      isOpen: false, 
      text: 'Cerrado', 
      details: `Cerró a las ${todayHours.close_time}` 
    };
  }
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}

export const BUSINESS_TYPE_LABELS: Record<string, { label: string; iconName: string; defaultModules: string[] }> = {
  restaurant: {
    label: 'Restaurante / Bar / Cafetería',
    iconName: 'Utensils',
    defaultModules: ['products', 'categories', 'orders', 'appointments', 'delivery', 'promotions', 'gallery', 'whatsapp']
  },
  salon: {
    label: 'Peluquería / Barbería / Spa',
    iconName: 'Scissors',
    defaultModules: ['services', 'categories', 'appointments', 'promotions', 'gallery', 'whatsapp']
  },
  gym: {
    label: 'Gimnasio / Crossfit / Yoga',
    iconName: 'Dumbbell',
    defaultModules: ['products', 'services', 'categories', 'orders', 'appointments', 'promotions', 'gallery', 'whatsapp']
  },
  store: {
    label: 'Tienda / Ropa / Minimarket',
    iconName: 'ShoppingBag',
    defaultModules: ['products', 'categories', 'orders', 'delivery', 'promotions', 'gallery', 'whatsapp']
  },
  professional: {
    label: 'Profesional Independiente / Consultoría',
    iconName: 'Briefcase',
    defaultModules: ['services', 'categories', 'appointments', 'gallery', 'whatsapp']
  },
  custom: {
    label: 'Otro Tipo de Negocio',
    iconName: 'Sparkles',
    defaultModules: ['products', 'services', 'categories', 'whatsapp', 'gallery']
  }
};
