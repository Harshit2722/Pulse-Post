require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/userModel');
const Post = require('./models/postModel');
const Notifications = require("./models/notificationModel")

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB for seeding...");

        await User.deleteMany({});
        await Post.deleteMany({});
        await Notifications.deleteMany({});
        console.log("Cleared existing data");

        // 1. Create a Seed Author if none exists
        let author = await User.findOne({ email: 'creator@pulsepost.com' });
        if (!author) {
            author = await User.create({
                name: 'Zen Creator',
                email: 'creator@pulsepost.com',
                password: 'password123', // Will be hashed by pre-save hook
                avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200',
                tagline: 'Minimalist. Photographer. Dreamer.',
                isVerified: true
            });
        }

        // 2. Sample Pulses
        const pulses = [
            {
                title: "Kyoto's Silent Bamboo",
                content: "Walking through Arashiyama at dawn is a meditative experience. The way the light filters through the bamboo is a reminder that nature is the ultimate architect.",
                category: "Travel",
                image: "https://images.unsplash.com/photo-1476124369491-e7addf5db371?auto=format&fit=crop&q=80&w=2000",
                author: author._id,
                likes: []
            },
            {
                title: "Shadows & Steel",
                content: "The city has its own rhythm, composed of light, shadow, and geometry. Finding beauty in the industrial corners.",
                category: "Photography",
                image: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&q=80&w=2000",
                author: author._id,
                likes: []
            },
            {
                title: "Digital Elegance",
                content: "In a world of noise, we strive for signal. Designing interfaces that breathe and code that flows like poetry.",
                category: "Technology",
                image: "https://images.unsplash.com/photo-1510511459019-5dee9954ff92?auto=format&fit=crop&q=80&w=2000",
                author: author._id,
                likes: []
            },
            {
                title: "The Botanical Desk",
                content: "Bringing a piece of the outside world into my workspace. Growth happens slowly, but it happens every single day.",
                category: "Lifestyle",
                image: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=2000",
                author: author._id,
                likes: []
            },
            {
                title: "Oil on Memory",
                content: "Capturing the texture of a dream. Art is the translation of the invisible into something we can finally touch.",
                category: "Art",
                image: "https://images.unsplash.com/photo-1541963463532-d68292c34b19?auto=format&fit=crop&q=80&w=2000",
                author: author._id,
                likes: []
            },
            {
                title: "Mindful Morning",
                content: "Finding stillness before the day begins. Wellness is a practice, not a destination.",
                category: "Wellness",
                image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=2000",
                author: author._id,
                likes: []
            }
        ];

        await Post.insertMany(pulses);
        console.log("Database seeded successfully with premium content! ✨");
        
        process.exit(0);
    } catch (error) {
        console.error("Seeding failed:", error);
        process.exit(1);
    }
};

seedData();
