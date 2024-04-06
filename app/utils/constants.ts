import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { Cluster, PublicKey, clusterApiUrl } from "@solana/web3.js";

export const cluster: Cluster = process.env.NEXT_PUBLIC_CLUSTER as Cluster || 'devnet';
export const endpoint: string = process.env.NEXT_PUBLIC_URL || clusterApiUrl(WalletAdapterNetwork.Devnet);
//export const endpoint: string = 'http://127.0.0.1:8899';

export const TRAITS_TYPE_INDEX = 1;

export const TRAIT_MAP_HATS = [
    "Aardvark", "Abstract", "Ape", "Bag", "Bagpipe", "Banana", "Bank", "Baseball Game Ball", "Basketball", "Bat", "Bear", "Beer", "Beet", "Bell", "Bigfoot Yeti", "Bigfoot", "Black Hole", "Blueberry", "Bomb", "Bonsai", "Boombox", "Boot", "Box", "Boxing Glove", "Brain", "Bubble Speech", "Bubblegum", "Burger Dollar Menu", "Cake", "Calculator", "Calendar", "Camcorder", "Canned Ham", "Car", "Cash Register", "Cassette Tape", "Cat", "Cd", "Chain", "Chainsaw", "Chameleon", "Chart Bars", "Cheese", "Chef Hat", "Cherry", "Chicken", "Chilli", "Chipboard", "Chips", "Chocolate", "Cloud", "Clover", "Clutch", "Coffee Bean", "Cone", "Console Handheld", "Cookie", "Cordless Phone", "Cotton Ball", "Cow", "Crab", "Crane", "Crochat", "Crown", "Crt Bsod", "Crystal Ball", "Diamond Blue", "Diamond Red", "Dictionary", "Dino", "Dna", "Dog", "Doughnut", "Drill", "Duck", "Ducky", "Earth", "Egg", "Faberge", "Factory Dark", "Fan", "Fence", "Film 35mm", "Filmstrip", "Fir", "Fire Hydrant", "Flamingo", "Flower", "Fox", "Frog", "Garlic", "Gavel", "Ghost B", "Glasses Big", "Gnome", "Goat", "Gold Coin", "Goldfish", "Grouper", "Hair", "Hard Hat", "Heart", "Helicopter", "High Heel", "Hockey Puck", "Horse Deep Fried", "Hotdog", "House", "Ice Pop B", "Igloo", "Island", "Jellyfish", "Jupiter", "Kangaroo", "Ketchup", "Laptop", "Lightning Bolt", "Lint", "Lips", "Lipstick 2", "Lock", "Macaroni", "Mailbox", "Maze", "Microwave", "Milk", "Mirror", "Mixer", "Moon", "Moose", "Mosquito", "Mountain Snow Cap", "Mouse", "Mug", "Mushroom", "Mustard", "Nigiri", "Noodles", "Onion", "Orangutan", "Orca", "Otter", "Outlet", "Owl", "Oyster", "Paintbrush", "Panda", "Paperclip", "Peanut", "Pencil Tip", "Peyote", "Piano", "Pickle", "Pie", "Piggy Bank", "Pill", "Pillow", "Pineapple", "Pipe", "Pirate Ship", "Pizza", "Plane", "Pop", "Pork Bao", "Potato", "Pufferfish", "Pumpkin", "Pyramid", "Queen Crown", "Rabbit", "Rainbow", "Rangefinder", "Raven", "Retainer", "Rgb", "Ring", "Road", "Robot", "Rock", "Rosebud", "Ruler Triangular", "Saguaro", "Sailboat", "Sandwich", "Saturn", "Saw", "Scorpion", "Shark", "Shower", "Skateboard", "Skeleton Hat", "Ski Lift", "Smile", "Snow Globe", "Snowmobile", "Spaghetti", "Sponge", "Squid", "Stapler", "Star Sparkles", "Steak", "Sunset", "Taco Classic", "Taxi", "Thumbs Up", "Toaster", "Toilet Paper Full", "Tooth", "Toothbrush Fresh", "Tornado", "Trash Can", "Turing", "Ufo", "Undead", "Unicorn", "Vent", "Void", "Volcano", "Volleyball", "Wall", "Wallet", "Wall Safe", "Washing Machine", "Watch", "Watermelon", "Wave", "Weed", "Weight", "Werewolf",];

export const TRAIT_MAP_BODIES: string[] = [
    "Bege Bsod", "Bege Crt", "Blue Sky", "Blue Grey", "Cold", "Computer Blue", "Dark Brown",
    "Dark Pink", "Fog Grey", "Gold", "Grayscale 7", "Grayscale 8", "Green", "Gunk", "Hot Brown",
    "Magenta", "Orange Yellow", "Orange", "Peachy B", "Peachy A", "Purple", "Red", "Red Pinkish",
    "Rust", "Slime Green", "Teal Light", "Teal", "Yellow", "Bege", "Grayscale 1",
    "Grayscale 9", "Ice Cold"
];
