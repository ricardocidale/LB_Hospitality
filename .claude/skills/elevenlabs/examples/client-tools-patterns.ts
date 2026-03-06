/**
 * Common client tool patterns for ElevenLabs agents.
 * Copy and adapt these for your specific use case.
 */

/**
 * Navigation tools — let the agent navigate users around your app.
 */
export const navigationTools = {
  navigateToPage: ({ page }: { page: string }) => {
    window.location.href = page;
    return `Navigated to ${page}`;
  },

  openExternalLink: ({ url }: { url: string }) => {
    window.open(url, "_blank");
    return `Opened ${url} in new tab`;
  },

  goBack: () => {
    window.history.back();
    return "Navigated back";
  },

  scrollToSection: ({ sectionId }: { sectionId: string }) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      return `Scrolled to ${sectionId}`;
    }
    return `Section ${sectionId} not found`;
  },
};

/**
 * UI interaction tools — let the agent interact with your UI.
 */
export const uiTools = {
  showNotification: ({
    title,
    message,
    type,
  }: {
    title: string;
    message: string;
    type?: "info" | "success" | "warning" | "error";
  }) => {
    // Replace with your notification system (toast, alert, etc.)
    alert(`${title}: ${message}`);
    return `Showed ${type || "info"} notification: ${title}`;
  },

  toggleDarkMode: () => {
    document.body.classList.toggle("dark");
    const isDark = document.body.classList.contains("dark");
    return `Dark mode ${isDark ? "enabled" : "disabled"}`;
  },

  setLanguage: ({ language }: { language: string }) => {
    document.documentElement.lang = language;
    return `Language set to ${language}`;
  },

  openModal: ({ modalId }: { modalId: string }) => {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.style.display = "block";
      return `Opened modal ${modalId}`;
    }
    return `Modal ${modalId} not found`;
  },
};

/**
 * Context tools — give the agent information about the current state.
 */
export const contextTools = {
  getCurrentContext: () => {
    return JSON.stringify({
      url: window.location.href,
      path: window.location.pathname,
      title: document.title,
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
  },

  getFormData: ({ formId }: { formId: string }) => {
    const form = document.getElementById(formId) as HTMLFormElement;
    if (!form) return `Form ${formId} not found`;
    const data = new FormData(form);
    const obj: Record<string, string> = {};
    data.forEach((value, key) => {
      obj[key] = value.toString();
    });
    return JSON.stringify(obj);
  },

  getSelectedText: () => {
    const selection = window.getSelection()?.toString() || "";
    return selection || "No text selected";
  },
};

/**
 * Data tools — let the agent fetch or manipulate data.
 */
export const dataTools = {
  fetchApiData: async ({ endpoint }: { endpoint: string }) => {
    try {
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return JSON.stringify(data);
    } catch (error: any) {
      return `Error fetching data: ${error.message}`;
    }
  },

  saveToLocalStorage: ({
    key,
    value,
  }: {
    key: string;
    value: string;
  }) => {
    localStorage.setItem(key, value);
    return `Saved "${key}" to local storage`;
  },

  getFromLocalStorage: ({ key }: { key: string }) => {
    const value = localStorage.getItem(key);
    return value || `Key "${key}" not found in local storage`;
  },

  copyToClipboard: async ({ text }: { text: string }) => {
    try {
      await navigator.clipboard.writeText(text);
      return "Copied to clipboard";
    } catch {
      return "Failed to copy to clipboard";
    }
  },
};

/**
 * E-commerce tools — for shopping/product agents.
 */
export const ecommerceTools = {
  addToCart: async ({
    productId,
    quantity,
  }: {
    productId: string;
    quantity: number;
  }) => {
    // Replace with your cart API
    const response = await fetch("/api/cart/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, quantity }),
    });
    const result = await response.json();
    return `Added ${quantity}x product ${productId} to cart. Cart total: ${result.total}`;
  },

  searchProducts: async ({ query }: { query: string }) => {
    const response = await fetch(
      `/api/products/search?q=${encodeURIComponent(query)}`
    );
    const results = await response.json();
    return JSON.stringify(
      results.slice(0, 5).map((p: any) => ({
        name: p.name,
        price: p.price,
        id: p.id,
      }))
    );
  },

  getOrderStatus: async ({ orderId }: { orderId: string }) => {
    const response = await fetch(`/api/orders/${orderId}`);
    if (!response.ok) return `Order ${orderId} not found`;
    const order = await response.json();
    return JSON.stringify({
      status: order.status,
      estimatedDelivery: order.estimatedDelivery,
      items: order.items.length,
    });
  },
};
