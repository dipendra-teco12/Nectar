const paypal = require("../Config/paypal");
const Order = require("../Models/order.Model");
const Product = require("../Models/product.Model");
const createPayment = async (req, res) => {
  const { Products, address, location, userId } = req.body;

  req.session.orderData = {
    Products,
    address,
    location,
    userId,
  };

  const total = Products.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const create_payment_json = {
    intent: "sale",
    payer: { payment_method: "paypal" },
    redirect_urls: {
      return_url: "http://localhost:3000/api/pay/payment-success",
      cancel_url: "http://localhost:3000/api/pay/payment-cancel",
    },
    transactions: [
      {
        item_list: {
          items: Products.map((item) => ({
            name: item.name,
            sku: item.ProductId,
            price: item.price.toString(),
            currency: "USD",
            quantity: item.quantity,
          })),
        },
        amount: {
          currency: "USD",
          total: total.toFixed(2),
        },
        description: "Order payment via PayPal",
      },
    ],
  };

  paypal.payment.create(create_payment_json, function (error, payment) {
    if (error) {
      console.error(error);
      return res.status(500).json({ error: "Error creating payment" });
    } else {
      const approvalUrl = payment.links.find(
        (link) => link.rel === "approval_url"
      ).href;
      res.json({ approvalUrl });
    }
  });
};

const paymentSuccess = async (req, res) => {
  const payerId = req.query.PayerID;
  const paymentId = req.query.paymentId;

  const execute_payment_json = { payer_id: payerId };

  paypal.payment.execute(
    paymentId,
    execute_payment_json,
    async function (error, payment) {
      if (error) {
        console.error(error.response);
        return res.redirect("/payment-failed");
      }
      //   console.log("Session orderData:", req.session.orderData);
      const orderData = req.session.orderData;

      if (!orderData) {
        return res
          .status(400)
          .json({ message: "Order data missing from session" });
      }

      try {
        const { Products, address, location, userId } = orderData;

        const updatedProducts = Products.map((item) => ({
          ...item,
          total: item.quantity * item.price,
        }));

        const newOrder = new Order({
          userId,
          Products: updatedProducts,
          address,
          location: {
            type: location.type,
            coordinates: location.coordinates,
          },
        });

        await newOrder.save();

        for (let orderedProduct of Products) {
          const product = await Product.findById(orderedProduct.ProductId);
          if (!product) {
            return res.status(404).json({
              message: `Product not found: ${orderedProduct.ProductId}`,
            });
          }

          if (product.stock < orderedProduct.quantity) {
            return res
              .status(400)
              .json({ message: `Insufficient stock for ${product.name}` });
          }

          product.stock -= orderedProduct.quantity;
          await product.save();
        }

        req.session.orderData = null;

        res.status(201).json({
          message: "Order successfully created and payment completed!",
          order: newOrder,
        });
      } catch (err) {
        console.error("Error saving order after payment:", err);
        res
          .status(500)
          .json({ message: "Payment succeeded, but order creation failed." });
      }
    }
  );
};

const paymentCancel = (req, res) => {
  req.session.orderData = null;
  res.send("Payment was cancelled. Order not created.");
};

module.exports = {
  createPayment,
  paymentCancel,
  paymentSuccess,
};
