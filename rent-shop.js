// Shared rent shop cart support for rent pages
const cartToggle = document.getElementById('cartToggle');
const cartCount = document.getElementById('cartCount');
const cartModal = document.getElementById('cartModal');
const cartItems = document.getElementById('cartItems');
const cartTotal = document.getElementById('cartTotal');
const cartClose = document.getElementById('cartClose');
const placeOrderButton = document.getElementById('placeOrder');
const clearCartButton = document.getElementById('clearCart');
const orderNotification = document.getElementById('orderNotification');
const orderEndpoint = '/orders';

let cart = JSON.parse(localStorage.getItem('rentCart') || '[]');

function saveCart() {
  localStorage.setItem('rentCart', JSON.stringify(cart));
  updateCartCount();
}

function updateCartCount() {
  if (cartCount) {
    const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalQty;
  }
}

function renderCart() {
  if (!cartItems) return;

  if (!cart.length) {
    cartItems.innerHTML = '<p class="empty-state">Your cart is empty. Add an appliance to begin.</p>';
    cartTotal.textContent = '₹0';
    return;
  }

  cartItems.innerHTML = cart.map((item, index) => `
    <div class="cart-item" data-index="${index}">
      <img src="${item.image}" alt="${item.name}">
      <div class="cart-item-details">
        <h4>${item.name}</h4>
        <p>${item.category}</p>
        <p>₹${item.price} / month</p>
        <p>Qty: ${item.quantity}</p>
      </div>
      <button class="cart-item-remove" type="button" data-index="${index}">Remove</button>
    </div>
  `).join('');

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  cartTotal.textContent = `₹${total.toLocaleString()}`;
}

function openCartModal() {
  if (!cartModal) return;
  cartModal.classList.add('active');
  cartModal.setAttribute('aria-hidden', 'false');
}

function closeCartModal() {
  if (!cartModal) return;
  cartModal.classList.remove('active');
  cartModal.setAttribute('aria-hidden', 'true');
}

function showNotification(message) {
  if (!orderNotification) return;
  orderNotification.textContent = message;
  orderNotification.classList.add('visible');
  setTimeout(() => orderNotification.classList.remove('visible'), 2800);
}

function addToCart(item) {
  if (!item || !item.name) return;
  const existing = cart.find((entry) => entry.name === item.name && entry.price === item.price);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ ...item, quantity: 1 });
  }
  saveCart();
  renderCart();
  openCartModal();
  showNotification(`${item.name} added to cart.`);
}

async function saveLocalOrder(order) {
  const existing = JSON.parse(localStorage.getItem('rentOrders') || '[]');
  existing.push(order);
  localStorage.setItem('rentOrders', JSON.stringify(existing));
}

function placeOrder() {
  if (!cart.length) return;
  if (placeOrderButton) placeOrderButton.disabled = true;

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const orderSummary = cart.map((item) => `${item.name} x${item.quantity}`).join(', ');
  const localOrder = {
    name: 'Online Order',
    phone: '-',
    email: '-',
    duration: 'N/A',
    details: orderSummary || 'Cart order',
    total,
    items: cart,
    createdAt: new Date().toLocaleString(),
  };
  saveLocalOrder(localOrder);

  const payload = { items: cart, total };

  (async () => {
    try {
      const response = await fetch(orderEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Order could not be placed.');
      }

      showNotification(result.message || 'Your order has been placed successfully!');
    } catch (error) {
      showNotification(error.message || 'Could not place the order to the server. Saved locally.');
    } finally {
      cart = [];
      saveCart();
      renderCart();
      closeCartModal();
      if (placeOrderButton) placeOrderButton.disabled = false;
    }
  })();
}

function removeCartItem(index) {
  cart = cart.filter((_, itemIndex) => itemIndex !== Number(index));
  saveCart();
  renderCart();
}

window.toggleMenu = function () {
  const navMenu = document.getElementById('navMenu');
  if (!navMenu) return;
  navMenu.classList.toggle('active');
};

window.addEventListener('DOMContentLoaded', () => {
  updateCartCount();
  renderCart();

  if (cartToggle) {
    cartToggle.addEventListener('click', openCartModal);
  }

  if (cartClose) {
    cartClose.addEventListener('click', closeCartModal);
  }

  if (cartModal) {
    cartModal.addEventListener('click', (event) => {
      if (event.target === cartModal) closeCartModal();
    });
  }

  if (placeOrderButton) {
    placeOrderButton.addEventListener('click', placeOrder);
  }

  if (clearCartButton) {
    clearCartButton.addEventListener('click', () => {
      cart = [];
      saveCart();
      renderCart();
      showNotification('Cart cleared.');
    });
  }

  document.body.addEventListener('click', (event) => {
    const cartButton = event.target.closest('.add-cart');
    if (cartButton) {
      const item = {
        name: cartButton.dataset.name,
        category: cartButton.dataset.category,
        price: Number(cartButton.dataset.price || 0),
        image: cartButton.dataset.image || 'images/hero.jpg',
      };
      addToCart(item);
      return;
    }

    const removeButton = event.target.closest('.cart-item-remove');
    if (removeButton) {
      removeCartItem(removeButton.dataset.index);
    }
  });
});