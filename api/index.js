const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const app = express();
const port = 8000;
const cors = require("cors");
app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const jwt = require("jsonwebtoken");
app.listen(port, "10.200.33.172", () => {
  console.log("Server is running on port 8000");
});

mongoose
  .connect("mongodb+srv://Ikshita:Ikshita@cluster0.07w0cgh.mongodb.net/", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.log("Error connecting to MongoDb", err);
  });

const User = require("./models/user");
const Order = require("./models/order");

const sendVerificationEmail = async (email, verificationToken) => {
  // Create a Nodemailer transporter
  const transporter = nodemailer.createTransport({
    // Configure the email service or SMTP details here
    service: "gmail",
    auth: {
      user: "ikshita.nukavarapu@gmail.com",
      pass: "mpkg ntmc xxfe wgqq",
    },
  });

  // Compose the email message
  const mailOptions = {
    from: "ikshita.nukavarapu@gmail.com",
    to: email,
    subject: "Email Verification..Test email",
    text: `Please click the following link to verify your email: http://10.200.33.172:8000/verify/${verificationToken}`,
  };

  // Send the email
  try {
    await transporter.sendMail(mailOptions);
    console.log("Verification email sent successfully");
  } catch (error) {
    console.error("Error sending verification email:", error);
  }
};
// Register a new user
// ... existing imports and setup ...

app.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if the email is already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("Email already registered:", email); // Debugging statement
      return res.status(400).json({ message: "Email already registered" });
    }

    // Create a new user
    const newUser = new User({ name, email, password });

    // Generate and store the verification token
    newUser.verificationToken = crypto.randomBytes(20).toString("hex");

    // Save the user to the database
    await newUser.save();

    // Debugging statement to verify data
    console.log("New User Registered:", newUser);

    // Send verification email to the user
    // Use your preferred email service or library to send the email
    sendVerificationEmail(newUser.email, newUser.verificationToken);

    res.status(201).json({
      message:
        "Registration successful. Please check your email for verification.",
    });
  } catch (error) {
    console.log("Error during registration:", error); // Debugging statement
    res.status(500).json({ message: "Registration failed" });
  }
});

//endpoint to verify the email
app.get("/verify/:token", async (req, res) => {
  try {
    const token = req.params.token;

    //Find the user witht the given verification token
    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      return res.status(404).json({ message: "Invalid verification token" });
    }

    //Mark the user as verified
    user.verified = true;
    user.verificationToken = undefined;

    await user.save();

    res.status(200).json({ message: "Email verified successfully" });
  } catch (error) {
    res.status(500).json({ message: "Email Verificatioion Failed" });
  }
});

const generateSecretKey = () => {
  // const secretKey = crypto.randomBytes(32).toString("hex");
  return "secretKey";
};

const secretKey = generateSecretKey();

//endpoint to login the user
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(email, password);
    //check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid password or email" });
    }
    //check if password is correct
    if (user.password !== password) {
      return res.status(401).json({ message: "Invalid Password" });
    }

    //generate a token

    const token = jwt.sign({ userId: user._id }, secretKey);
    res.status(200).json({ token });
  } catch (error) {
    res.status(500).json({ message: "Login Failed" });
  }
});

// endpoint to store a new address to the backend
app.post("/addresses", async (req, res) => {
  try {
    console.log('gggg')
    const { token, address } = req.body;
    let userId = jwt.verify(token, "secretKey");
    console.log(userId.userId);
    console.log(address);
    //find the user by the Userid
    userId = userId.userId;
    console.log(typeof userId);

    //error resolved..
    const objectId = new mongoose.Types.ObjectId(userId);
    console.log(objectId);
    const user = await User.findById(objectId);
    console.log(user);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    //add the new address to the users addresses array
    user.addresses.push(address);

    //save the updated user in the backend
    await user.save();

    res.status(200).json({ message: "Address created successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error adding address" });
  }
});

//after creating add a new Address frontend page
//endpoint to get all the addresses of a particular user
app.get("/addresses/:token", async (req, res) => {
  try {
    const token = req.params.token;
    const userId = jwt.verify(token, 'secretKey')
    // console.log(userId)
    const user = await User.findById(new mongoose.Types.ObjectId(userId.userId));
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const addresses = user.addresses;
    res.status(200).json({ addresses: addresses });
  } catch (error) {
    res.status(500).json({ message: "Error retrieveing the addresses" });
  }
});

//endpoint to store all the orders
// app.post("/orders", async (req, res) => {
//   try {
//     const { userId, cartItems, totalPrice, shippingAddress, paymentMethod } =
//       req.body;

//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     //create an array of product objects from the cart Items
//     const products = cartItems.map((item) => ({
//       name: item?.title,
//       quantity: item.quantity,
//       price: item.price,
//       image: item?.image,
//     }));

//     //create a new Order
//     const order = new Order({
//       user: userId,
//       products: products,
//       totalPrice: totalPrice,
//       shippingAddress: shippingAddress,
//       paymentMethod: paymentMethod,
//     });

//     await order.save();

//     res.status(200).json({ message: "Order created successfully!" });
//   } catch (error) {
//     console.log("error creating orders", error);
//     res.status(500).json({ message: "Error creating orders" });
//   }
// });

// //get the user profile
// app.get("/profile/:userId", async (req, res) => {
//   try {
//     const userId = req.params.userId;

//     const user = await User.findById(userId);

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     res.status(200).json({ user });
//   } catch (error) {
//     res.status(500).json({ message: "Error retrieving the user profile" });
//   }
// });

// app.get("/orders/:userId",async(req,res) => {
//   try{
//     const userId = req.params.userId;

//     const orders = await Order.find({user:userId}).populate("user");

//     if(!orders || orders.length === 0){
//       return res.status(404).json({message:"No orders found for this user"})
//     }

//     res.status(200).json({ orders });
//   } catch(error){
//     res.status(500).json({ message: "Error"});
//   }
// })