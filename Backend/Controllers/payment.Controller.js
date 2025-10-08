const paypal = require("../Config/paypal");
const Order = require("../Models/order.Model");
const Product = require("../Models/product.Model");
const createPayment = async (req, res) => {
  try {
    const { Products } = req.body;
    const userId = req.user._id;
    // ✅ Safe calculation of total amount
    const address = "123 Default St, Default City";

    const location = {
      type: "Point",
      coordinates: [0, 0],
    };
    const totalAmount =
      Products && Products.length > 0
        ? Products.reduce((acc, item) => acc + item.price * item.quantity, 0)
        : 0;

    // Save "pending" order first
    const newOrder = new Order({
      userId,
      Products:
        Products?.map((item) => ({
          ProductId: item.ProductId,
          productName: item.productName,
          image: item.image,
          price: item.price,
          quantity: item.quantity,
          total: item.price * item.quantity,
        })) || [],
      address,
      location,
      totalAmount,
      status: "Pending",
    });

    await newOrder.save();

    const create_payment_json = {
      intent: "sale",
      payer: { payment_method: "paypal" },
      redirect_urls: {
        return_url: `http://localhost:5173/payment-success?orderId=${newOrder._id}`,
        cancel_url: `http://localhost:5173/payment-cancel?orderId=${newOrder._id}`,

        // ⬆️ Later replace with your deployed frontend URL
      },
      transactions: [
        {
          amount: {
            currency: "USD",
            total: totalAmount.toFixed(2).toString(), // ✅ must be string
          },
          description: `Products Order for user ${userId}`,
        },
      ],
    };

    paypal.payment.create(create_payment_json, (error, payment) => {
      if (error) {
        console.error("PayPal error:", error.response);
        return res.status(500).json({ error: error.response });
      }
      const approvalUrl = payment.links.find(
        (l) => l.rel === "approval_url"
      ).href;
      res.json({
        approvalUrl,
        orderId: newOrder._id, // ✅ return orderId
      });
    });
  } catch (err) {
    console.error("Error in createPayment:", err);
    res.status(500).json({ error: "Payment creation failed" });
  }
};

// EXECUTE PAYMENT
const executePayment = async (req, res) => {
  const { payerId, paymentId, orderId } = req.body;

  const order = await Order.findById(orderId);
  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }

  const execute_payment_json = { payer_id: payerId };

  paypal.payment.execute(
    paymentId,
    execute_payment_json,
    async (error, payment) => {
      if (error) {
        console.error("PayPal execute error:", error.response);
        return res
          .status(400)
          .json({ success: false, message: "Payment execution failed", error });
      }

      // ✅ Deduct stock safely
      for (let p of order.Products) {
        const product = await Product.findById(p.productId);
        if (product) {
          if (product.stock >= p.quantity) {
            product.stock -= p.quantity;
            await product.save();
          } else {
            console.warn(`Not enough stock for product ${product._id}`);
          }
        }
      }

      order.status = "Processing";
      order.paymentInfo = {
        id: payment.id,
        state: payment.state,
      };
      await order.save();

      res.json({
        success: true,
        message: "Payment completed successfully",
        order,
      });
    }
  );
};

// CANCEL PAYMENT
const paymentCancel = (req, res) => {
  req.session.orderData = null;
  res.json({
    success: false,
    message: "Payment was cancelled. Order not created.",
  });
};

module.exports = {
  createPayment,
  executePayment,
  paymentCancel,
};
