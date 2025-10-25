import orderModel from "../models/orderModel.js";
import productModel from "../models/productModel.js";
import userModel from "../models/userModel.js";
import stripe from "stripe";

// Global variables for payment
const currency = "pkr";
const deliveryCharges = 10 // 10 dollars
const taxPercentage = 0.02 // 2% tax charges

// Place order using COD
export const placeOrderCOD = async (req, res) => {
  try {
    const { items, address } = req.body;
    const userId = req.userId;

    if (items.length === 0) {
      return res.json({ success: false, message: "Please add product first" });
    }
    // calculate amount using Items
    let subtotal = await items.reduce(async (acc, item) => {
      const product = await productModel.findById(item.product);
      return (await acc) + product.offerPrice * item.quantity;
    }, 0);

    // Calculate total
    const taxAmount = subtotal * taxPercentage;
    const totalAmount = subtotal + taxAmount + deliveryCharges;

    await orderModel.create({
      userId,
      items,
      amount: totalAmount,
      address,
      paymentMethod: "COD",
    });

    // Clear user cart
    await userModel.findByIdAndUpdate(userId, { cartData: {} });

    return res.json({ success: true, message: "Order Placed" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Place order using Stripe
export const placeOrderStripe = async (req, res) => {
  try {
    const { items, address } = req.body;
    const userId = req.userId;
    const { origin } = req.headers;

    if (items.length === 0) {
      return res.json({ success: false, message: "Please add product first" });
    }

    let productData = [];

    // calculate subtotal using Items
    let subtotal = await items.reduce(async (acc, item) => {
      const product = await productModel.findById(item.product);
      productData.push({
        name: product.name,
        price: product.offerPrice,
        quantity: item.quantity,
      });
      return (await acc) + product.offerPrice * item.quantity;
    }, 0);

    // Calculate tax and total
    const taxAmount = subtotal * taxPercentage
    const amount = subtotal + taxAmount + deliveryCharges;

    // Save order before payment
    const order = await orderModel.create({
      userId,
      items,
      amount,
      address,
      paymentMethod: "stripe",
    });

    const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);

    // Create line_items for Stripe
    let line_items = productData.map((item) => {
      return {
        price_data: {
          currency: currency,
          product_data: { name: item.name },
          unit_amount: Math.floor(item.price * 100 * 277), // pure price (without tax) into pkr
        },
        quantity: item.quantity,
      };
    });

    // Add tax as separate line item
    line_items.push({
      price_data: {
        currency: currency,
        product_data: { name: "Tax (2%)" },
        unit_amount: Math.floor(taxAmount * 100 * 277), // into pkr
      },
      quantity: 1,
    });

    // Add delivery charge as separate line item
    line_items.push({
      price_data: {
        currency: currency,
        product_data: { name: "Delivery Charges" },
        unit_amount: Math.floor(deliveryCharges * 100 * 277), // into pkg
      },
      quantity: 1,
    });

    const session = await stripeInstance.checkout.sessions.create({
      line_items,
      mode: "payment",
      success_url: `${origin}/loader?next=my-orders`,
      cancel_url: `${origin}/cart`,
      metadata: {
        orderId: order._id.toString(),
        userId,
      },
    });

    return res.json({ success: true, url: session.url });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
};


// Stripe Webhooks for verifying payment through stripe
export const stripeWebhooks = async (request, response) => {
  // Stripe gateway initialization
  const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);

  const sig = request.headers["stripe-signature"];
  let event;

  try {
    event = stripeInstance.webhooks.constructEvent(
      request.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    response.status(400).send(`Webhook Error: ${error.message}`);
  }

  // Handle the event
  switch (event.type) {
    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object;
      const paymentIntentId = paymentIntent.id;

      // Getting Session Metadata
      const session = await stripeInstance.checkout.sessions.list({
        payment_intent: paymentIntentId,
      });

      const { orderId, userId } = session.data[0].metadata;
      // Mark Order as Paid
      await orderModel.findByIdAndUpdate(orderId, { isPaid: true });
      // Clear user cart
      await userModel.findByIdAndUpdate(userId, { cartData: {} });
      break;
    }
    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object;
      const paymentIntentId = paymentIntent.id;

      // Getting Session Metadata
      const session = await stripeInstance.checkout.sessions.list({
        payment_intent: paymentIntentId,
      });

      const { orderId } = session.data[0].metadata;
      await orderModel.findByIdAndDelete(orderId);
      break;
    }

    default:
      console.error(`unhandled event type ${event.type}`);
      break;
  }
  response.json({ received: true });
};

// All orders data for Frontend by UserId
export const userOrders = async (req, res) => {
  try {
    const userId = req.userId;

    const orders = await orderModel
      .find({ userId, $or: [{ paymentMethod: "COD" }, { isPaid: true }] })
      .populate("items.product")
      .sort({ createdAt: -1 });

    res.json({ success: true, orders });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// All orders data for admin panel
export const allOrders = async (req, res) => {
  try {
    const orders = await orderModel
      .find({
        $or: [{ paymentMethod: "COD" }, { isPaid: true }],
      })
      .populate("items.product")
      .sort({ createdAt: -1 });

    res.json({ success: true, orders });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// updating order status from admin panel
export const updateStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;
    await orderModel.findByIdAndUpdate(orderId, { status });
    res.json({ success: true, message: "Order Status Updated" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};
