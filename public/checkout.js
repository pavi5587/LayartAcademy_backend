const amountInput = document.getElementById("amount");
const payButton = document.getElementById("pay-button");
const statusBox = document.getElementById("status");

function showMessage(message, isError = false) {
  statusBox.textContent = message;
  statusBox.className = `message ${isError ? "error" : "success"}`;
  statusBox.style.display = "block";
}

async function fetchRazorpayKey() {
  const response = await fetch("/api/razorpay-key");
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Unable to load Razorpay key.");
  }
  const data = await response.json();
  return data.key_id;
}

async function createOrder(amountPaise) {
  const response = await fetch("/api/create-order", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: amountPaise,
      currency: "INR",
    }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Unable to create Razorpay order.");
  }

  return response.json();
}

async function verifyPayment(payload) {
  const response = await fetch("/api/verify-payment", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Payment verification failed.");
  }

  return response.json();
}

payButton.addEventListener("click", async () => {
  const amountValue = parseFloat(amountInput.value);
  if (Number.isNaN(amountValue) || amountValue <= 0) {
    showMessage("Enter a valid amount greater than 0.", true);
    return;
  }

  const amountPaise = Math.round(amountValue * 100);
  if (amountPaise < 100) {
    showMessage("Minimum payment amount is ₹1.00.", true);
    return;
  }

  payButton.disabled = true;
  showMessage("Creating order, please wait...");

  try {
    const keyId = await fetchRazorpayKey();
    const order = await createOrder(amountPaise);

    const options = {
      key: keyId,
      amount: order.amount,
      currency: order.currency,
      order_id: order.order_id,
      name: "Layart Academy",
      description: "Course purchase",
      handler: async function (response) {
        try {
          const verifyResponse = await verifyPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });

          if (verifyResponse.success) {
            showMessage("Payment successful and verified.");
          } else {
            showMessage(verifyResponse.message || "Payment verification failed.", true);
          }
        } catch (verifyError) {
          showMessage(verifyError.message, true);
        } finally {
          payButton.disabled = false;
        }
      },
      prefill: {
        name: "Layart Academy User",
        email: "customer@example.com",
        contact: "9999999999",
      },
      method: {
        card: true,
        upi: true,
        // netbanking: true,
        // wallet: true,
      },
      theme: {
        color: "#008cff",
      },
      modal: {
        ondismiss: function () {
          showMessage("Payment was cancelled by the user.", true);
          payButton.disabled = false;
        },
      },
    };

    const rzp = new Razorpay(options);
    rzp.on("payment.failed", function (response) {
      showMessage(response.error.description || "Payment failed.", true);
      payButton.disabled = false;
    });
    rzp.open();
  } catch (error) {
    showMessage(error.message, true);
    payButton.disabled = false;
  }
});
