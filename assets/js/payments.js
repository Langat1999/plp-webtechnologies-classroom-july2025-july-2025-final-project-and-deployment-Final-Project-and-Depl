// IntaSend Payment Integration JavaScript
// This script initializes IntaSend payment buttons on pages,
// handles payment callbacks, and communicates with backend to create payment sessions.

// Replace with your sandbox Publishable API Key (do NOT expose Secret API Key here)
const INTASEND_PUBLISHABLE_KEY = 'your_sandbox_publishable_key_here';

// Load IntaSend inline JS SDK dynamically
(function loadIntaSendSDK() {
  const script = document.createElement('script');
  script.src = 'https://cdn.intasend.com/intasend-inline-sdk.js';
  script.async = true;
  document.head.appendChild(script);
})();

// Initialize payment button with callbacks
function initIntaSendButton(buttonId, amount, description) {
  const button = document.getElementById(buttonId);
  if (!button) return;

  button.addEventListener('click', async () => {
    try {
      // Disable button to prevent multiple clicks
      button.disabled = true;
      button.textContent = 'Processing...';

      // Create payment session on backend securely
      const paymentSession = await createPaymentSession(amount, description);
      if (paymentSession.error) {
        alert('Payment session creation failed: ' + paymentSession.error);
        button.disabled = false;
        button.textContent = 'Pay Now';
        return;
      }

      // Initialize IntaSend payment inline
      IntaSendInline.init({
        publishableKey: INTASEND_PUBLISHABLE_KEY,
        paymentUrl: paymentSession.payment_url,
        onSuccess: (data) => {
          alert('Payment Successful! Tracking ID: ' + data.tracking_id);
          button.disabled = false;
          button.textContent = 'Pay Now';
        },
        onFailure: (data) => {
          alert('Payment Failed or Cancelled.');
          button.disabled = false;
          button.textContent = 'Pay Now';
        },
        onProgress: (data) => {
          console.log('Payment in progress...', data);
        }
      });

    } catch (error) {
      alert('Error during payment: ' + error.message);
      button.disabled = false;
      button.textContent = 'Pay Now';
    }
  });
}

// Communicate with backend to create payment session securely
async function createPaymentSession(amount, description) {
  try {
    const response = await fetch('http://localhost:5000/create-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, description, currency: 'KES' })
    });
    const text = await response.text();
    if (!text) {
      return { error: 'Empty response from payment server' };
    }
    try {
      return JSON.parse(text);
    } catch (e) {
      return { error: 'Invalid JSON response from payment server' };
    }
  } catch (error) {
    return { error: error.message };
  }
}

// Example: Create a custom payment button with amount input and description
function createCustomPaymentButton(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <label for="payment-amount">Amount (KES):</label>
    <input type="number" id="payment-amount" min="1" value="100" style="width: 100px; margin-right: 10px;" />
    <label for="payment-desc">Description:</label>
    <input type="text" id="payment-desc" value="Support SDG Project" style="width: 200px; margin-right: 10px;" />
    <button id="custom-pay-btn" class="btn">Pay Now</button>
  `;

  initIntaSendButton('custom-pay-btn', 100, 'Support SDG Project');

  // Update button event to use dynamic amount and description
  const payBtn = document.getElementById('custom-pay-btn');
  payBtn.addEventListener('click', async () => {
    const amountInput = document.getElementById('payment-amount');
    const descInput = document.getElementById('payment-desc');
    const amount = parseFloat(amountInput.value);
    const description = descInput.value.trim() || 'Support SDG Project';

    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    payBtn.disabled = true;
    payBtn.textContent = 'Processing...';

    const paymentSession = await createPaymentSession(amount, description);
    if (paymentSession.error) {
      alert('Payment session creation failed: ' + paymentSession.error);
      payBtn.disabled = false;
      payBtn.textContent = 'Pay Now';
      return;
    }

    IntaSendInline.init({
      publishableKey: INTASEND_PUBLISHABLE_KEY,
      paymentUrl: paymentSession.payment_url,
      onSuccess: (data) => {
        alert('Payment Successful! Tracking ID: ' + data.tracking_id);
        payBtn.disabled = false;
        payBtn.textContent = 'Pay Now';
      },
      onFailure: (data) => {
        alert('Payment Failed or Cancelled.');
        payBtn.disabled = false;
        payBtn.textContent = 'Pay Now';
      },
      onProgress: (data) => {
        console.log('Payment in progress...', data);
      }
    });
  });
}

// Export functions for usage in HTML pages
window.initIntaSendButton = initIntaSendButton;
window.createCustomPaymentButton = createCustomPaymentButton;
